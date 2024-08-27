use std::sync::Mutex;

use tauri::{Emitter, Manager};
mod rpc;
use rpc::*;
use tauri_plugin_shell::ShellExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // torrent::main();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![init_presence, update_presence,])
        .setup(|app| {
            app.manage(Mutex::new(Option::<DiscordRpc>::None));
            Ok(())
        })
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            let url = &argv[1];
            if url.contains("login") {
                app.emit("session-token", url).unwrap();
            }
        }))
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
