use crate::commands::{self, AnnounceTo, AnnounceType, ErrorType};
use element::{Element, ElementText, ElementType};
use futures_channel::mpsc::UnboundedSender;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, net::SocketAddr};
use tokio_tungstenite::tungstenite::Message;
use tracing::{trace, warn};
use user::{AccessLevel, User};
use uuid::Uuid;

pub mod color;
pub mod element;
pub mod user;

pub use color::Color;

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

#[derive(Serialize)]
pub struct CommandError {
    id: Uuid,
    error: commands::ErrorType,
}
#[derive(Serialize)]
pub struct CommandAnnounce {
    id: Option<Uuid>,
    data: commands::AnnounceType,
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
        trace!("Creating room `{room_name}`");
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
    pub fn get_canvas(&self, id: u16) -> Option<&RoomCanvas> {
        self.canvases.get(&id)
    }

    /// Retrieves a user.
    pub fn get_user(&self, user: Uuid) -> Option<&RoomUser> {
        self.users.iter().find(|u| u.uuid == user)
    }
    /// Retrieves a user, mutably.
    pub fn get_user_mut(&mut self, user: Uuid) -> Option<&mut RoomUser> {
        self.users.iter_mut().find(|u| u.uuid == user)
    }
    /// Retrieves a user from their socket address.
    pub fn get_user_from_addr(&self, user: SocketAddr) -> Option<&RoomUser> {
        self.users.iter().find(|u| u.addr == user)
    }
    /// Retrieves a user mutably from their socket address.
    pub fn get_user_from_addr_mut(&mut self, user: SocketAddr) -> Option<&mut RoomUser> {
        self.users.iter_mut().find(|u| u.addr == user)
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
            "User `{}` [{}] [{}] [{}] joined `{}` [{}] with {} perms",
            user.username,
            user.uuid,
            user.addr,
            user.color,
            self.name,
            user.canvas,
            user.access_level
        );
        self.announce_to_all(
            commands::AnnounceType::Join {
                user: user.clone().into(),
            },
            None,
        );

        let elements = self.get_or_create_canvas(user.canvas).elements.clone();
        self.users.push(user);
        let user = self.users.last().unwrap();

        self.respond_to_user(
            user.addr,
            commands::AnnounceType::OnJoin {
                user: user.clone().into(),
                users: self.users.iter().map(|x| x.clone().into()).collect(),
                elements,
            },
            None,
        )
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

        // Deselect everything they had selected
        let canvas = self.get_or_create_canvas(removed_user.canvas);
        for el in &mut canvas.elements {
            if el.selected_by.is_some_and(|u| u == removed_user.uuid) {
                el.selected_by = None
            }
        }

        if self.users.is_empty() {
            return true;
        }

        // Notify all remaining users that someone left.
        self.announce_to_all(
            commands::AnnounceType::Disconnect {
                user: removed_user.uuid,
            },
            None,
        );

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
    pub fn announce(
        &self,
        announcement: Result<AnnounceTo, ErrorType>,
        sender: SocketAddr,
        id: Option<Uuid>,
    ) {
        match announcement {
            Ok(AnnounceTo::All(t)) => self.announce_to_all(t, id),
            Ok(AnnounceTo::Respond(t)) => self.respond_to_user(sender, t, id),
            Ok(AnnounceTo::ResponseAndAnnounce { respond, announce }) => {
                self.respond_and_announce(announce, sender, respond, id)
            }
            Ok(AnnounceTo::None) => {}
            Err(error) => self.respond_error(sender, error, id),
        }
    }
    pub fn announce_to_all(&self, data: AnnounceType, id: Option<Uuid>) {
        let msg = serde_json::to_string(&CommandAnnounce { id, data })
            .expect("failed to serialize announcement");
        for user in &self.users {
            user.send_str(&msg);
        }
    }
    pub fn respond_to_user(&self, sender: SocketAddr, data: AnnounceType, id: Option<Uuid>) {
        if let Some(user) = self.get_user_from_addr(sender) {
            user.send(&CommandAnnounce { id, data })
        }
    }
    pub fn respond_and_announce(
        &self,
        announce: AnnounceType,
        sender: SocketAddr,
        respond: AnnounceType,
        id: Option<Uuid>,
    ) {
        let msg = serde_json::to_string(&CommandAnnounce {
            id: None,
            data: announce,
        })
        .expect("failed to serialize announcement");
        let r_msg = CommandAnnounce { id, data: respond };
        for user in &self.users {
            if user.addr == sender {
                user.send(&r_msg);
            } else {
                user.send_str(&msg);
            }
        }
    }
    pub fn respond_error(&self, sender: SocketAddr, error: ErrorType, id: Option<Uuid>) {
        if let Some(id) = id
            && let Some(user) = self.get_user_from_addr(sender)
        {
            user.send(&CommandError { id, error });
        }
    }

    /// Changes the access level of a user.
    ///
    /// Returns whether the user was found.
    pub fn change_access_level(&mut self, user: Uuid, access_level: AccessLevel) -> bool {
        let Some(found_user) = self.get_user_mut(user) else {
            return false;
        };

        // Promote the user
        found_user.access_level = access_level;
        let found_user: User = found_user.clone().into();

        // If we're demoting someone to view-only, deselect everything
        if access_level == AccessLevel::View {
            // Deselect everything they had selected
            let canvas = self.get_or_create_canvas(found_user.canvas);
            for el in &mut canvas.elements {
                if el.selected_by.is_some_and(|u| u == found_user.uuid) {
                    el.selected_by = None
                }
            }
        }

        self.announce_to_all(
            commands::AnnounceType::UserChange { user: found_user },
            None,
        );

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
            self.announce_to_all(commands::AnnounceType::UserChange { user: admin }, None);
        }

        true
    }

    pub fn switch_canvas(&mut self, addr: SocketAddr, canvas: u16) -> Option<()> {
        let user = self.get_user_from_addr_mut(addr)?;
        user.canvas = canvas;
        let uuid = user.uuid;

        // Deselect all elements from this user.
        let canvas = self.get_or_create_canvas(canvas);
        for el in &mut canvas.elements {
            if el.selected_by.is_some_and(|u| u == uuid) {
                el.selected_by = None
            }
        }

        Some(())
    }

    pub fn save_to_file(&self) {}
}
impl Drop for Room {
    fn drop(&mut self) {
        trace!("Deleting room `{}`", self.name);
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
    /// Always prefer [`Room::announce`] if possible.
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

#[derive(Serialize, Deserialize, Debug)]
pub struct RoomCanvas {
    pub elements: Vec<element::Element>,
}
impl Default for RoomCanvas {
    fn default() -> Self {
        Self {
            elements: vec![Element::new(ElementType::Text(ElementText::new(
                "Hello, world".to_string(),
            )))],
        }
    }
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
