use tauri::State;
use crate::audio::{AudioEngine, AudioStatusDto};

#[tauri::command]
pub fn audio_register_sample(
    id: String,
    wav_bytes: Vec<u8>,
    engine: State<AudioEngine>,
) -> Result<(), String> {
    engine.register_wav(&id, &wav_bytes).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn audio_play(
    id: String,
    volume: Option<f64>,
    engine: State<AudioEngine>,
) {
    let vol_f32 = volume.map(|v| v as f32);
    engine.play(&id, vol_f32);
}

#[tauri::command]
pub fn audio_set_volume(
    volume: f64,
    engine: State<AudioEngine>,
) {
    engine.set_volume(volume as f32);
}

#[tauri::command]
pub fn audio_clear(
    prefix: Option<String>,
    engine: State<AudioEngine>,
) {
    engine.clear(prefix.as_deref());
}

#[tauri::command]
pub fn audio_status(
    engine: State<AudioEngine>,
) -> AudioStatusDto {
    engine.status()
}

#[tauri::command]
pub fn audio_rebuild_stream(
    engine: State<AudioEngine>,
) -> Result<AudioStatusDto, String> {
    engine.rebuild_stream().map_err(|e| e.to_string())
}

