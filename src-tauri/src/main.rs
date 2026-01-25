// NEO-EDU Desktop Application
// Built with Tauri 2.0

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

// Custom commands that can be called from JavaScript
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Xin chào, {}! Chào mừng đến với NEO-EDU Desktop.", name)
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn get_platform() -> String {
    std::env::consts::OS.to_string()
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_app_version,
            get_platform
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
