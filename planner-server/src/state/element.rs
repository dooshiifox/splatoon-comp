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
    last_edited_by: Option<Uuid>,
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
    /// Tags added to this element. This allows code to reference different
    /// elements with a single string, for example to make all elements
    /// on a layer invisible.
    tags: HashSet<String>,
}
impl Element {
    pub fn new(el: ElementType) -> Self {
        Element {
            uuid: Uuid::new_v4(),
            ty: el,
            last_edited_by: None,
            selected_by: vec![],
            x: 0.,
            y: 0.,
            anchor: ElementAnchor::default(),
            rotation: 0.,
            scale_rate: ScaleRate::default(),
            z_index: 0.,
            tags: HashSet::default(),
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ElementType {
    Text(ElementText),
    Image(ElementImage),
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ElementText {
    content: String,
    align: TextAlignment,
    color: Color,
    size: f32,
    font: TextFont,
    background_color: Color,
    background_blur: f64,
}
impl ElementText {
    pub fn new(content: String) -> ElementText {
        ElementText {
            content,
            align: TextAlignment::default(),
            color: Color::get_random_color(),
            size: 30.,
            font: TextFont::default(),
            background_color: Color::new("#00000000").unwrap(),
            background_blur: 0.,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, Default)]
#[serde(rename_all = "snake_case")]
pub enum TextAlignment {
    Left,
    #[default]
    Center,
    Right,
    Justify,
}
#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq)]
#[serde(
    tag = "font_type",
    content = "custom_font_family",
    rename_all = "snake_case"
)]
pub enum TextFont {
    /// A sans-serif font.
    /// If a value is given, that font will be used. If a value is not given,
    /// the default sans-serif font for the canvas is used. If the user doesn't
    /// have the custom font installed, fallsback to the default
    /// sans-serif font for the canvas.
    Sans(Option<String>),
    /// A serif font.
    /// If a value is given, that font will be used. If a value is not given,
    /// the default serif font for the canvas is used. If the user doesn't
    /// have the custom font installed, fallsback to the default
    /// serif font for the canvas.
    Serif(Option<String>),
    /// A monospace font.
    /// If a value is given, that font will be used. If a value is not given,
    /// the default monospace font for the canvas is used. If the user doesn't
    /// have the custom font installed, fallsback to the default
    /// monospace font for the canvas.
    Mono(Option<String>),
}
impl TextFont {
    const SANS_DEFAULT: TextFont = TextFont::Sans(None);
    const SERIF_DEFAULT: TextFont = TextFont::Serif(None);
    const MONO_DEFAULT: TextFont = TextFont::Mono(None);
}
impl Default for TextFont {
    fn default() -> Self {
        Self::SANS_DEFAULT
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ElementImage {
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
#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct ImageCrop {
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
pub struct ImageText {
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
pub struct ElementAnchor {
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
impl Default for ElementAnchor {
    fn default() -> ElementAnchor {
        ElementAnchor::centered()
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "snake_case")]
pub enum ScaleRate {
    /// Causes elements to scale at the same rate as the background.
    #[default]
    None,
    /// The default implementation of the scale rate.
    /// Causes elements to scale at a rate of `bg_scale ** -0.5`,
    /// meaning as you zoom in from 1x to 2x, this element grows from 1x its size
    /// to 1.41x its size. This increases legibility at both larger and smaller
    /// zooms.
    Base,
}
