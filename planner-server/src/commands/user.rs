use crate::state::user;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct Receive {
    user: Uuid,
    access_level: user::AccessLevel,
}
#[derive(Serialize)]
pub enum Error {
    NoPermission,
    InvalidUser,
}
