use crate::state::user::AccessLevel;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::{AnnounceTo, ErrorType, ProcessReceive};

#[derive(Deserialize)]
pub struct ReceiveAccessLevelAdjustment {
    user: Uuid,
    access_level: AccessLevel,
}
impl ProcessReceive for ReceiveAccessLevelAdjustment {
    fn process(
        self,
        app: std::sync::Arc<std::sync::RwLock<crate::state::App>>,
        room_name: &str,
        addr: std::net::SocketAddr,
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
