use thiserror::Error;

#[derive(Debug, Error)]
pub enum AudioError {
    #[error("Device error: {0}")]
    Device(String),
    #[error("Stream error: {0}")]
    Stream(String),
    #[error("Invalid WAV data: {0}")]
    Wav(String),
    #[error("Sample not found: {0}")]
    NotFound(String),
    #[error("Internal error: {0}")]
    Internal(String),
}

#[derive(Debug, Clone, Copy)]
pub struct PlayCommand {
    pub sample_id: u32,
    pub volume: f32,
}

#[derive(Debug, Clone)]
pub struct SampleData {
    pub sample_rate: u32,
    pub channels: u16,
    /// Interleaved stereo f32 samples in range [-1.0, 1.0]
    pub samples: Vec<f32>,
}

