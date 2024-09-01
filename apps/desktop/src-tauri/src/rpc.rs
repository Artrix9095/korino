
use discord_rpc_client::Client;
use std::sync::Mutex;
use tauri::{Emitter, State};

pub struct DiscordRpc(Client);
pub type WrappedDiscordRpc = Mutex<Option<DiscordRpc>>;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct RPCStatus {
    state: String,
    details: String,
    start_timestamp: Option<u64>,
    end_timestamp: Option<u64>,
    large_image_key: Option<String>,
    large_image_text: Option<String>,
    small_image_key: Option<String>,
    small_image_text: Option<String>,
    party_id: Option<String>,
    party_size: Option<u32>,
    party_max: Option<u32>,
    match_id: Option<String>,
    join_secret: Option<String>,
    spectate_secret: Option<String>,
    instance: Option<bool>,
}

#[tauri::command(rename_all = "snake_case")]
pub fn init_presence(app: tauri::AppHandle, state: State<WrappedDiscordRpc>) {
    *state.lock().unwrap() = Some(DiscordRpc(Client::new(714172786796396716)));
    if let Some(ref mut state) = *state.lock().unwrap() {
        let mut client = state.0.clone();

        client.on_ready(move |_ctx| {
            app.emit("rpc://ready", ()).unwrap();
        });

        client.start()
    }
}

#[tauri::command]
pub fn update_presence(
    app_handle: tauri::AppHandle,
    state: State<WrappedDiscordRpc>,
    status: RPCStatus,
) -> Result<(), String> {
    if let Some(ref mut state) = *state.lock().unwrap() {
        let mut client = state.0.clone();
        if let Err(e) = client.set_activity(|a| {
            a.assets(|a| {
                a.large_image(&status.large_image_key.unwrap_or_default())
                    .large_text(&status.large_image_text.unwrap_or_default())
                    .small_image(&status.small_image_key.unwrap_or_default())
                    .small_text(&status.small_image_text.unwrap_or_default())
            })
            .state(&status.state)
            .details(&status.details)
            .instance(status.instance.unwrap_or_default())
            .timestamps(|t| {
                // Only set timestamps if they are present
                if status.start_timestamp.is_some() && status.end_timestamp.is_some() {
                    t.start(status.start_timestamp.unwrap_or_default())
                        .end(status.end_timestamp.unwrap_or_default())
                } else {
                    t
                }
            })
        }) {
            app_handle.emit("rpc://error", e.to_string()).unwrap();
            Err(e.to_string())
        } else {
            Ok(())
        }
    } else {
        Err("RPC not initialized".into()) // TODO: return correct error
    }
}
