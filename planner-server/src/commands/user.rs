use std::{
    net::SocketAddr,
    sync::{Arc, RwLock},
};

use crate::state::{user::AccessLevel, App};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::{AnnounceTo, AnnounceType, ErrorType, ProcessReceive};

#[derive(Deserialize)]
pub struct ReceiveAccessLevelAdjustment {
    user: Uuid,
    access_level: AccessLevel,
}
impl ProcessReceive for ReceiveAccessLevelAdjustment {
    fn process(
        self,
        app: Arc<RwLock<App>>,
        room_name: &str,
        addr: SocketAddr,
    ) -> Result<AnnounceTo, ErrorType> {
        let mut app_write_lock = app.write().unwrap();
        let Some(room) = app_write_lock.get_room_mut(room_name) else {
            return UserChangeError::RoomDoesNotExist.into();
        };
        let Some(user) = room.get_user_from_addr(addr) else {
            // not sure when this would happen but dont feel comfortable
            // with an unwrap
            return UserChangeError::RoomDoesNotExist.into();
        };
        // Not allowed to promote/demote users.
        if user.access_level != AccessLevel::Admin {
            return UserChangeError::NoPermission.into();
        }

        let successful = room.change_access_level(self.user, self.access_level);
        if !successful {
            return UserChangeError::UserDoesNotExist.into();
        }

        Ok(AnnounceTo::None)
    }
}
#[derive(Serialize)]
#[serde(tag = "code", rename_all = "snake_case")]
pub enum UserChangeError {
    RoomDoesNotExist,
    NoPermission,
    UserDoesNotExist,
}

#[derive(Deserialize)]
pub struct ReceiveCanvas {
    canvas: u16,
}
impl ProcessReceive for ReceiveCanvas {
    fn process(
        self,
        app: Arc<RwLock<App>>,
        room_name: &str,
        addr: SocketAddr,
    ) -> Result<AnnounceTo, ErrorType> {
        {
            let mut app_write_lock = app.write().unwrap();
            let Some(room) = app_write_lock.get_room_mut(room_name) else {
                return UserChangeError::RoomDoesNotExist.into();
            };
            room.switch_canvas(addr, self.canvas);
        }
        let elements;
        let respond_user;
        {
            let app_read_lock = app.read().unwrap();
            let Some(room) = app_read_lock.get_room(room_name) else {
                return UserChangeError::RoomDoesNotExist.into();
            };
            let Some(user) = room.get_user_from_addr(addr) else {
                return UserChangeError::RoomDoesNotExist.into();
            };
            respond_user = user.clone();
            // Canvas was created in `switch_canvas`
            elements = room.get_canvas(self.canvas).unwrap().elements.clone();
        }

        Ok(AnnounceTo::ResponseAndAnnounce {
            respond: AnnounceType::CanvasResponse {
                canvas: self.canvas,
                elements,
            },
            announce: AnnounceType::UserChange {
                user: respond_user.into(),
            },
        })
    }
}
