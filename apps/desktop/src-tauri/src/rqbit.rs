use std::{path::PathBuf, sync::Mutex};
use tauri::window;
use tauri::Manager;
use tauri::State;
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::{process::CommandChild, ShellExt};
pub struct RqbitProcess(CommandChild);
pub type WrappedRqbitProcess = Mutex<Option<RqbitProcess>>;

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
            tauri::async_runtime::spawn(async move {
                // read events such as stdout
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => {
                            println!("Rqbit: {}", String::from_utf8(line).unwrap());
                        }
                        CommandEvent::Stderr(line) => {
                            println!("Rqbit: {}", String::from_utf8(line).unwrap());
                        }
                        _ => {}
                    }
                }
            });
            true
        }
    }
}
