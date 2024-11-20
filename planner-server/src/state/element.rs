use std::collections::HashSet;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::Color;

/// A single element on the canvas. For example, a piece of text, an image, etc.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Element {
    /// ID of the element.
    uuid: Uuid,
    /// The type of element this is, along with all the additional information
    /// that comes with it.
    ty: ElementType,
    /// The last user to have edited it.
    last_edited_by: Uuid,
    /// The editors or hosts who are currently selecting this element.
    selected_by: Vec<Uuid>,
    /// The X position of this element.
    x: f64,
    /// The Y position of this element.
    y: f64,
    /// The place this elements coordinates and transforms are anchored to.
    anchor: ElementAnchor,
    /// How much this element is rotated, in degrees.
    rotation: f64,
    /// The way this element scales when the editor is zoomed in or out.
    /// This causes elements not to scale at the same rate as their background.
    scale_rate: ScaleRate,
    /// The z-ordering of this element, relative to other elements.
    /// Higher means further in front.
    z_index: f64,
    /// Groups added to this element. This allows code to reference different
    /// elements with a single string, for example to make all elements
    /// on a layer invisible.
    groups: HashSet<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
enum ElementType {
    Text(ElementText),
    Image(ElementImage),
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct ElementText {
    content: String,
    align: TextAlignment,
    color: Color,
    size: f32,
    font: TextFont,
    background_color: Color,
    background_blur: f64,
}
#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq)]
#[serde(rename_all = "snake_case")]
enum TextAlignment {
    Left,
    Center,
    Right,
    Justify,
}
#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq)]
#[serde(rename_all = "snake_case")]
enum TextFont {
    /// The default sans-serif font for the canvas.
    Sans,
    /// The default serif font for the canvas.
    Serif,
    /// The default monospace font for the canvas.
    Mono,
    /// A sans-serif font using a custom font.
    /// If the user doesn't have it installed, fallsback to the
    /// default sans-serif font for the canvas.
    CustomSans(String),
    /// A serif font using a custom font.
    /// If the user doesn't have it installed, fallsback to the
    /// default serif font for the canvas.
    CustomSerif(String),
    /// A monospace font using a custom font.
    /// If the user doesn't have it installed, fallsback to the
    /// default monospace font for the canvas.
    CustomMono(String),
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct ElementImage {
    url: String,
    /// Accessibility alt text for the image.
    alt: String,
    /// How much the image was scaled along the X-axis
    scale_x: f64,
    /// How much the image was scaled along the Y-axis
    scale_y: f64,
    /// How the image was cropped along each edge.
    crop: ImageCrop,
    outline_color: Color,
    outline_thickness: f64,
    outline_blur: f64,
    text: Vec<ImageText>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
struct ImageCrop {
    /// Percentage from the left to crop off.
    left: f64,
    /// Percentage from the top to crop off.
    top: f64,
    /// Percentage from the right to crop off.
    right: f64,
    /// Percentage from the bottom to crop off.
    bottom: f64,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
struct ImageText {
    /// The X position of this element, as a percentage relative to the
    /// image it is placed on.
    x: f64,
    /// The Y position of this element, as a percentage relative to the
    /// image it is placed on.
    y: f64,
    /// The place this elements coordinates are anchored to.
    anchor: ElementAnchor,
    /// The text information.
    text: ElementText,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct ElementAnchor {
    /// Position from the top, as a float of 0-1 representing a percentage.
    top: f64,
    /// Position from the left, as a float of 0-1 representing a percentage.
    left: f64,
}

impl ElementAnchor {
    /// Create a new [`ElementAnchor`] with the anchor in the
    /// middle of the element.
    pub fn centered() -> ElementAnchor {
        ElementAnchor {
            top: 0.5,
            left: 0.5,
        }
    }
    /// Create a new [`ElementAnchor`] with the anchor on the
    /// top-left of the element.
    pub fn top_left() -> ElementAnchor {
        ElementAnchor { top: 0., left: 0. }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
enum ScaleRate {
    /// Causes elements to scale at the same rate as the background.
    None,
    /// The default implementation of the scale rate.
    /// Causes elements to scale at a rate of `bg_scale ** -0.5`,
    /// meaning as you zoom in from 1x to 2x, this element grows from 1x its size
    /// to 1.41x its size. This increases legibility at both larger and smaller
    /// zooms.
    Base,
}
