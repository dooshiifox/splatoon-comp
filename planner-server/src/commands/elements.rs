use super::{AnnounceTo, AnnounceType, ErrorType, ProcessReceive};
use crate::state::{element::Element, user::AccessLevel, App};
use serde::{Deserialize, Serialize};
use std::{
    net::SocketAddr,
    sync::{Arc, RwLock},
};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct Receive {
    elements: Vec<Element>,
    deleted_elements: Vec<Uuid>,
}
impl ProcessReceive for Receive {
    fn process(
        self,
        app: Arc<RwLock<App>>,
        room_name: &str,
        addr: SocketAddr,
    ) -> Result<AnnounceTo, ErrorType> {
        let mut elements = vec![];
        let mut sender_elements = vec![];
        let mut deleted_elements = vec![];
        let mut sender_deleted_elements = vec![];
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
            let user_uuid = user.uuid;
            let user_can_make_changes = user.access_level != AccessLevel::View;
            canvas_id = user.canvas;

            // Change the selected elements
            let canvas = room.get_or_create_canvas(user.canvas);
            for sent_el in self.elements {
                if let Some(known_el) = canvas.get_element_mut(&sent_el.uuid) {
                    let is_selected = known_el.selected_by.is_none_or(|u| u == user_uuid);
                    if is_selected && user_can_make_changes {
                        *known_el = sent_el.clone();
                        elements.push(sent_el.clone());
                        sender_elements.push(sent_el);
                    } else {
                        // Tell the sender to revert the changes
                        sender_elements.push(known_el.clone());
                    }
                } else {
                    // Creating this element.
                    if user_can_make_changes {
                        canvas.add_element(sent_el.clone());
                        elements.push(sent_el.clone());
                        sender_elements.push(sent_el);
                    } else {
                        // Tell the sender to delete it
                        sender_deleted_elements.push(sent_el.uuid);
                    }
                }
            }

            for sent_deleted_uuid in self.deleted_elements {
                if let Some(known_el) = canvas.get_element(&sent_deleted_uuid) {
                    let is_selected = known_el.selected_by.is_none_or(|u| u == user_uuid);
                    if is_selected && user_can_make_changes {
                        canvas.delete_element(&sent_deleted_uuid);
                        deleted_elements.push(sent_deleted_uuid);
                        sender_deleted_elements.push(sent_deleted_uuid);
                    } else {
                        // Tell the sender to recreate the element with the known state
                        sender_elements.push(known_el.clone());
                    }
                } else {
                    // Element is already deleted?
                }
            }
        }

        if elements.is_empty() && deleted_elements.is_empty() {
            Ok(AnnounceType::ElementsChanged {
                elements: sender_elements,
                deleted_elements: sender_deleted_elements,
            }
            .respond_to_sender())
        } else {
            Ok(AnnounceTo::ResponseAndAnnounceToCanvas {
                respond: AnnounceType::ElementsChanged {
                    elements: sender_elements,
                    deleted_elements: sender_deleted_elements,
                },
                announce: AnnounceType::ElementsChanged {
                    elements,
                    deleted_elements,
                },
                canvas: canvas_id,
            })
        }
    }
}

#[derive(Serialize)]
#[serde(tag = "code", rename_all = "snake_case")]
pub enum Error {
    NoPermission,
    RoomDoesNotExist,
}
