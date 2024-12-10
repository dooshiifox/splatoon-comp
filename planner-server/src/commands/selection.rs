use super::{AnnounceTo, AnnounceType, ErrorType, ProcessReceive};
use crate::state::{user::AccessLevel, App};
use serde::{Deserialize, Serialize};
use std::{
    net::SocketAddr,
    sync::{Arc, RwLock},
};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct Receive {
    elements: Vec<Uuid>,
}
impl ProcessReceive for Receive {
    fn process(
        self,
        app: Arc<RwLock<App>>,
        room_name: &str,
        addr: SocketAddr,
    ) -> Result<AnnounceTo, ErrorType> {
        let mut newly_selected = vec![];
        let mut newly_deselected = vec![];
        let mut failed_to_select = vec![];
        let uuid;
        let canvas_id;

        {
            let mut app_write_lock = app.write().unwrap();
            let Some(room) = app_write_lock.get_room_mut(room_name) else {
                return Error::RoomDoesNotExist.into();
            };
            let Some(user) = room.get_user_from_addr(addr) else {
                // not sure when this would happen but dont feel comfortable
                // with an unwrap
                return Error::RoomDoesNotExist.into();
            };
            // Not allowed to select items.
            if user.access_level == AccessLevel::View {
                return Error::NoPermission.into();
            }
            uuid = user.uuid;
            canvas_id = user.canvas;

            // Change the selected elements
            let canvas = room.get_or_create_canvas(user.canvas);
            for el in &mut canvas.elements {
                let is_selected_server = el.selected_by.is_some_and(|u| u == uuid);
                let is_selected_client = self.elements.contains(&el.uuid);
                if !is_selected_client && is_selected_server {
                    newly_deselected.push(el.uuid);
                    el.selected_by = None;
                } else if is_selected_client && !is_selected_server {
                    if el.selected_by.is_none() {
                        newly_selected.push(el.uuid);
                        el.selected_by = Some(uuid);
                    } else {
                        // If its selected by a different user, fail
                        failed_to_select.push(el.uuid);
                    }
                }
            }
        }

        Ok(AnnounceTo::ResponseAndAnnounceToCanvas {
            respond: AnnounceType::SelectionResponse {
                user_uuid: uuid,
                newly_selected: newly_selected.clone(),
                newly_deselected: newly_deselected.clone(),
                failed_to_select,
            },
            announce: AnnounceType::Selection {
                user_uuid: uuid,
                newly_selected,
                newly_deselected,
            },
            canvas: canvas_id,
        })
    }
}

#[derive(Serialize)]
#[serde(tag = "code", rename_all = "snake_case")]
pub enum Error {
    NoPermission,
    RoomDoesNotExist,
}
