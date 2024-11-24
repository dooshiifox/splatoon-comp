use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::state::user::User;

pub mod disconnect;
pub mod join;
pub mod user;

#[derive(Deserialize)]
pub struct Receive {
    id: Uuid,
    #[serde(flatten)]
    receive: ReceiveType,
}
#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ReceiveType {
    AccessLevelAdjustment(user::Receive),
}

#[derive(Serialize)]
pub struct Announce {
    id: Option<Uuid>,
    #[serde(flatten)]
    response: AnnounceType,
}
impl<T: Into<AnnounceType>> From<T> for Announce {
    fn from(value: T) -> Self {
        value.into().into_announce(None)
    }
}

#[derive(Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AnnounceType {
    Join(join::Announce),
    OnJoin(join::Respond),
    Disconnect(disconnect::Announce),
    UserChange { user: User },
}
impl AnnounceType {
    pub fn into_announce_with_id(self, id: Uuid) -> Announce {
        Announce {
            id: Some(id),
            response: self,
        }
    }

    pub fn into_announce(self, id: Option<Uuid>) -> Announce {
        Announce { id, response: self }
    }
}
