use futures_channel::mpsc::UnboundedSender;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, net::SocketAddr};
use tokio_tungstenite::tungstenite::Message;
use tracing::{trace, warn};
use user::AccessLevel;
use uuid::Uuid;

pub mod color;
pub mod element;
pub mod user;

pub use color::Color;

use crate::commands;

#[derive(Default, Debug)]
pub struct App {
    rooms: HashMap<String, Room>,
}
impl App {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn get_room(&self, name: &str) -> Option<&Room> {
        self.rooms.get(name)
    }
    pub fn get_or_insert_room(&mut self, name: String, password: Option<String>) -> &mut Room {
        self.rooms
            .entry(name.clone())
            .or_insert_with(|| Room::new(name, password))
    }
    pub fn get_room_mut(&mut self, name: &str) -> Option<&mut Room> {
        self.rooms.get_mut(name)
    }
    /// Disconnect a user from a room.
    ///
    /// Returns `true` if the user was removed from the list of users for the room.
    pub fn disconnect_user(&mut self, room_name: &str, addr: &SocketAddr) -> bool {
        if let Some(room) = self.get_room_mut(room_name) {
            let removed_user = room.remove_user(addr);
            // Delete the room if noone is left in it.
            if room.users.is_empty() {
                room.save_to_file();
                self.rooms.remove(room_name);
            }
            removed_user
        } else {
            false
        }
    }
}

#[derive(Debug)]
pub struct Room {
    /// The name of this room.
    name: String,
    /// All users currently in this room.
    users: Vec<RoomUser>,
    /// All canvases currently in this room.
    canvases: HashMap<u16, RoomCanvas>,
    /// Config info about the room.
    config: RoomConfig,
}
impl Room {
    /// Creates a new empty room.
    pub fn new(room_name: String, room_password: Option<String>) -> Room {
        Room {
            name: room_name,
            users: vec![],
            canvases: HashMap::new(),
            config: RoomConfig::new(room_password),
        }
    }

    pub fn get_config(&self) -> &RoomConfig {
        &self.config
    }
    pub fn is_password_correct(&self, guessed_password: Option<&str>) -> bool {
        self.config.password.as_deref() == guessed_password
    }
    pub fn requires_password(&self) -> bool {
        self.config.password.is_some()
    }

    /// Returns the given canvas.
    pub fn get_or_create_canvas(&mut self, id: u16) -> &mut RoomCanvas {
        self.canvases.entry(id).or_default()
    }

    /// Retrieves a user.
    pub fn get_user(&self, user: Uuid) -> Option<&RoomUser> {
        self.users.iter().find(|u| u.uuid == user)
    }
    /// Retrieves a user, mutably.
    pub fn get_user_mut(&mut self, user: Uuid) -> Option<&mut RoomUser> {
        self.users.iter_mut().find(|u| u.uuid == user)
    }
    /// Returns the current admin of the room
    pub fn get_admin(&self) -> Option<&RoomUser> {
        self.users
            .iter()
            .find(|x| x.access_level == AccessLevel::Admin)
    }
    /// Adds a user to the room.
    pub fn add_user(&mut self, user: RoomUser) {
        trace!(
            "User `{}` [{}] [{}] [{}] joined `{}` with {} perms",
            user.username,
            user.uuid,
            user.addr,
            user.color,
            self.name,
            user.access_level
        );
        self.announce_all(commands::join::Announce {
            user: user.clone().into(),
        });

        let elements = self.get_or_create_canvas(user.canvas).elements.clone();
        self.users.push(user);
        let user = self.users.last().unwrap();

        user.send(&commands::Announce::from(commands::join::Respond {
            user: user.clone().into(),
            users: self.users.iter().map(|x| x.clone().into()).collect(),
            elements,
        }))
    }
    /// Remove a user from the room.
    /// Use [`App::disconnect_user`] for this, as it will also remove the room
    /// if noone is left in it.
    fn remove_user(&mut self, addr: &SocketAddr) -> bool {
        let mut removed_user = None;
        self.users.retain(|u| {
            if &u.addr == addr {
                removed_user = Some(u.clone());
                false
            } else {
                true
            }
        });

        if removed_user.is_none() {
            return false;
        }
        let removed_user = removed_user.unwrap();
        removed_user.tx.close_channel();
        if self.users.is_empty() {
            return true;
        }

        // Notify all remaining users that someone left.
        self.announce_all(commands::disconnect::Announce {
            user: removed_user.uuid,
        });

        // Check we have an admin in the lobby.
        if removed_user.access_level == AccessLevel::Admin {
            // Make the first editor the admin, else the first user
            let to_admin = self
                .users
                .iter()
                .find(|u| u.access_level == AccessLevel::Edit)
                .unwrap_or_else(|| self.users.first().unwrap());
            self.change_access_level(to_admin.uuid, AccessLevel::Admin);
        }

        true
    }

    /// Send an announcement to everyone but one user.
    pub fn announce<T: Into<commands::Announce>>(&self, announcement: T, ignored_user: Uuid) {
        let msg =
            serde_json::to_string(&announcement.into()).expect("failed to serialize announcement");
        for user in &self.users {
            if user.uuid != ignored_user {
                user.send_str(&msg);
            }
        }
    }

    /// Send an announcement to everyone but one user, who receieves a different
    /// response.
    pub fn announce_respond<A: Into<commands::Announce>, R: Into<commands::Announce>>(
        &self,
        announcement: A,
        responded_user: Uuid,
        response: R,
    ) {
        let msg =
            serde_json::to_string(&announcement.into()).expect("failed to serialize announcement");
        let r_msg = response.into();
        for user in &self.users {
            if user.uuid == responded_user {
                user.send(&r_msg);
            } else {
                user.send_str(&msg);
            }
        }
    }

    /// Send an announcement to everyone.
    pub fn announce_all<T: Into<commands::Announce>>(&self, announcement: T) {
        let msg =
            serde_json::to_string(&announcement.into()).expect("failed to serialize announcement");
        for user in &self.users {
            user.send_str(&msg);
        }
    }

    /// Changes the access level of a user.
    pub fn change_access_level(&mut self, user: Uuid, access_level: AccessLevel) {
        let found_user = self.get_user_mut(user);
        if found_user.is_none() {
            return;
        }

        // Promote the user
        let found_user = found_user.unwrap();
        found_user.access_level = access_level;
        let found_user = found_user.clone().into();
        self.announce_all(commands::AnnounceType::UserChange(found_user));

        // If we're promoting someone to admin, make sure we don't end up with
        // 2 admins!
        if access_level == AccessLevel::Admin
            && let Some(admin) = self
                .users
                .iter_mut()
                .find(|u| u.access_level == AccessLevel::Admin && u.uuid != user)
        {
            // Demote the old admin to edit access
            admin.access_level = AccessLevel::Edit;
            let admin = admin.clone().into();
            self.announce_all(commands::AnnounceType::UserChange(admin));
        }
    }

    pub fn save_to_file(&self) {}
}
impl Drop for Room {
    fn drop(&mut self) {
        self.save_to_file()
    }
}

#[derive(Debug, Clone)]
pub struct RoomUser {
    pub(crate) addr: SocketAddr,
    pub(crate) tx: UnboundedSender<Message>,
    pub(crate) uuid: Uuid,
    pub(crate) username: String,
    pub(crate) color: Color,
    pub(crate) canvas: u16,
    pub(crate) access_level: user::AccessLevel,
}
impl RoomUser {
    /// Sends a personalized message to this user.
    ///
    /// If you want to send the same message to multiple users, prefer
    /// [`Room::announce`], [`Room::announce_respond`], or [`Room::announce_all`],
    /// as this will prevent re-serializing the message.
    pub fn send<T: Serialize>(&self, msg: &T) {
        self.send_str(&serde_json::to_string(msg).expect("failed to serialize message"))
    }

    fn send_str(&self, msg: &str) {
        let _ = self
            .tx
            .unbounded_send(Message::text(msg))
            .inspect_err(|e| warn!("Failed to send to user: {e:#?}"));
    }
}

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct RoomCanvas {
    elements: Vec<element::Element>,
}

#[derive(Serialize, Deserialize, Default, Debug)]
pub struct RoomConfig {
    /// Whether users who just joined the room should be made editors by
    /// default, or should be in view-only mode.
    pub(crate) new_users_default_editor: bool,
    /// The password for the server.
    pub(crate) password: Option<String>,
}
impl RoomConfig {
    pub fn new(password: Option<String>) -> RoomConfig {
        RoomConfig {
            password,
            ..Default::default()
        }
    }

    pub fn get_default_access_level(&self) -> AccessLevel {
        if self.new_users_default_editor {
            AccessLevel::Edit
        } else {
            AccessLevel::View
        }
    }
}
