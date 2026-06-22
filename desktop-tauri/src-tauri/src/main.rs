#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::sync::Mutex;

use rusqlite::Connection;
use std::path::PathBuf;
use tauri::Emitter;
use tauri::Manager;
use tauri_plugin_updater::UpdaterExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Track {
    #[serde(default)]
    id: String,
    title: String,
    artist: String,
    url: String,
    cover: Option<String>,
    duration: u32,
    source: String,
}

struct AppState {
    db: Mutex<Connection>,
    backend_child: Mutex<Option<std::process::Child>>,
}

fn init_db(app_dir: &std::path::Path) -> Connection {
    std::fs::create_dir_all(app_dir).ok();
    let db_path = app_dir.join("weavify.db");
    let conn = Connection::open(&db_path)
        .expect("Failed to open database");

    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS tracks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            url TEXT NOT NULL,
            cover TEXT,
            duration INTEGER NOT NULL DEFAULT 0,
            source TEXT NOT NULL DEFAULT '',
            added_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id TEXT NOT NULL DEFAULT '',
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            url TEXT NOT NULL,
            cover TEXT,
            duration INTEGER NOT NULL DEFAULT 0,
            source TEXT NOT NULL DEFAULT '',
            played_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS favorites (
            track_id TEXT PRIMARY KEY,
            added_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    ").expect("Failed to create tables");

    println!("Database initialized at: {:?}", db_path);
    conn
}

fn start_backend(app_handle: &tauri::AppHandle) -> Option<std::process::Child> {
    let exe_path = std::env::current_exe().ok();
    let mut paths = vec![
        PathBuf::from("src/local-server-v2.js"),
        PathBuf::from("../src/local-server-v2.js"),
    ];
    if let Some(exe) = &exe_path {
        paths.push(exe.parent().and_then(|p| p.parent()).and_then(|p| p.parent()).and_then(|p| p.parent())
            .map(|p| p.join("src/local-server-v2.js")).unwrap_or_default());
    }
    if let Ok(rd) = app_handle.path().resource_dir() {
        paths.push(rd.join("backend/local-server-v2.js"));
    }

    for path in &paths {
        if path.exists() {
            match std::process::Command::new("node")
                .arg(path.as_os_str())
                .spawn()
            {
                Ok(child) => {
                    println!("Backend server started from: {:?}", path);
                    return Some(child);
                }
                Err(e) => eprintln!("Failed to start backend from {:?}: {}", path, e),
            }
        }
    }

    eprintln!("Backend server not found (local-server-v2.js) at any of:");
    for path in &paths {
        eprintln!("  {:?} (exists: {})", path, path.exists());
    }
    None
}

#[tauri::command]
fn get_playlist(state: tauri::State<'_, AppState>) -> Result<Vec<Track>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db.prepare(
        "SELECT id, title, artist, url, cover, duration, source FROM tracks ORDER BY added_at DESC"
    ).map_err(|e| e.to_string())?;
    let tracks = stmt.query_map([], |row| {
        Ok(Track {
            id: row.get(0)?,
            title: row.get(1)?,
            artist: row.get(2)?,
            url: row.get(3)?,
            cover: row.get(4)?,
            duration: row.get::<_, i32>(5)? as u32,
            source: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();
    Ok(tracks)
}

#[tauri::command]
fn add_track(mut track: Track, state: tauri::State<'_, AppState>) -> Result<String, String> {
    if track.id.is_empty() {
        track.id = format!("track_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
    }
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute(
        "INSERT OR REPLACE INTO tracks (id, title, artist, url, cover, duration, source) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![track.id, track.title, track.artist, track.url, track.cover, track.duration as i64, track.source],
    ).map_err(|e| e.to_string())?;
    Ok(format!("Track '{}' added", track.title))
}

#[tauri::command]
fn remove_track(track_id: String, state: tauri::State<'_, AppState>) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM tracks WHERE id = ?1", rusqlite::params![track_id])
        .map_err(|e| e.to_string())?;
    Ok("Track removed".to_string())
}

#[tauri::command]
fn clear_playlist(state: tauri::State<'_, AppState>) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM tracks", [])
        .map_err(|e| e.to_string())?;
    Ok("Playlist cleared".to_string())
}

#[tauri::command]
fn add_to_history(mut track: Track, state: tauri::State<'_, AppState>) -> Result<String, String> {
    if track.id.is_empty() {
        track.id = format!("track_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
    }
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute(
        "INSERT INTO history (track_id, title, artist, url, cover, duration, source) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![track.id, track.title, track.artist, track.url, track.cover, track.duration as i64, track.source],
    ).map_err(|e| e.to_string())?;
    Ok("Added to history".to_string())
}

#[tauri::command]
fn get_history(limit: usize, state: tauri::State<'_, AppState>) -> Result<Vec<Track>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db.prepare(
        "SELECT track_id, title, artist, url, cover, duration, source FROM history ORDER BY played_at DESC LIMIT ?1"
    ).map_err(|e| e.to_string())?;
    let tracks = stmt.query_map([limit as i64], |row| {
        Ok(Track {
            id: row.get(0)?,
            title: row.get(1)?,
            artist: row.get(2)?,
            url: row.get(3)?,
            cover: row.get(4)?,
            duration: row.get::<_, i32>(5)? as u32,
            source: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();
    Ok(tracks)
}

#[tauri::command]
fn clear_history(state: tauri::State<'_, AppState>) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM history", [])
        .map_err(|e| e.to_string())?;
    Ok("History cleared".to_string())
}

#[tauri::command]
fn add_to_favorites(track_id: String, state: tauri::State<'_, AppState>) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute(
        "INSERT OR IGNORE INTO favorites (track_id) VALUES (?1)",
        rusqlite::params![track_id],
    ).map_err(|e| e.to_string())?;
    Ok("Added to favorites".to_string())
}

#[tauri::command]
fn remove_from_favorites(track_id: String, state: tauri::State<'_, AppState>) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM favorites WHERE track_id = ?1", rusqlite::params![track_id])
        .map_err(|e| e.to_string())?;
    Ok("Removed from favorites".to_string())
}

#[tauri::command]
fn is_favorite(track_id: String, state: tauri::State<'_, AppState>) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let count: i64 = db.query_row(
        "SELECT COUNT(*) FROM favorites WHERE track_id = ?1",
        rusqlite::params![track_id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;
    Ok(count > 0)
}

#[tauri::command]
fn get_favorites(state: tauri::State<'_, AppState>) -> Result<Vec<String>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db.prepare("SELECT track_id FROM favorites ORDER BY added_at DESC")
        .map_err(|e| e.to_string())?;
    let ids = stmt.query_map([], |row| {
        row.get::<_, String>(0)
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();
    Ok(ids)
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
async fn check_for_updates(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    match updater.check().await {
        Ok(Some(update)) => {
            let date_str = update.date.map(|d| d.to_string());
            Ok(serde_json::json!({
                "available": true,
                "version": update.version,
                "date": date_str,
                "body": update.body,
            }))
        }
        Ok(None) => Ok(serde_json::json!({"available": false})),
        Err(e) => {
            eprintln!("[UPDATER] Check failed: {}", e);
            Ok(serde_json::json!({"available": false, "error": format!("{}", e)}))
        }
    }
}

#[tauri::command]
fn get_update_status() -> Result<String, String> {
    Ok("No updates available".to_string())
}

#[tauri::command]
fn get_log_path() -> String {
    "logs/app.log".to_string()
}

#[tauri::command]
fn open_log_file() -> Result<String, String> {
    Ok("Log file opened".to_string())
}

#[tauri::command]
fn download_track(track: Track) -> Result<String, String> {
    Ok(format!("Download started for {}", track.title))
}

#[tauri::command]
fn login(username: String, _password: String) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "success": true,
        "username": username
    }))
}

#[tauri::command]
fn register(username: String, _password: String) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "success": true,
        "username": username
    }))
}

#[tauri::command]
fn logout() -> Result<String, String> {
    Ok("Logged out".to_string())
}

#[tauri::command]
fn check_session() -> serde_json::Value {
    serde_json::json!({
        "authenticated": true,
        "username": "user"
    })
}

#[tauri::command]
fn local_server_start(app: tauri::AppHandle, state: tauri::State<'_, AppState>) -> Result<serde_json::Value, String> {
    let mut child = state.backend_child.lock().map_err(|e| e.to_string())?;
    if child.is_none() {
        let new_child = start_backend(&app);
        let running = new_child.is_some();
        *child = new_child;
        Ok(serde_json::json!({"success": running}))
    } else {
        Ok(serde_json::json!({"success": true}))
    }
}

#[tauri::command]
fn local_server_stop(state: tauri::State<'_, AppState>) -> Result<serde_json::Value, String> {
    let mut child = state.backend_child.lock().map_err(|e| e.to_string())?;
    if let Some(mut c) = child.take() {
        c.kill().ok();
        Ok(serde_json::json!({"success": true}))
    } else {
        Ok(serde_json::json!({"success": false, "error": "Not running"}))
    }
}

#[tauri::command]
fn local_server_status(state: tauri::State<'_, AppState>) -> serde_json::Value {
    let child = state.backend_child.lock().ok();
    let running = child.map_or(false, |c| c.is_some());
    serde_json::json!({"isRunning": running})
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new()
            .with_handler(|app, shortcut, event| {
                use tauri_plugin_global_shortcut::ShortcutState;
                if event.state == ShortcutState::Pressed {
                    let key = format!("{:?}", shortcut.key);
                    println!("Media key pressed: {}", key);
                    app.emit("media-key", key).ok();
                }
            })
            .build()
        )
        .setup(|app| {
            let app_dir = app.path().app_data_dir()
                .unwrap_or_else(|_| PathBuf::from("."));
            let conn = init_db(&app_dir);
            app.manage(AppState {
                db: Mutex::new(conn),
                backend_child: Mutex::new(None),
            });

            let child = start_backend(&app.handle());
            let state = app.state::<AppState>();
            *state.backend_child.lock().unwrap() = child;

            use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Shortcut};

            let shortcuts = [
                Shortcut::new(None, Code::MediaPlayPause),
                Shortcut::new(None, Code::MediaTrackNext),
                Shortcut::new(None, Code::MediaTrackPrevious),
                Shortcut::new(None, Code::MediaStop),
            ];
            for sc in shortcuts {
                let id_val = sc.id();
                match app.global_shortcut().register(sc) {
                    Ok(_) => println!("Shortcut registered: id={}", id_val),
                    Err(e) => eprintln!("Failed to register shortcut {}: {}", id_val, e),
                }
            }

            use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem};
            use tauri::tray::TrayIconBuilder;

            let show_hide = MenuItemBuilder::with_id("show_hide", "Show/Hide").build(app)?;
            let sep1 = PredefinedMenuItem::separator(app)?;
            let play_pause = MenuItemBuilder::with_id("play_pause", "Play/Pause").build(app)?;
            let next = MenuItemBuilder::with_id("next", "Next").build(app)?;
            let prev = MenuItemBuilder::with_id("previous", "Previous").build(app)?;
            let sep2 = PredefinedMenuItem::separator(app)?;
            let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

            let menu = MenuBuilder::new(app)
                .item(&show_hide)
                .item(&sep1)
                .item(&play_pause)
                .item(&next)
                .item(&prev)
                .item(&sep2)
                .item(&quit)
                .build()?;

            TrayIconBuilder::new()
                .icon({
                    let img = image::load_from_memory(include_bytes!("../icons/32x32.png"))
                        .expect("Failed to decode tray icon")
                        .into_rgba8();
                    let (w, h) = img.dimensions();
                    tauri::image::Image::new_owned(img.into_raw(), w, h)
                })
                .menu(&menu)
                .tooltip("Weavify")
                .on_menu_event(|app, event| {
                    match event.id().0.as_str() {
                        "show_hide" => {
                            if let Some(window) = app.get_webview_window("main") {
                                if window.is_visible().unwrap_or(false) {
                                    window.hide().ok();
                                } else {
                                    window.show().ok();
                                    window.set_focus().ok();
                                }
                            }
                        }
                        "play_pause" => { app.emit("media-key", "MediaPlayPause").ok(); }
                        "next" => { app.emit("media-key", "MediaTrackNext").ok(); }
                        "previous" => { app.emit("media-key", "MediaTrackPrevious").ok(); }
                        "quit" => { app.exit(0); }
                        _ => {}
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                window.hide().ok();
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_playlist,
            add_track,
            remove_track,
            clear_playlist,
            add_to_history,
            get_history,
            clear_history,
            add_to_favorites,
            remove_from_favorites,
            is_favorite,
            get_favorites,
            get_app_version,
            check_for_updates,
            get_update_status,
            get_log_path,
            open_log_file,
            download_track,
            login,
            register,
            logout,
            check_session,
            local_server_start,
            local_server_stop,
            local_server_status,
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app_handle, event| {
        if let tauri::RunEvent::Exit = event {
            if let Some(state) = app_handle.try_state::<AppState>() {
                if let Ok(mut guard) = state.backend_child.lock() {
                    if let Some(ref mut c) = *guard {
                        let _ = c.kill();
                    }
                }
            }
        }
    });
}