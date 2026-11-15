use serde::{Deserialize, Serialize};

pub const CHARS_PER_WORD: f64 = 5.0;

pub fn wpm_to_cpm(wpm: f64) -> f64 {
    wpm * CHARS_PER_WORD
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SpeedUnit {
    Wpm,
    Cpm,
    Kph,
}

impl SpeedUnit {
    pub fn convert_from_wpm(&self, wpm: f64) -> f64 {
        match self {
            SpeedUnit::Wpm => wpm,
            SpeedUnit::Cpm => wpm * CHARS_PER_WORD,
            SpeedUnit::Kph => wpm * CHARS_PER_WORD * 60.0,
        }
    }
}
