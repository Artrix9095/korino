use super::peers::{Handshake, Peer};
use super::piece::*;
use super::torrent::{self, Torrent};
use super::tracker::*;
// use futures::StreamExt; // Make sure to add this import
use futures_util::StreamExt;
use serde::Serialize;
use std::collections::BinaryHeap;
use std::net::SocketAddrV4;
use tauri::Emitter;
use tauri_plugin_http::reqwest;

// #[derive(Debug, Clone, Serialize)]
// struct TorrentStart {
//     tracker_response: TrackerResponse,
//     // torrent: Torrent,
//     peer_urls: Vec<String>,
// }

#[tauri::command]
pub async fn start_torrent(
    app: tauri::AppHandle,
    url: String,
    // server_port: Option<u16>,
    // peer_id: Option<[u8; 20]>,
) -> Result<(), String> {
    let t = Torrent::read(url).await.unwrap();
    let info_hash = t.info.hash();
    let peer_info = TrackerResponse::query(&t, info_hash).await.unwrap();

    let mut peer_list = Vec::new();

    let mut peers = futures_util::stream::iter(peer_info.peers.0.into_iter())
        .map(|addr: SocketAddrV4| async move {
            let peer = Peer::new(addr, info_hash).await;
            (addr, peer)
        })
        .buffer_unordered(5 /* user config */);

    while let Some((peer_addr, peer)) = peers.next().await {
        match peer {
            Ok(peer) => {
                peer_list.push(peer);
                if peer_list.len() >= 5
                /* TODO: user config */
                {
                    break;
                }
            }
            Err(e) => {
                eprintln!("failed to connect to peer {peer_addr:?}: {e:?}");
            }
        }
    }

    drop(peers);
    let mut peers = peer_list;

    let mut need_pieces = BinaryHeap::new();
    let mut no_peers = Vec::new();
    for piece_i in 0..t.info.pieces.0.len() {
        let piece = Piece::new(piece_i, &t, &peers);
        app.emit("piece", &piece).unwrap();
        if piece.peers().is_empty() {
            no_peers.push(piece);
        } else {
            need_pieces.push(piece);
        }
    }

    Ok(())
}
