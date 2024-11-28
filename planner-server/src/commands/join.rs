use crate::state::Color;

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
