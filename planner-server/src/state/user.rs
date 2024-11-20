use super::{Color, RoomUser};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct User {
    color: Color,
    username: String,
    canvas: u16,
    uuid: Uuid,
    access_level: AccessLevel,
}
impl From<RoomUser> for User {
    fn from(value: RoomUser) -> Self {
        Self {
            color: value.color,
            username: value.username,
            canvas: value.canvas,
            uuid: value.uuid,
            access_level: value.access_level,
        }
    }
}

#[derive(
    Debug, Eq, PartialEq, Ord, PartialOrd, Clone, Copy, Default, Hash, Serialize, Deserialize,
)]
#[serde(rename_all = "snake_case")]
pub enum AccessLevel {
    #[default]
    View,
    Edit,
    Admin,
}
