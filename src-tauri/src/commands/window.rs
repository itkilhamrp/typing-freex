use crate::error::AppResult;
use tauri::{AppHandle, Manager, LogicalSize};

#[tauri::command]
pub fn window_set_compact(app: AppHandle, compact: bool) -> AppResult<()> {
    if let Some(window) = app.get_webview_window("main") {
        if compact {
            let _ = window.set_size(LogicalSize::new(420.0, 360.0));
            let _ = window.set_always_on_top(true);
        } else {
            let _ = window.set_size(LogicalSize::new(1024.0, 720.0));
            let _ = window.set_always_on_top(false);
        }
    }
    Ok(())
}
