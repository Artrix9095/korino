use anyhow::Context;
use bytes::Bytes;
use hex;
use rand::RngCore;
use serde::{self, Deserialize, Serialize};
use serde_bencode::de;
use serde_bytes::ByteBuf;
use sha1::{Digest, Sha1};
use std::{io::Read, path::Path};
use tauri_plugin_http::reqwest;
use tokio;

use super::hashes::Hashes;
#[derive(Debug, Deserialize, Clone, Serialize)]
pub struct Node(String, i64);

#[derive(Debug, Deserialize, Clone, Serialize)]
pub struct File {
    path: Vec<String>,
    length: i64,
    #[serde(default)]
    md5sum: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(untagged)]
pub enum Keys {
    /// If `length` is present then the download represents a single file.
    SingleFile {
        /// The length of the file in bytes.
        length: usize,
    },
    /// Otherwise it represents a set of files which go in a directory structure.
    ///
    /// For the purposes of the other keys in `Info`, the multi-file case is treated as only having
    /// a single file by concatenating the files in the order they appear in the files list.
    MultiFile { files: Vec<File> },
}

#[allow(dead_code)]
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Info {
    pub name: String,
    pub pieces: Hashes,
    #[serde(rename = "piece length")]
    pub piece_length: usize,
    #[serde(default)]
    pub md5sum: Option<String>,
    #[serde(default)]
    pub length: Option<i64>,
    #[serde(default)]
    pub files: Option<Vec<File>>,
    #[serde(default)]
    pub private: Option<u8>,
    #[serde(default)]
    pub path: Option<Vec<String>>,
    #[serde(default)]
    #[serde(rename = "root hash")]
    pub root_hash: Option<String>,
    #[serde(flatten)]
    pub keys: Option<Keys>,
    pub source: Option<String>,
}

#[derive(Debug, Deserialize, Clone, Serialize)]
pub struct Torrent {
    pub info: Info,
    #[serde(default)]
    pub announce: Option<String>,
    #[serde(default)]
    pub nodes: Option<Vec<Node>>,
    #[serde(default)]
    pub encoding: Option<String>,
    #[serde(default)]
    pub httpseeds: Option<Vec<String>>,
    #[serde(default)]
    #[serde(rename = "announce-list")]
    pub announce_list: Option<Vec<Vec<String>>>,
    #[serde(default)]
    #[serde(rename = "creation date")]
    pub creation_date: Option<i64>,
    #[serde(rename = "comment")]
    pub comment: Option<String>,
    #[serde(default)]
    #[serde(rename = "created by")]
    pub created_by: Option<String>,
}

impl Torrent {
    pub fn parse(bytes: &[u8]) -> Result<Torrent, serde_bencode::Error> {
        de::from_bytes(bytes)
    }
    pub async fn read(file: String) -> anyhow::Result<Self> {
        let dot_torrent = match url::Url::parse(&file) {
            Ok(url) if url.scheme() == "http" || url.scheme() == "https" => reqwest::get(url)
                .await
                .context("get torrent file")?
                .bytes()
                .await
                .context("get torrent file bytes")?,
            _ => Bytes::from(tokio::fs::read(&file).await.context("read torrent file")?),
        };
        let t = Torrent::parse(&dot_torrent).context("parse torrent file")?;
        Ok(t)
    }

    pub fn print_tree(&self) {
        match &self.info.keys.clone().unwrap() {
            Keys::SingleFile { .. } => {
                eprintln!("{}", self.info.name);
            }
            Keys::MultiFile { files } => {
                for file in files {
                    eprintln!("{}", file.path.join(std::path::MAIN_SEPARATOR_STR));
                }
            }
        }
    }

    pub fn length(&self) -> usize {
        match &self.info.keys {
            Some(Keys::SingleFile { length }) => *length,
            Some(Keys::MultiFile { files }) => files.iter().map(|file| file.length as usize).sum(),
            None => self.info.length.unwrap() as usize,
        }
    }
}
impl Info {
    pub fn hash(&self) -> [u8; 20] {
        let info_encoded =
            serde_bencode::to_bytes(&self).expect("re-encode info section should be fine");
        let mut hasher = Sha1::new();
        hasher.update(&info_encoded);
        hasher
            .finalize()
            .try_into()
            .expect("GenericArray<_, 20> == [_; 20]")
    }
}

fn render_torrent(torrent: &Torrent) {
    println!("name:\t\t{}", torrent.info.name);
    println!("announce:\t{:?}", torrent.announce);
    println!("nodes:\t\t{:?}", torrent.nodes);
    if let Some(al) = &torrent.announce_list {
        for a in al {
            println!("announce list:\t{}", a[0]);
        }
    }
    println!("httpseeds:\t{:?}", torrent.httpseeds);
    println!("creation date:\t{:?}", torrent.creation_date);
    println!("comment:\t{:?}", torrent.comment);
    println!("created by:\t{:?}", torrent.created_by);
    println!("encoding:\t{:?}", torrent.encoding);
    println!("piece length:\t{:?}", torrent.info.piece_length);
    println!("private:\t{:?}", torrent.info.private);
    println!("root hash:\t{:?}", torrent.info.root_hash);
    println!("md5sum:\t\t{:?}", torrent.info.md5sum);
    println!("path:\t\t{:?}", torrent.info.path);
    if let Some(files) = &torrent.info.files {
        for f in files {
            println!("file path:\t{:?}", f.path);
            println!("file length:\t{}", f.length);
            println!("file md5sum:\t{:?}", f.md5sum);
        }
    }

    println!("info hash:\t{:?}", hex::encode(torrent.info.hash()));
    // for piece in torrent.info.piece_hashes() {
    //     println!("piece:\t\t{}", hex::encode(piece));
    // }
}

pub fn generate_peer_id() -> [u8; 20] {
    let mut rng = rand::thread_rng();
    let mut bytes = [0u8; 20];
    rng.try_fill_bytes(&mut bytes).unwrap();
    bytes
}
