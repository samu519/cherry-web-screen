pub use cherry_core as native;

use std::sync::Mutex;

#[tauri::command(async)]
fn native_capabilities(
    state: tauri::State<'_, Mutex<native::NativeState>>,
) -> Result<native::Capabilities, String> {
    let mut core = state.lock().map_err(|_| "Estado nativo bloqueado".to_string())?;
    Ok(core.capabilities())
}
#[tauri::command(async)]
fn native_snapshot(
    state: tauri::State<'_, Mutex<native::NativeState>>,
) -> Result<native::Snapshot, String> {
    let mut core = state.lock().map_err(|_| "Estado nativo bloqueado".to_string())?;
    Ok(core.snapshot())
}
#[tauri::command(async)]
fn native_set_control(
    app: tauri::AppHandle,
    request: native::ControlRequest,
) -> Result<native::ControlResult, String> {
    native::set_control(request, || request_radio_access(app))
}

#[cfg(windows)]
fn request_radio_access(app: tauri::AppHandle) -> Result<(), String> {
    use windows::Devices::Radios::{Radio, RadioAccessStatus};
    let (sender, receiver) = std::sync::mpsc::channel();
    app.run_on_main_thread(move || {
        let _ = sender.send(Radio::RequestAccessAsync());
    })
    .map_err(|e| e.to_string())?;
    let operation = receiver
        .recv_timeout(std::time::Duration::from_secs(5))
        .map_err(|e| e.to_string())?
        .map_err(|e| e.to_string())?;
    if operation.get().map_err(|e| e.to_string())? != RadioAccessStatus::Allowed {
        return Err("Windows no autorizó el control de radios.".into());
    }
    Ok(())
}

#[cfg(not(windows))]
fn request_radio_access(_: tauri::AppHandle) -> Result<(), String> {
    Err("Radios no disponibles para este sistema.".into())
}
#[tauri::command(async)]
fn native_media_action(action: native::MediaAction) -> Result<native::MediaState, String> {
    native::media_action(action)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(native::NativeState::default()))
        .invoke_handler(tauri::generate_handler![
            native_capabilities,
            native_snapshot,
            native_set_control,
            native_media_action
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
