use super::torrent::Torrent;
use super::tracker::*;
use tauri::{Emitter, Manager};
use tauri_plugin_http::reqwest;

#[tauri::command]
pub async fn start_torrent(
    app: tauri::AppHandle,
    url: String,
    server_port: Option<u16>,
    peer_id: Option<String>,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let torrent_bytes = client
        .get(url)
        .send()
        .await
        .map_err(|err| err.to_string())?
        .bytes()
        .await
        .map_err(|err| err.to_string())?;
    let torrent = Torrent::parse(&torrent_bytes).map_err(|err| err.to_string())?;
    let url_params = serde_urlencoded::to_string(TrackerRequest {
        // info_hash: urlencode(&torrent.info.hash()),
        peer_id: peer_id.unwrap_or(generate_peer_id()),
        port: server_port.unwrap_or(6881),
        uploaded: 0,
        downloaded: 0,
        left: torrent.info.length.unwrap() as usize,
        compact: 1,
    })
    .unwrap();

    let tracker_url = format!(
        "{}?{}&info_hash={}",
        torrent
            .announce
            .expect("torrent must have an announce url")
            .as_str(),
        url_params,
        &urlencode(&torrent.info.hash()),
    );

    let tracker_response = client
        .get(tracker_url)
        .send()
        .await
        .map_err(|err| err.to_string())?
        .text()
        .await
        .map_err(|err| err.to_string())?;

    app.emit("torrent://start", tracker_response).unwrap();

    Ok(())
}
