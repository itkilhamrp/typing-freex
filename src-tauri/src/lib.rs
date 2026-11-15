pub mod audio;
pub mod commands;
pub mod db;
pub mod domain;
pub mod error;
pub mod logger;
pub mod text_import;

use commands::achievements::*;
use commands::advancements::*;
use commands::audio::*;
use commands::backup::*;
use commands::content::*;
use commands::custom_text::*;
use commands::profile::*;
use commands::results::*;
use commands::settings::*;
use commands::stats::*;
use commands::tracking_state::*;
use commands::trophy_showcase::*;
use commands::window::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
    {
        if std::env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_err() {
            // SAFETY: Called once at startup before any threads are spawned,
            // so no concurrent access to the environment is possible.
            unsafe { std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1") };
        }
        if std::env::var("GST_AUDIO_SINK").is_err() {
            // SAFETY: Ensures WebKitGTK / GStreamer routes Web Audio streams automatically
            // through the active host audio backend (PipeWire / PulseAudio / ALSA).
            unsafe { std::env::set_var("GST_AUDIO_SINK", "autoaudiosink") };
        }
    }

    let builder = tauri::Builder::default().plugin(tauri_plugin_single_instance::init(
        |app, _args, _cwd| {
            use tauri::Manager;
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.unminimize();
                let _ = w.show();
                let _ = w.set_focus();
            }
        },
    ));

    #[cfg(all(debug_assertions, feature = "mcp-dev"))]
    let builder = {
        use tauri_plugin_mcp_bridge::Builder as McpBridgeBuilder;
        builder.plugin(
            McpBridgeBuilder::new()
                .bind_address("127.0.0.1")
                .build(),
        )
    };

    builder
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            use tauri::Manager;
            let app_data_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("Failed to resolve application data directory: {e}"))?;

            db::legacy_migrate::migrate_legacy_app_data_dir(&app_data_dir);

            let _ = logger::FileLogger::init(&app_data_dir, true);
            log_info!("init", "Starting Typing FreeX v0.1.0");

            let db_manager = db::manager::DatabaseManager::new(app_data_dir)?;

            if db_manager.get_active_profile().unwrap_or(None).is_none() {
                let profiles = db_manager.list_profiles().unwrap_or_default();
                if let Some(first) = profiles.first() {
                    if let Err(e) = db_manager.switch_profile(&first.uuid) {
                        log_error!("init", "Failed to switch to initial profile {}: {}", first.uuid, e);
                    }
                } else if let Err(e) = db_manager.create_profile("Default", "default") {
                    log_error!("init", "Failed to create default profile: {}", e);
                }
            }

            app.manage(db_manager);

            let audio_engine = audio::AudioEngine::new();
            app.manage(audio_engine);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Audio commands
            audio_register_sample,
            audio_play,
            audio_set_volume,
            audio_clear,
            audio_status,
            audio_rebuild_stream,
            // Profile commands
            profile_list,
            profile_create,
            profile_rename,
            profile_delete,
            profile_switch,
            profile_get_active,
            // Result commands
            result_save,
            result_list,
            result_get,
            result_delete,
            // Stats commands
            stats_summary,
            stats_series,
            stats_key_heatmap,
            stats_personal_bests,
            stats_daily_activity,
            // Settings commands
            settings_get,
            settings_set,
            // Content commands
            content_list_languages,
            content_get_wordlist,
            content_get_quotes,
            // Custom text commands
            custom_text_list,
            custom_text_get,
            custom_text_create,
            custom_text_update,
            custom_text_delete,
            custom_text_duplicate,
            custom_text_revisions,
            custom_text_restore,
            custom_text_revision_diff,
            custom_text_mark_used,
            custom_text_import_pick,
            custom_text_import_reencode,
            custom_text_import_commit,
            custom_text_import_cancel,
            custom_text_export,
            custom_text_export_to_file,
            // Database & Backup commands
            db_backup_export,
            db_import_pick,
            db_import_commit,
            db_integrity_check,
            // Window commands
            window_set_compact,
            // Achievement, Advancement, State & Trophy commands
            achievement_list,
            achievement_batch_upsert,
            achievement_seed,
            advancement_list,
            advancement_batch_upsert,
            advancement_seed,
            tracking_state_load,
            tracking_state_save,
            trophy_showcase_get,
            trophy_showcase_set,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
