use serde::Serialize;

use crate::state::{element, user, Color};

use super::AnnounceType;

/// This is not sent as a command but rather is built by [`handle_request`]
/// for [`handle_connection`] to parse.
///
/// [`handle_request`]: crate::handle_request
/// [`handle_connection`]: crate::handle_connection
pub struct Receive {
    pub(crate) room_name: String,
    pub(crate) password: Option<String>,
    pub(crate) username: String,
    pub(crate) color: Color,
    pub(crate) canvas: Option<u16>,
}

#[derive(Serialize)]
pub struct Respond {
    /// The user that just joined (i.e., you)
    pub(crate) user: user::User,
    /// All the users currently logged in.
    pub(crate) users: Vec<user::User>,
    /// A list of all elements on the current mapmode.
    pub(crate) elements: Vec<element::Element>,
}
impl From<Respond> for AnnounceType {
    fn from(value: Respond) -> Self {
        AnnounceType::OnJoin(value)
    }
}

#[derive(Serialize)]
pub struct Announce {
    /// Information about the user who joined
    pub(crate) user: user::User,
}
impl From<Announce> for AnnounceType {
    fn from(value: Announce) -> Self {
        AnnounceType::Join(value)
    }
}
