use ffmpeg_next as ffmpeg;
use std::sync::Mutex;
use tauri::{http, Emitter, Manager, UriSchemeResponder};
mod rpc;
use rpc::*;
mod rqbit;
use rqbit::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    ffmpeg::init().unwrap();
    // torrent::main();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            init_presence,
            update_presence,
            start_rqbit
        ])
        .setup(|app| {
            // Generate states
            app.manage(Mutex::new(Option::<DiscordRpc>::None));
            app.manage(Mutex::new(Option::<RqbitProcess>::None));

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
        .register_asynchronous_uri_scheme_protocol("korino", request_handler)
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn request_handler(
    app: &tauri::AppHandle,
    request: http::Request<Vec<u8>>,
    responder: UriSchemeResponder,
) {
    let mut res = http::Response::builder();
    res = res.header("Access-Control-Allow-Origin", "*");
    let path = request.uri().path();
    println!("request: {:?}", path);
    // if request.method() == http::Method::HEAD {
    //     return responder.respond(
    //         http::Response::builder()
    //             .status(200)
    //             .header("Access-Control-Allow-Origin", "*")
    //             .header("Content-Type", "korino")
    //             .body(vec![])
    //             .unwrap(),
    //     );
    // }
    if path.starts_with("/login") {
        let url = request.uri().to_string();
        app.emit("session-token", url).unwrap();
        responder.respond(res.status(200).body(vec![]).unwrap());
    } else if path.starts_with("/torrent") {
        tauri::async_runtime::spawn(torrent_handler(request, res, responder));
    } else {
        responder.respond(res.status(404).body(vec![]).unwrap());
    }
}
