use rand::seq::IteratorRandom;
use serde::{Deserialize, Serialize};
use std::str::FromStr;

const COLORS: [&str; 9] = [
    "#ef4444", "#f97316", "#eab308", "#84cc16", "#10b981", "#06b6d4", "#6366f1", "#a855f7",
    "#e879f9",
];

#[derive(Serialize, Deserialize, Debug, PartialEq, Eq, Clone)]
pub struct Color(String);
impl Color {
    pub fn new(s: &str) -> Result<Color, ParseColorError> {
        // If the string starts with a hash, remove it. We'll add it back later
        let s = s.strip_prefix("#").unwrap_or(s);
        Ok(Color(match s.len() {
            3 | 4 => {
                // rgb[a] -> rrggbbaa
                let mut chars = s.chars();
                let (r, g, b, a) = (
                    chars.next().unwrap(),
                    chars.next().unwrap(),
                    chars.next().unwrap(),
                    chars.next().unwrap_or('f'),
                );
                if !r.is_ascii_hexdigit()
                    || !g.is_ascii_hexdigit()
                    || !b.is_ascii_hexdigit()
                    || !a.is_ascii_hexdigit()
                {
                    return Err(ParseColorError);
                }
                format!("#{r}{r}{g}{g}{b}{b}{a}{a}").to_lowercase()
            }
            6 | 8 => {
                // rrggbb[aa] -> rrggbbaa
                let mut chars = s.chars();
                let (r1, r2, g1, g2, b1, b2, a1, a2) = (
                    chars.next().unwrap(),
                    chars.next().unwrap(),
                    chars.next().unwrap(),
                    chars.next().unwrap(),
                    chars.next().unwrap(),
                    chars.next().unwrap(),
                    chars.next().unwrap_or('f'),
                    chars.next().unwrap_or('f'),
                );
                if !r1.is_ascii_hexdigit()
                    || !r2.is_ascii_hexdigit()
                    || !g1.is_ascii_hexdigit()
                    || !g2.is_ascii_hexdigit()
                    || !b1.is_ascii_hexdigit()
                    || !b2.is_ascii_hexdigit()
                    || !a1.is_ascii_hexdigit()
                    || !a2.is_ascii_hexdigit()
                {
                    return Err(ParseColorError);
                }
                format!("#{r1}{r2}{g1}{g2}{b1}{b2}{a1}{a2}").to_lowercase()
            }
            _ => return Err(ParseColorError),
        }))
    }

    pub fn get_random_color() -> Color {
        Color(
            COLORS
                .iter()
                .choose(&mut rand::thread_rng())
                .expect("No colors")
                .to_string(),
        )
    }
}

#[derive(Debug, PartialEq, Eq)]
pub struct ParseColorError;

impl FromStr for Color {
    type Err = ParseColorError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Self::new(s)
    }
}
