use ffmpeg_next::{self as ffmpeg, codec, format, media};
use http::response::Builder;
use http::{HeaderMap, StatusCode};
use serde::{Deserialize, Serialize};
use std::fmt::Debug;
use std::net::SocketAddr;
use std::str::FromStr;
use std::{path::PathBuf, sync::Mutex};
use tauri::State;
use tauri::{Manager, UriSchemeResponder};
use tauri_plugin_http::reqwest;
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::{process::CommandChild, ShellExt};

pub struct RqbitProcess(CommandChild);
pub type WrappedRqbitProcess = Mutex<Option<RqbitProcess>>;

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiAddTorrentResponse {
    pub id: Option<usize>,
    pub details: TorrentDetailsResponse,
    pub output_folder: String,
    pub seen_peers: Option<Vec<SocketAddr>>,
}

impl ApiAddTorrentResponse {
    pub fn file_paths(&self) -> Vec<PathBuf> {
        self.details
            .files
            .iter()
            .filter(|f| f.included)
            .map(|f| {
                let mut path = PathBuf::from(&self.output_folder);
                path.push(&f.name);
                path
            })
            .collect()
    }
    fn split_container_format(
        // title: &String,
        path: PathBuf,
    ) -> Result<Vec<TorrentMedia>, ffmpeg::Error> {
        match format::input(&path) {
            Ok(mut input) => {
                let mut media_list = Vec::new();

                for stream in input.streams_mut() {
                    let parameters = stream.parameters();

                    let codec_type = parameters.medium();
                    println!("codec_type: {:?}", codec_type);
                    let codec_ctx = codec::Context::from_parameters(parameters.clone())?;

                    let codec = codec_ctx.codec().unwrap();

                    let (extension, mimetype) = match codec_type {
                        media::Type::Video => ("mkv", "video/x-matroska"),
                        media::Type::Audio => match codec_ctx.codec().unwrap().name() {
                            "aac" => ("aac", "audio/aac"),
                            "mp3" => ("mp3", "audio/mpeg"),
                            _ => ("mka", "audio/x-matroska"),
                        },
                        media::Type::Subtitle => match codec.name() {
                            "ass" => ("ass", "text/x-ass"),
                            "srt" => ("srt", "text/srt"),
                            _ => ("sub", "text/plain"),
                        },
                        _ => continue,
                    };
                    println!("{} {}", codec.name(), extension);

                    // media_list.push(TorrentMedia {

                    //     mimetype: mimetype.to_string(),
                    // });
                }

                Ok(media_list)
            }
            Err(err) => Err(err),
        }
    }

    pub fn to_playlists(&self, host: String) -> Vec<TorrentPlaylist> {
        let mut playlists = Vec::new();
        for (index, file) in self.file_paths().iter().enumerate() {
            println!("file: {:?}", file);
            //Split the file into audio, video, and subtitle components

            //Get the name of the file
            let title: String = file
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();

            match file.extension().unwrap().to_str().unwrap() {
                // no need to handle mp4 files.
                "mp4" => {
                    playlists.push(TorrentPlaylist {
                        title: title.clone(),
                        media: vec![TorrentMedia {
                            mimetype: "video/mp4".into(),
                            src: TorrentMedia::stream_url(
                                &host,
                                self.id.unwrap().to_string(),
                                index,
                                &title,
                            )
                            .into(),
                        }],
                        description: None,
                    });
                }
                "mkv" => {
                    // Split the file into audio, video, and subtitles using ffmpeg and create a playlist
                    playlists.push(TorrentPlaylist {
                        title: title.clone(),
                        media: vec![TorrentMedia {
                            mimetype: "video/mpeg".into(),
                            src: TorrentMedia::stream_url(
                                &host,
                                self.id.unwrap().to_string(),
                                index,
                                &title,
                            )
                            .into(),
                        }], // Self::split_container_format(file.to_path_buf()).unwrap_or_default(),
                        description: None,
                    })
                }
                _ => {}
            }
        }
        playlists
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TorrentDetailsResponse {
    pub info_hash: String,
    pub name: Option<String>,
    pub files: Vec<TorrentDetailsResponseFile>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TorrentDetailsResponseFile {
    pub name: String,
    pub components: Vec<String>,
    pub length: u64,
    pub included: bool,
}

#[tauri::command]
pub fn start_rqbit(
    app: tauri::AppHandle,
    state: State<WrappedRqbitProcess>,
    host: String,
    out_dir: Option<PathBuf>,
) -> bool {
    let out_dir = out_dir.unwrap_or(app.path().app_cache_dir().unwrap());
    eprintln!("Rqbit host: {:?}", host);
    eprintln!("Rqbit out dir: {:?}", out_dir);
    let mut state = state.lock().unwrap();
    match &mut *state {
        Some(_) => false,
        None => {
            eprintln!("Starting Rqbit");
            let (mut rx, process) = app
                .shell()
                .sidecar("rqbit")
                .expect("binaries/rqbit not found")
                // .arg("-v error")
                .arg("--http-api-listen-addr")
                .arg(&host)
                .arg("server")
                .arg("start")
                .arg(&out_dir)
                .spawn()
                .expect("Rqbit failed to start");

            println!("Rqbit started");
            *state = Some(RqbitProcess(process));
            // tauri::async_runtime::spawn(async move {
            //     // read events such as stdout
            //     while let Some(event) = rx.recv().await {
            //         match event {
            //             CommandEvent::Stdout(line) => {
            //                 println!("Rqbit: {}", String::from_utf8(line).unwrap());
            //             }
            //             CommandEvent::Stderr(line) => {
            //                 println!("Rqbit: {}", String::from_utf8(line).unwrap());
            //             }
            //             _ => {}
            //         }
            //     }
            // });
            true
        }
    }
}
#[derive(Debug, Clone, Serialize, Deserialize)]
struct TorrentRequestQueryParams {
    host: String,
    torrent: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
struct TorrentMedia {
    src: String,
    mimetype: String,
}

impl TorrentMedia {
    pub fn new(src: String, mimetype: String) -> Self {
        Self { src, mimetype }
    }
    pub fn stream_url(host: &String, id: String, media_id: usize, title: &String) -> String {
        let title = urlencoding::encode(title).to_string();
        format!("http://{host}/torrents/{id}/stream/{media_id}/{title}")
    }
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TorrentPlaylist {
    media: Vec<TorrentMedia>,
    title: String,
    description: Option<String>,
}

pub async fn torrent_handler(
    // _: &tauri::AppHandle,
    request: http::Request<Vec<u8>>,
    mut res: Builder,
    responder: UriSchemeResponder,
) {
    let sanitized_url =
        url::Url::parse(&sanitize_url(&request.uri().to_string()).unwrap()).unwrap();
    let query =
        serde_urlencoded::from_str::<TorrentRequestQueryParams>(&sanitized_url.query().unwrap());

    if let Ok(query) = query {
        let client = reqwest::Client::new();
        let torrent = query.torrent.replace("%20", " ");
        let host = query.host;
        let torrent: ApiAddTorrentResponse = client
            .post(format!("http://{}/torrents", host))
            .body(torrent)
            .send()
            .await
            .expect("failed to send request")
            .json()
            .await
            .expect("failed to parse response");

        let playlist = torrent.to_playlists(host);
        let body = serde_json::to_string(&playlist).unwrap();
        res = res.status(200).header("Content-Type", "application/json");
        responder.respond(res.body(body.as_bytes().to_vec()).unwrap())

        // Redirect to video url
    } else {
        res = res.status(StatusCode::BAD_REQUEST);
        responder.respond(res.body(vec![]).unwrap())
    }
}

fn sanitize_url(url_str: &str) -> Result<String, url::ParseError> {
    let url = url::Url::parse(url_str)?;

    // Manually decode percent-encoded sequences in the path
    let decoded_path: String = url
        .path_segments()
        .map(|segments| {
            segments
                .map(|segment| decode_percent_encoded(segment))
                .collect::<Vec<_>>()
                .join("/")
        })
        .unwrap_or_default();

    // Manually decode percent-encoded sequences in the query, if present
    let decoded_query: Option<String> = url.query().map(|query| decode_percent_encoded(query));

    // Rebuild the URL
    let mut sanitized_url = url.clone();
    sanitized_url.set_path(&decoded_path);
    if let Some(query) = decoded_query {
        sanitized_url.set_query(Some(&query));
    }

    Ok(sanitized_url.to_string())
}

// Helper function to manually decode percent-encoded sequences
fn decode_percent_encoded(input: &str) -> String {
    let mut output = String::new();
    let mut chars = input.chars().peekable();

    while let Some(c) = chars.next() {
        if c == '%' {
            if let (Some(first), Some(second)) = (chars.next(), chars.next()) {
                if let (Some(first_digit), Some(second_digit)) =
                    (first.to_digit(16), second.to_digit(16))
                {
                    let decoded_char = (first_digit * 16 + second_digit) as u8 as char;
                    output.push(decoded_char);
                } else if first == '2' && second == '0' {
                    output.push(' ');
                } else {
                    // If not valid hex digits, push them back as-is
                    output.push('%');
                    output.push(first);
                    output.push(second);
                }
            } else {
                output.push('%');
            }
        } else {
            output.push(c);
        }
    }

    output
}
