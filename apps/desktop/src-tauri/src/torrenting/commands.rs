use crate::torrenting::BLOCK_MAX;

use super::peers::{Handshake, Peer};
use super::piece::*;
use super::torrent::{self, generate_peer_id, Torrent};
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
    let peer_id = generate_peer_id();

    let peer_info = TrackerResponse::query(&t, info_hash, b"01234567890123456789")
        .await
        .unwrap();

    let mut peer_list = Vec::new();

    let mut peers = futures_util::stream::iter(peer_info.peers.0.into_iter())
        .map(|addr: SocketAddrV4| async move {
            let peer = Peer::new(addr, info_hash, &peer_id).await;
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
        if piece.peers().is_empty() {
            no_peers.push(piece);
        } else {
            need_pieces.push(piece);
        }
    }
    assert!(no_peers.is_empty());

    // TODO: this is dumb because all the pieces for a given torrent may not fit in memory!
    // should probably write every piece to disk so that we can also resume downloads, and seed
    // later on.
    let mut all_pieces = vec![0; t.length()];
    while let Some(piece) = need_pieces.pop() {
        // the + (BLOCK_MAX - 1) rounds up
        let piece_size = piece.length();
        let nblocks = (piece_size + (BLOCK_MAX - 1)) / BLOCK_MAX;
        let peers: Vec<_> = peers
            .iter_mut()
            .enumerate()
            .filter_map(|(peer_i, peer)| piece.peers().contains(&peer_i).then_some(peer))
            .collect();

        let (submit, tasks) = kanal::bounded_async(nblocks);
        for block in 0..nblocks {
            submit
                .send(block)
                .await
                .expect("bound holds all these items");
        }
        let (finish, mut done) = tokio::sync::mpsc::channel(nblocks);
        let mut participants = futures_util::stream::futures_unordered::FuturesUnordered::new();
        for peer in peers {
            participants.push(peer.participate(
                piece.index(),
                piece_size,
                nblocks,
                submit.clone(),
                tasks.clone(),
                finish.clone(),
            ));
        }
        drop(submit);
        drop(finish);
        drop(tasks);

        eprintln!("start receive loop");
        let mut all_blocks = vec![0u8; piece_size];
        let mut bytes_received = 0;
        loop {
            tokio::select! {
                joined = participants.next(), if !participants.is_empty() => {
                    // if a participant ends early, it's either slow or failed
                    eprintln!("participant finished");
                    match joined {
                        None => {
                            // there are no peers!
                            // this must mean we are about to get None from done.recv(),
                            // so we'll handle it there
                        }
                        Some(Ok(_)) => {
                            // the peer gave up because it timed out
                            // nothing to do, except maybe de-prioritize this peer for later
                            // TODO
                        }
                        Some(Err(_)) => {
                            // the peer failed and should be removed
                            // it already isn't participating in this piece any more, so this is
                            // more of an indicator that we shouldn't try this peer again, and
                            // should remove it from the global peer list
                            // TODO
                        }
                    }
                }
                piece = done.recv() => {
                    if let Some(piece) = piece {
                        eprintln!("got piece");

                        // keep track of the bytes in message
                        let piece = super::peers::Piece::ref_from_bytes(&piece.payload[..])
                            .expect("always get all Piece response fields from peer");
                        app.emit("torrent://piece", &piece).unwrap();
                        bytes_received += piece.block().len();
                        all_blocks[piece.begin() as usize..][..piece.block().len()].copy_from_slice(piece.block());
                        if bytes_received == piece_size {
                            // have received every piece
                            // this must mean that all participations have either exited or are
                            // waiting for more work -- in either case, it is okay to drop all the
                            // participant futures.
                            break;
                        }
                    } else {
                        eprintln!("got pieces end");
                        // there are no peers left, so we can't progress!
                        break;
                    }
                }
            }
        }
        drop(participants);
    }
    Ok(())
}
