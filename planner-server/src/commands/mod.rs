use crate::state::{element::Element, user::User, App};
use serde::{Deserialize, Serialize};
use std::{
    net::SocketAddr,
    sync::{Arc, RwLock},
};
use uuid::Uuid;

pub mod join;
pub mod selection;
pub mod user;

#[derive(Deserialize)]
pub struct ReceiveData {
    id: Option<Uuid>,
    #[serde(flatten)]
    receive: ReceiveType,
}
#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ReceiveType {
    AccessLevelAdjustment(user::ReceiveAccessLevelAdjustment),
    Selection(selection::Receive),
    Canvas(user::ReceiveCanvas),
}

impl ReceiveData {
    pub fn process(self, app: Arc<RwLock<App>>, room_name: &str, addr: SocketAddr) {
        let response = match self.receive {
            ReceiveType::AccessLevelAdjustment(r) => r.process(app.clone(), room_name, addr),
            ReceiveType::Selection(r) => r.process(app.clone(), room_name, addr),
            ReceiveType::Canvas(r) => r.process(app.clone(), room_name, addr),
        };
        app.read()
            .unwrap()
            .get_room(room_name)
            .inspect(|x| x.announce(response, addr, self.id));
    }
}
trait ProcessReceive {
    fn process(
        self,
        app: Arc<RwLock<App>>,
        room_name: &str,
        addr: SocketAddr,
    ) -> Result<AnnounceTo, ErrorType>;
}

#[derive(Serialize)]
pub enum AnnounceTo {
    /// Send an announcement with all the data to all users.
    All(AnnounceType),
    /// Respond to the user who sent the message.
    Respond(AnnounceType),
    /// Respond to the user with one message type, and announce to all other
    /// users with a different message type.
    ResponseAndAnnounce {
        respond: AnnounceType,
        announce: AnnounceType,
    },
    /// Doesn't send any announcement.
    None,
}

#[derive(Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AnnounceType {
    /// Emmited to existing users in the room when someone new joins it.
    Join {
        /// Information about the user who joined
        user: User,
    },
    /// Responds to the user who joined with initial information.
    OnJoin {
        /// The user that just joined (i.e., you)
        user: User,
        /// All the users currently logged in.
        users: Vec<User>,
        /// A list of all elements on the current mapmode.
        elements: Vec<Element>,
    },
    /// Announces that a user disconnected from the server.
    /// This could be from intentionally leaving the server or from connection issues.
    Disconnect {
        user: Uuid,
    },
    UserChange {
        user: User,
    },
    Selection {
        user_uuid: Uuid,
        newly_selected: Vec<Uuid>,
        newly_deselected: Vec<Uuid>,
    },
    SelectionResponse {
        user_uuid: Uuid,
        newly_selected: Vec<Uuid>,
        newly_deselected: Vec<Uuid>,
        failed_to_select: Vec<Uuid>,
    },
    CanvasResponse {
        canvas: u16,
        elements: Vec<Element>,
    },
}
impl AnnounceType {
    /// Announces this to all users.
    pub fn announce_to_all(self) -> AnnounceTo {
        AnnounceTo::All(self)
    }

    /// Responds to a user with this data.
    pub fn respond_to_sender(self) -> AnnounceTo {
        AnnounceTo::Respond(self)
    }
}

#[derive(Serialize)]
#[serde(untagged)]
pub enum ErrorType {
    Selection(selection::Error),
    UserChange(user::UserChangeError),
}
impl<T> From<selection::Error> for Result<T, ErrorType> {
    fn from(value: selection::Error) -> Self {
        Err(ErrorType::Selection(value))
    }
}
impl<T> From<user::UserChangeError> for Result<T, ErrorType> {
    fn from(value: user::UserChangeError) -> Self {
        Err(ErrorType::UserChange(value))
    }
}
