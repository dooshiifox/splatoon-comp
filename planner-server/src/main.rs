#![feature(async_drop)]
#![feature(let_chains)]

use std::{
    collections::HashMap,
    convert::Infallible,
    net::{IpAddr, Ipv4Addr, SocketAddr},
    sync::{Arc, RwLock},
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
use serde::{ser::SerializeStruct, Serialize, Serializer};
use state::{user::AccessLevel, App, Color, RoomUser};
use tokio::net::TcpListener;
use tokio_tungstenite::tungstenite::Message;
use uuid::Uuid;

pub mod commands;
pub mod state;

const PROTOCOL_VERSION: &str = "1";

#[derive(Parser)]
#[command(version, about, long_about = None)]
struct Cli {
    /// The IP address and port to host on.
    #[arg(default_value_t = SocketAddr::new(IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)), 10999))]
    ip: SocketAddr,
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
        println!(
            "Received a message from {}: {}",
            addr,
            msg.to_text().unwrap()
        );
        future::ok(())
    });

    let receive_from_others = rx.map(Ok).forward(outgoing);
    pin_mut!(broadcast_incoming, receive_from_others);
    future::select(broadcast_incoming, receive_from_others).await;

    println!("{} disconnected", &addr);
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

enum JoinError<'a> {
    WebsocketError,
    ProtocolError {
        server: &'static str,
        client: &'a str,
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
    ColorInvalid {
        specified: &'a str,
    },
    PasswordRequired,
    PasswordIncorrect,
}
impl JoinError<'_> {
    fn respond(&self) -> Response<Body> {
        Response::builder()
            .status(StatusCode::BAD_REQUEST)
            .header(CONTENT_TYPE, "application/json")
            .body(Body::from(serde_json::to_string(&self).unwrap()))
            .unwrap()
    }
}
impl Serialize for JoinError<'_> {
    fn serialize<S>(&self, s: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match *self {
            JoinError::WebsocketError => {
                let mut ser = s.serialize_struct("JoinError", 2)?;
                ser.serialize_field("error", "WebsocketError")?;
                ser.serialize_field(
                    "message",
                    "Please send a valid request to be upgraded to a websocket connection.",
                )?;
                ser.end()
            }
            JoinError::ProtocolError { server, client } => {
                let mut ser = s.serialize_struct("JoinError", 4)?;
                ser.serialize_field("error", "ProtocolError")?;
                ser.serialize_field(
                    "message",
                    "Specified protocol is not the same between the client and server.",
                )?;
                ser.serialize_field("server", server)?;
                ser.serialize_field("client", client)?;
                ser.end()
            }
            JoinError::RoomMissing => {
                let mut ser = s.serialize_struct("JoinError", 2)?;
                ser.serialize_field("error", "RoomMissing")?;
                ser.serialize_field("message", "Please specify a `room` in the query params.")?;
                ser.end()
            }
            JoinError::RoomInvalidLength {
                min_len,
                max_len,
                specified_len,
            } => {
                let mut ser = s.serialize_struct("JoinError", 5)?;
                ser.serialize_field("error", "RoomInvalidLength")?;
                ser.serialize_field("message", "Provided length of `room` is not valid.")?;
                ser.serialize_field("min_len", &min_len)?;
                ser.serialize_field("max_len", &max_len)?;
                ser.serialize_field("specified_len", &specified_len)?;
                ser.end()
            }
            JoinError::UsernameMissing => {
                let mut ser = s.serialize_struct("JoinError", 2)?;
                ser.serialize_field("error", "UsernameMissing")?;
                ser.serialize_field(
                    "message",
                    "Please specify a `username` in the query params.",
                )?;
                ser.end()
            }
            JoinError::UsernameInvalidLength {
                min_len,
                max_len,
                specified_len,
            } => {
                let mut ser = s.serialize_struct("JoinError", 5)?;
                ser.serialize_field("error", "UsernameInvalidLength")?;
                ser.serialize_field("message", "Provided length of `username` is not valid.")?;
                ser.serialize_field("min_len", &min_len)?;
                ser.serialize_field("max_len", &max_len)?;
                ser.serialize_field("specified_len", &specified_len)?;
                ser.end()
            }
            JoinError::ColorInvalid { specified } => {
                let mut ser = s.serialize_struct("JoinError", 3)?;
                ser.serialize_field("error", "ColorInvalid")?;
                ser.serialize_field("message", "Provided color is not valid.")?;
                ser.serialize_field("specified", specified)?;
                ser.end()
            }
            JoinError::PasswordRequired => {
                let mut ser = s.serialize_struct("JoinError", 2)?;
                ser.serialize_field("error", "PasswordRequired")?;
                ser.serialize_field("message", "A password is required to join this room, but one was not provided in the `X-Editor-Password` header.")?;
                ser.end()
            }
            JoinError::PasswordIncorrect => {
                let mut ser = s.serialize_struct("JoinError", 2)?;
                ser.serialize_field("error", "PasswordIncorrect")?;
                ser.serialize_field(
                    "message",
                    "The password specified when trying to join this room was not correct.",
                )?;
                ser.end()
            }
        }
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
    mut req: Request<Incoming>,
    addr: SocketAddr,
) -> Result<Response<Body>, Infallible> {
    if !is_valid_request(&req) {
        return Ok(JoinError::WebsocketError.respond());
    }

    let headers = req.headers();
    let derived = headers
        .get(header::SEC_WEBSOCKET_KEY)
        .map(|k| tokio_tungstenite::tungstenite::handshake::derive_accept_key(k.as_bytes()));

    // Check the protocol matches
    let specified_protocol = headers.get("x-editor-protocol");
    if !specified_protocol
        .map(|h| h == PROTOCOL_VERSION)
        .unwrap_or(false)
    {
        return Ok(JoinError::ProtocolError {
            server: PROTOCOL_VERSION,
            client: specified_protocol
                .and_then(|h| h.to_str().ok())
                .unwrap_or_default(),
        }
        .respond());
    }

    // Check the user has specified some required params to join a room
    let mut params: HashMap<String, String> = req
        .uri()
        .query()
        .map(|v| {
            url::form_urlencoded::parse(v.as_bytes())
                .into_owned()
                .collect()
        })
        .unwrap_or_default();

    // Remove the entry so we own the value instead of have a ref to it
    let room_name = params.remove("room");
    if room_name.as_ref().map(String::is_empty).unwrap_or(true) {
        return Ok(JoinError::RoomMissing.respond());
    }
    let room_name = room_name.unwrap();
    if room_name.len() < 3 || room_name.len() > 32 {
        return Ok(JoinError::RoomInvalidLength {
            min_len: 3,
            max_len: 32,
            specified_len: room_name.len(),
        }
        .respond());
    }

    let username = params.remove("username");
    if username.as_ref().map(String::is_empty).unwrap_or(true) {
        return Ok(JoinError::UsernameMissing.respond());
    }
    let username = username.unwrap();
    if username.len() < 3 || username.len() > 32 {
        return Ok(JoinError::UsernameInvalidLength {
            min_len: 3,
            max_len: 32,
            specified_len: username.len(),
        }
        .respond());
    }

    let color = match params.remove("color") {
        Some(color) => {
            if let Ok(color) = color.parse() {
                color
            } else {
                return Ok(JoinError::ColorInvalid { specified: &color }.respond());
            }
        }
        None => Color::get_random_color(),
    };

    let password = headers.get("x-editor-password").and_then(|f| {
        if f.is_empty() {
            None
        } else {
            Some(f.to_str().map(|f| f.to_string()).unwrap_or_default())
        }
    });
    if let Some(room) = app.read().unwrap().get_room(&room_name) {
        // If the room doesn't require a password but one was given,
        // just accept it.
        if room.requires_password() {
            if password.is_none() {
                return Ok(JoinError::PasswordRequired.respond());
            }
            if !room.is_password_correct(password.as_deref()) {
                return Ok(JoinError::PasswordIncorrect.respond());
            }
        }
    }

    let user = commands::join::Receive {
        room_name: room_name.clone(),
        password,
        username,
        color,
        canvas: None,
    };

    let ver = req.version();
    tokio::task::spawn(async move {
        match hyper::upgrade::on(&mut req).await {
            Ok(upgraded) => {
                let upgraded = TokioIo::new(upgraded);
                handle_connection(
                    app,
                    user,
                    tokio_tungstenite::WebSocketStream::from_raw_socket(
                        upgraded,
                        tokio_tungstenite::tungstenite::protocol::Role::Server,
                        None,
                    )
                    .await,
                    addr,
                )
                .await;
            }
            Err(e) => println!("upgrade error: {}", e),
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

    let addr = cli.ip;
    let listener = TcpListener::bind(addr).await.unwrap_or_else(|e| {
        panic!("Could not bind to {addr} - try specify a different port or IP address.\n{e}")
    });
    println!("Hosting server on {addr}");

    let app: AppState = Arc::new(RwLock::new(App::new()));

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
                eprintln!("failed to serve connection: {err:?}");
            }
        });
    }
}
