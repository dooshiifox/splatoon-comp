use serde::Serialize;
use uuid::Uuid;

use super::AnnounceType;

/// Announces that a user disconnected from the server.
/// This could be from intentionally leaving the server or from connection issues.
#[derive(Serialize)]
pub struct Announce {
    pub(crate) user: Uuid,
}
impl From<Announce> for AnnounceType {
    fn from(value: Announce) -> Self {
        AnnounceType::Disconnect(value)
    }
}
