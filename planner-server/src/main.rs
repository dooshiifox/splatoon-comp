#![feature(async_drop)]
#![feature(let_chains)]
use std::{
    borrow::Cow,
    collections::HashMap,
    convert::Infallible,
    net::{IpAddr, Ipv4Addr, SocketAddr},
    sync::{Arc, RwLock},
    time::Duration,
};

use clap::Parser;
use futures_channel::mpsc::unbounded;
use futures_util::{future, pin_mut, StreamExt, TryStreamExt};
use hyper::{
    body::{Bytes, Incoming},
    header::{self, HeaderValue, CONNECTION, CONTENT_TYPE, SEC_WEBSOCKET_ACCEPT, UPGRADE},
    server::conn::http1,
    service::service_fn,
    Method, Request, Response, StatusCode, Version,
};
use hyper_util::rt::TokioIo;
use serde::Serialize;
use state::{user::AccessLevel, App, Color, RoomUser};
use tokio::{net::TcpListener, time};
use tokio_tungstenite::tungstenite::{
    protocol::{frame::coding::CloseCode, CloseFrame},
    Message,
};
use tracing::{error, info, level_filters::LevelFilter, trace, warn};
use uuid::Uuid;

pub(crate) mod commands;
pub(crate) mod state;

const PROTOCOL_VERSION: usize = 1;

const MIN_ROOM_NAME_LEN: usize = 3;
const MAX_ROOM_NAME_LEN: usize = 32;
const MIN_USERNAME_LEN: usize = 1;
const MAX_USERNAME_LEN: usize = 32;

#[derive(Parser)]
#[command(version, about, long_about = None)]
struct Cli {
    /// The IP address and port to host on.
    #[arg(default_value_t = SocketAddr::new(IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)), 10999))]
    ip: SocketAddr,
    /// The debug level to use. Can specify up to 3 times for increasing
    /// log levels.
    #[arg(short, long, action = clap::ArgAction::Count)]
    verbose: u8,
}

////////
// A lot of this code in this file is adapted from Tokio Tungstenite examples
// https://github.com/snapview/tokio-tungstenite/blob/master/examples/server-custom-accept.rs
////////

type AppState = Arc<RwLock<App>>;
async fn handle_connection(
    app: AppState,
    user: commands::join::Receive,
    ws_stream: tokio_tungstenite::WebSocketStream<TokioIo<hyper::upgrade::Upgraded>>,
    addr: SocketAddr,
) {
    let (tx, rx) = unbounded::<Message>();
    let (outgoing, incoming) = ws_stream.split();

    let room_name = user.room_name;
    {
        let mut app = app.write().unwrap();
        let room = app.get_or_insert_room(room_name.clone(), user.password);
        let admin = room.get_admin();
        let new_user = RoomUser {
            addr,
            tx,
            uuid: Uuid::new_v4(),
            username: user.username,
            color: user.color,
            canvas: user
                .canvas
                .unwrap_or(admin.map(|admin| admin.canvas).unwrap_or(0)),
            access_level: match admin {
                None => AccessLevel::Admin,
                Some(_) => room.get_config().get_default_access_level(),
            },
        };
        room.add_user(new_user);
    };

    let broadcast_incoming = incoming.try_for_each(|msg| {
        if msg.is_text() {
            let text = msg.to_text().unwrap();
            trace!("Received a message from {addr}: {text}");
            // Try parse as 'Receive'
            let receive = match serde_json::from_str::<commands::ReceiveData>(text) {
                Ok(t) => t,
                Err(_) => {
                    warn!("Couldn't parse message from {addr} as `Receive`: {text}");
                    return future::ok(());
                }
            };
            // Now process the request
            receive.process(app.clone(), &room_name, addr)
        }
        future::ok(())
    });

    let receive_from_others = rx.map(Ok).forward(outgoing);
    pin_mut!(broadcast_incoming, receive_from_others);
    future::select(broadcast_incoming, receive_from_others).await;

    trace!("{} disconnected", &addr);
    app.write().unwrap().disconnect_user(&room_name, &addr);
}

const UPGRADE_HEADER_VALUE: HeaderValue = HeaderValue::from_static("Upgrade");
const WEBSOCKET_HEADER_VALUE: HeaderValue = HeaderValue::from_static("websocket");
/// Checks if the incoming request can/should be upgraded to a websocket connection.
fn is_valid_request(req: &Request<Incoming>) -> bool {
    // Enforce the GET method (required for websockets to be established)
    if req.method() != Method::GET {
        return false;
    }

    // Require at least HTTP 1.1 (this is just a standard at this point)
    if req.version() < Version::HTTP_11 {
        return false;
    }

    // Require the 'Connection' header to read 'Upgrade'.
    // This is so the connection can be upgraded to a websocket connection
    let headers = req.headers();
    if !headers
        .get(header::CONNECTION)
        .and_then(|h| h.to_str().ok())
        .map(|h| {
            h.split([' ', ','])
                .any(|p| p.eq_ignore_ascii_case(UPGRADE_HEADER_VALUE.to_str().unwrap()))
        })
        .unwrap_or(false)
    {
        return false;
    }

    // Require the 'Upgrade' header to read 'websocket', just so we're able to
    // confirm the client wants a websocket.
    if !headers
        .get(header::UPGRADE)
        .and_then(|h| h.to_str().ok())
        .map(|h| h.eq_ignore_ascii_case("websocket"))
        .unwrap_or(false)
    {
        return false;
    }

    // Check that we're supporting the same websocket version!
    if !headers
        .get(header::SEC_WEBSOCKET_VERSION)
        .map(|h| h == "13")
        .unwrap_or(false)
    {
        return false;
    }

    // Verify we actually want to open a websocket and its likely safe to do so.
    if headers.get(header::SEC_WEBSOCKET_KEY).is_none() {
        return false;
    }

    true
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum JoinError {
    WebsocketError,
    ProtocolError {
        server: usize,
    },
    RoomMissing,
    RoomInvalidLength {
        min_len: u16,
        max_len: u16,
        specified_len: usize,
    },
    UsernameMissing,
    UsernameInvalidLength {
        min_len: u16,
        max_len: u16,
        specified_len: usize,
    },
    ColorInvalid,
    PasswordRequired,
    PasswordIncorrect,
}
impl JoinError {
    fn respond_websocket_error() -> Response<Body> {
        Response::builder()
            .status(StatusCode::BAD_REQUEST)
            .header(CONTENT_TYPE, "application/json")
            .body(Body::from(
                serde_json::to_string(&JoinError::WebsocketError).unwrap(),
            ))
            .unwrap()
    }

    async fn respond_on_websocket(
        &self,
        mut ws_stream: tokio_tungstenite::WebSocketStream<TokioIo<hyper::upgrade::Upgraded>>,
    ) {
        // Warning: the JSON-stringified string must be <= 123 bytes long,
        // for websocket reasons.
        // Whether this is a bug in the tungstenite implementation or just
        // from the websocket spec is unknown to me.
        let _ = ws_stream
            .close(Some(CloseFrame {
                reason: Cow::Borrowed(
                    &serde_json::to_string(&self).expect("failed to serialize message"),
                ),
                code: match self {
                    Self::WebsocketError => CloseCode::Error,
                    Self::ProtocolError { .. } => CloseCode::Library(4999),
                    // xxx0 - Missing or Required
                    // xxx1 - Invalid Format
                    // xxx2 - Invalid Length
                    // xxx3 - Incorrect

                    // xx0x - Room
                    // xx1x - Username
                    // xx2x - Color
                    // xx3x - Password
                    Self::RoomMissing => CloseCode::Library(4000),
                    Self::RoomInvalidLength { .. } => CloseCode::Library(4002),
                    Self::UsernameMissing => CloseCode::Library(4010),
                    Self::UsernameInvalidLength { .. } => CloseCode::Library(4012),
                    Self::ColorInvalid { .. } => CloseCode::Library(4021),
                    Self::PasswordRequired => CloseCode::Library(4030),
                    Self::PasswordIncorrect => CloseCode::Library(4033),
                },
            }))
            .await
            .inspect_err(|e| error!("Failed to send close to user: {e:#?}"));
    }
}

type Body = http_body_util::Full<Bytes>;
/// Handle a given request from the [`main`] loop.
///
/// Returns an error response if the connection cannot be upgraded to a
/// websocket or if the provided protocol version is not the same.
/// If the connection can be upgraded, it will do so as well as handle all
/// ingoing and outgoing websocket messages.
async fn handle_request(
    app: AppState,
    req: Request<Incoming>,
    addr: SocketAddr,
) -> Result<Response<Body>, Infallible> {
    if !is_valid_request(&req) {
        return Ok(JoinError::respond_websocket_error());
    }

    let headers = req.headers();
    let derived = headers
        .get(header::SEC_WEBSOCKET_KEY)
        .map(|k| tokio_tungstenite::tungstenite::handshake::derive_accept_key(k.as_bytes()));

    let mut params: HashMap<String, String> = req
        .uri()
        .query()
        .map(|v| {
            url::form_urlencoded::parse(v.as_bytes())
                .into_owned()
                .collect()
        })
        .unwrap_or_default();

    let ver = req.version();
    tokio::task::spawn(async move {
        match hyper::upgrade::on(req).await {
            Ok(upgraded) => {
                let upgraded = TokioIo::new(upgraded);
                let socket = tokio_tungstenite::WebSocketStream::from_raw_socket(
                    upgraded,
                    tokio_tungstenite::tungstenite::protocol::Role::Server,
                    None,
                );

                // Check the protocol matches
                let specified_protocol = params.remove("protocol");
                if !specified_protocol
                    .as_ref()
                    .and_then(|h| h.parse::<usize>().ok())
                    .map(|h| h == PROTOCOL_VERSION)
                    .unwrap_or(false)
                {
                    return JoinError::ProtocolError {
                        server: PROTOCOL_VERSION,
                    }
                    .respond_on_websocket(socket.await)
                    .await;
                }

                // Check the user has specified some required params to join a room
                // Remove the entry so we own the value instead of have a ref to it
                let room_name = params.remove("room");
                if room_name.as_ref().map(String::is_empty).unwrap_or(true) {
                    return JoinError::RoomMissing
                        .respond_on_websocket(socket.await)
                        .await;
                }

                let room_name = room_name.unwrap();
                if room_name.len() < MIN_ROOM_NAME_LEN || room_name.len() > MAX_ROOM_NAME_LEN {
                    return JoinError::RoomInvalidLength {
                        min_len: MIN_ROOM_NAME_LEN as u16,
                        max_len: MAX_ROOM_NAME_LEN as u16,
                        specified_len: room_name.len(),
                    }
                    .respond_on_websocket(socket.await)
                    .await;
                }

                let username = params.remove("username");
                if username.as_ref().map(String::is_empty).unwrap_or(true) {
                    return JoinError::UsernameMissing
                        .respond_on_websocket(socket.await)
                        .await;
                }
                let username = username.unwrap();
                if username.len() < MIN_USERNAME_LEN || username.len() > MAX_USERNAME_LEN {
                    return JoinError::UsernameInvalidLength {
                        min_len: MIN_USERNAME_LEN as u16,
                        max_len: MAX_USERNAME_LEN as u16,
                        specified_len: username.len(),
                    }
                    .respond_on_websocket(socket.await)
                    .await;
                }

                let color = match params.remove("color") {
                    Some(color) => {
                        if let Ok(color) = color.parse() {
                            color
                        } else {
                            return JoinError::ColorInvalid
                                .respond_on_websocket(socket.await)
                                .await;
                        }
                    }
                    None => Color::get_random_color(),
                };

                let canvas = params
                    .remove("canvas")
                    .and_then(|canvas| canvas.parse::<u16>().ok());

                // Because the `app.read().unwrap()` holds a read guard, we can't
                // just run `JoinError::<x>.respond_on_websocket().await`,
                // as the read guard can't be held across the `.await`
                let password = params.remove("password").filter(|p| !String::is_empty(p));
                let mut err = None;
                if let Some(room) = app.read().unwrap().get_room(&room_name) {
                    // If the room doesn't require a password but one was given,
                    // just accept it.
                    if room.requires_password() {
                        if password.is_none() {
                            err = Some(JoinError::PasswordRequired);
                        } else if !room.is_password_correct(password.as_deref()) {
                            err = Some(JoinError::PasswordIncorrect);
                        }
                    }
                }
                if let Some(err) = err {
                    return err.respond_on_websocket(socket.await).await;
                }

                let user = commands::join::Receive {
                    room_name: room_name.clone(),
                    password,
                    username,
                    color,
                    canvas,
                };

                handle_connection(app, user, socket.await, addr).await;
            }
            Err(e) => warn!("upgrade error: {}", e),
        }
    });

    let res = Response::builder()
        .status(StatusCode::SWITCHING_PROTOCOLS)
        .version(ver)
        .header(CONNECTION, UPGRADE_HEADER_VALUE)
        .header(UPGRADE, WEBSOCKET_HEADER_VALUE)
        .header(SEC_WEBSOCKET_ACCEPT, derived.unwrap())
        .body(Body::default())
        .unwrap();
    Ok(res)
}

#[tokio::main]
async fn main() {
    let cli = Cli::parse();

    let subscriber = tracing_subscriber::fmt()
        .with_max_level(match cli.verbose {
            0 => LevelFilter::WARN,
            1 => LevelFilter::INFO,
            2 => LevelFilter::DEBUG,
            _ => LevelFilter::TRACE,
        })
        .finish();
    tracing::subscriber::set_global_default(subscriber).unwrap();

    let addr = cli.ip;
    let listener = TcpListener::bind(addr).await.unwrap_or_else(|e| {
        panic!("Could not bind to {addr} - try specify a different port or IP address.\n{e}")
    });
    info!("Hosting server on ws://{addr}");

    let app: AppState = Arc::new(RwLock::new(App::new()));

    // Some connections auto-close the websocket after 30s-2m of receiving no data.
    // I believe Cloudflare does this. To prevent this, ping the client every
    // so often.
    let app_pinger = app.clone();
    tokio::spawn(async move {
        let mut interval = time::interval(Duration::from_secs(45));
        loop {
            interval.tick().await;
            app_pinger.read().unwrap().send_pings();
        }
    });

    loop {
        let (stream, remote_addr) = listener.accept().await.expect("Failed to accept request.");
        let app = app.clone();

        tokio::spawn(async move {
            let io = TokioIo::new(stream);
            let service = service_fn(move |req| handle_request(app.clone(), req, remote_addr));
            let conn = http1::Builder::new()
                .serve_connection(io, service)
                .with_upgrades();

            if let Err(err) = conn.await {
                warn!("failed to serve connection: {err:?}");
            }
        });
    }
}
