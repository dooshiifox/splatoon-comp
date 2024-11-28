use std::fmt::Display;

use super::{Color, RoomUser};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct User {
    pub color: Color,
    pub username: String,
    pub canvas: u16,
    pub uuid: Uuid,
    pub access_level: AccessLevel,
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
impl Display for AccessLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            match self {
                AccessLevel::View => "view",
                AccessLevel::Edit => "edit",
                AccessLevel::Admin => "admin",
            },
        )
    }
}
