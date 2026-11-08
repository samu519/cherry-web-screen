use super::*;
use base64::Engine;
use serde::Deserialize;
use std::time::Duration;
use windows::Devices::Radios::{Radio, RadioAccessStatus, RadioKind, RadioState};
use windows::Media::Control::{
    GlobalSystemMediaTransportControlsSessionManager as SessionManager,
    GlobalSystemMediaTransportControlsSessionPlaybackStatus as PlaybackStatus,
};
use windows::Storage::Streams::DataReader;
use windows::Win32::Foundation::FILETIME;
use windows::Win32::Media::Audio::Endpoints::IAudioEndpointVolume;
use windows::Win32::Media::Audio::{
    eCapture, eMultimedia, eRender, IMMDeviceEnumerator, MMDeviceEnumerator,
};
use windows::Win32::System::Com::{CoCreateInstance, CLSCTX_ALL};
use windows::Win32::System::SystemInformation::{GlobalMemoryStatusEx, MEMORYSTATUSEX};
use windows::Win32::System::Threading::GetSystemTimes;
use windows::Win32::System::WinRT::{RoInitialize, RoUninitialize, RO_INIT_MULTITHREADED};

struct Apartment;
impl Apartment {
    fn new() -> Result<Self, String> {
        unsafe { RoInitialize(RO_INIT_MULTITHREADED) }.map_err(|error| error.to_string())?;
        Ok(Self)
    }
}
impl Drop for Apartment {
    fn drop(&mut self) {
        unsafe { RoUninitialize() };
    }
}

fn filetime(value: FILETIME) -> u64 {
    ((value.dwHighDateTime as u64) << 32) | value.dwLowDateTime as u64
}

fn cpu(state: &mut NativeState) -> Reading {
    let (mut idle, mut kernel, mut user) = (
        FILETIME::default(),
        FILETIME::default(),
        FILETIME::default(),
    );
    if let Err(error) =
        unsafe { GetSystemTimes(Some(&mut idle), Some(&mut kernel), Some(&mut user)) }
    {
        return Reading::unavailable("%", &error.to_string());
    }
    let current = (
        filetime(idle),
        filetime(kernel),
        filetime(user),
        Instant::now(),
    );
    let reading = if let Some(previous) = state.cpu_previous {
        if previous.3.elapsed() < Duration::from_millis(250) {
            return Reading::unavailable("%", "Calculando primera muestra de CPU.");
        }
        let total = current.1.saturating_sub(previous.1) + current.2.saturating_sub(previous.2);
        let idle = current.0.saturating_sub(previous.0);
        if total == 0 {
            Reading::unavailable("%", "Esperando una nueva muestra de CPU.")
        } else {
            Reading::available(
                ((total.saturating_sub(idle)) as f64 / total as f64 * 100.0).clamp(0.0, 100.0),
                "%",
            )
        }
    } else {
        Reading::unavailable("%", "Calculando primera muestra de CPU.")
    };
    state.cpu_previous = Some(current);
    reading
}

fn memory() -> (Reading, Option<u64>, Option<u64>) {
    let mut status = MEMORYSTATUSEX {
        dwLength: std::mem::size_of::<MEMORYSTATUSEX>() as u32,
        ..Default::default()
    };
    match unsafe { GlobalMemoryStatusEx(&mut status) } {
        Ok(()) if status.ullTotalPhys > 0 => {
            let used = status.ullTotalPhys.saturating_sub(status.ullAvailPhys);
            (
                Reading::available(used as f64 / status.ullTotalPhys as f64 * 100.0, "%"),
                Some(used),
                Some(status.ullTotalPhys),
            )
        }
        result => (
            Reading::unavailable("%", &format!("Memoria no disponible: {result:?}")),
            None,
            None,
        ),
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct WmiSensor {
    identifier: String,
    name: String,
    sensor_type: String,
    value: Option<f64>,
    parent: String,
}

fn sensors(_apartment: &Apartment) -> (Vec<Sensor>, Option<String>) {
    let mut available_provider = None;
    for provider in ["LibreHardwareMonitor", "OpenHardwareMonitor"] {
        let result = (|| -> Result<Vec<Sensor>, Box<dyn std::error::Error>> {
            // Apartment keeps COM initialized until all WMI objects are dropped.
            // COMLibrary::new intentionally never uninitializes COM; avoid incrementing
            // that counter on every poll of this long-lived process.
            let com = unsafe { wmi::COMLibrary::assume_initialized() };
            let connection =
                wmi::WMIConnection::with_namespace_path(&format!("ROOT\\{provider}"), com)?;
            let rows: Vec<WmiSensor> = connection
                .raw_query("SELECT Identifier, Name, SensorType, Value, Parent FROM Sensor")?;
            Ok(rows
                .into_iter()
                .filter_map(|row| {
                    let value = row.value.filter(|value| value.is_finite())?;
                    let unit = match row.sensor_type.as_str() {
                        "Temperature" => "°C",
                        "Load" | "Control" => "%",
                        "Fan" => "RPM",
                        "Power" => "W",
                        "Clock" => "MHz",
                        _ => "",
                    };
                    Some(Sensor {
                        id: format!("{}:{}", row.parent, row.identifier),
                        name: row.name,
                        kind: row.sensor_type,
                        value,
                        unit: unit.into(),
                    })
                })
                .collect())
        })();
        if let Ok(values) = result {
            if !values.is_empty() {
                return (values, Some(provider.into()));
            }
            available_provider.get_or_insert_with(|| provider.into());
        }
    }
    (vec![], available_provider)
}

fn endpoint(capture: bool) -> windows::core::Result<IAudioEndpointVolume> {
    unsafe {
        let enumerator: IMMDeviceEnumerator =
            CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)?;
        let device = enumerator
            .GetDefaultAudioEndpoint(if capture { eCapture } else { eRender }, eMultimedia)?;
        device.Activate(CLSCTX_ALL, None)
    }
}
fn audio_control(capture: bool) -> ControlState {
    match endpoint(capture).and_then(|volume| unsafe { volume.GetMasterVolumeLevelScalar() }) {
        Ok(value) => ControlState::available(serde_json::json!((value * 100.0).round())),
        Err(error) => {
            ControlState::unavailable(&format!("No hay endpoint de audio disponible: {error}"))
        }
    }
}
fn radio_for(id: ControlId) -> windows::core::Result<Radio> {
    let kind = if id == ControlId::Wifi {
        RadioKind::WiFi
    } else {
        RadioKind::Bluetooth
    };
    let radios = Radio::GetRadiosAsync()?.get()?;
    for radio in radios {
        if radio.Kind()? == kind {
            return Ok(radio);
        }
    }
    Err(windows::core::Error::from_hresult(windows::core::HRESULT(
        0x80070490u32 as i32,
    )))
}
fn radio_control(id: ControlId) -> ControlState {
    match radio_for(id).and_then(|radio| radio.State()) {
        Ok(state) if state == RadioState::On || state == RadioState::Off => {
            let mut control = ControlState::available(serde_json::json!(state == RadioState::On));
            control.reason =
                Some("Windows puede requerir permiso para modificar esta radio.".into());
            control
        }
        Ok(_) => ControlState::unavailable(
            "Radio deshabilitada por hardware o por una directiva de Windows.",
        ),
        Err(_) => ControlState::unavailable(
            "Windows no expone una radio compatible o su acceso está restringido.",
        ),
    }
}

fn artwork(
    properties: &windows::Media::Control::GlobalSystemMediaTransportControlsSessionMediaProperties,
) -> Option<String> {
    let stream = properties
        .Thumbnail()
        .ok()?
        .OpenReadAsync()
        .ok()?
        .get()
        .ok()?;
    let size = stream.Size().ok()?;
    if size == 0 || size > 1024 * 1024 {
        return None;
    }
    let content_type = stream.ContentType().ok()?.to_string();
    if !["image/jpeg", "image/png", "image/webp"].contains(&content_type.as_str()) {
        return None;
    }
    let reader = DataReader::CreateDataReader(&stream.GetInputStreamAt(0).ok()?).ok()?;
    let loaded = reader.LoadAsync(size as u32).ok()?.get().ok()?;
    if loaded as u64 != size {
        return None;
    }
    let mut bytes = vec![0; loaded as usize];
    reader.ReadBytes(&mut bytes).ok()?;
    Some(format!(
        "data:{content_type};base64,{}",
        base64::engine::general_purpose::STANDARD.encode(bytes)
    ))
}

fn read_media() -> Result<MediaState, String> {
    let manager = SessionManager::RequestAsync()
        .map_err(|e| e.to_string())?
        .get()
        .map_err(|e| e.to_string())?;
    let session = match manager.GetCurrentSession() {
        Ok(session) => session,
        Err(_) => {
            return Ok(MediaState::unavailable(
                "No hay una sesión multimedia activa en Windows.",
            ))
        }
    };
    let properties = session
        .TryGetMediaPropertiesAsync()
        .map_err(|e| e.to_string())?
        .get()
        .map_err(|e| e.to_string())?;
    let playback = session.GetPlaybackInfo().map_err(|e| e.to_string())?;
    let controls = playback.Controls().map_err(|e| e.to_string())?;
    let timeline = session.GetTimelineProperties().ok();
    let start = timeline
        .as_ref()
        .and_then(|t| t.StartTime().ok())
        .map(|t| t.Duration as f64 / 10_000_000.0)
        .unwrap_or(0.0);
    let duration = timeline
        .as_ref()
        .and_then(|t| t.EndTime().ok())
        .map(|t| (t.Duration as f64 / 10_000_000.0 - start).max(0.0));
    let position = timeline
        .as_ref()
        .and_then(|t| t.Position().ok())
        .map(|t| (t.Duration as f64 / 10_000_000.0 - start).max(0.0));
    Ok(MediaState {
        available: true,
        title: properties.Title().map_err(|e| e.to_string())?.to_string(),
        artist: properties.Artist().map_err(|e| e.to_string())?.to_string(),
        artwork: artwork(&properties),
        playing: playback.PlaybackStatus().map_err(|e| e.to_string())? == PlaybackStatus::Playing,
        position_seconds: position,
        duration_seconds: duration,
        controls: MediaControls {
            play_pause: controls.IsPlayPauseToggleEnabled().unwrap_or(false),
            previous: controls.IsPreviousEnabled().unwrap_or(false),
            next: controls.IsNextEnabled().unwrap_or(false),
        },
        reason: None,
    })
}

pub(super) fn snapshot(state: &mut NativeState) -> Snapshot {
    let cpu = cpu(state);
    let (ram, memory_used_bytes, memory_total_bytes) = memory();
    let apartment = Apartment::new();
    if state
        .sensor_cache
        .as_ref()
        .map(|(at, _, _)| at.elapsed() >= Duration::from_secs(10))
        .unwrap_or(true)
    {
        let (values, provider) = if let Ok(ref apartment) = apartment {
            sensors(apartment)
        } else {
            (vec![], None)
        };
        state.sensor_cache = Some((Instant::now(), values, provider));
    }
    let sensors = state
        .sensor_cache
        .as_ref()
        .map(|(_, sensors, _)| sensors.clone())
        .unwrap_or_default();
    let gpu_sensor = sensors.iter().find(|s| {
        s.kind == "Load"
            && s.id.to_lowercase().contains("gpu")
            && s.name.to_lowercase().contains("core")
    });
    let gpu = gpu_sensor
        .map(|s| Reading {
            value: Some(s.value.clamp(0.0, 100.0)),
            unit: "%".into(),
            reason: Some(format!("Sensor de carga: {} ({})", s.name, s.id)),
        })
        .unwrap_or_else(|| {
            Reading::unavailable(
                "%",
                "Sin sensor GPU Core de LibreHardwareMonitor/OpenHardwareMonitor.",
            )
        });
    let temperature_sensor = sensors
        .iter()
        .filter(|s| s.kind == "Temperature" && s.id.to_lowercase().contains("cpu"))
        .max_by(|a, b| a.value.total_cmp(&b.value));
    let temperature = temperature_sensor
        .map(|s| Reading {
            value: Some(s.value),
            unit: "°C".into(),
            reason: Some(format!("Sensor CPU más caliente: {}", s.name)),
        })
        .unwrap_or_else(|| {
            Reading::unavailable(
                "°C",
                "Windows no expone temperatura CPU sin un proveedor de sensores compatible.",
            )
        });
    let mut controls = BTreeMap::new();
    for (id, capture) in [("volume", false), ("microphone", true)] {
        controls.insert(
            id.into(),
            if apartment.is_ok() {
                audio_control(capture)
            } else {
                ControlState::unavailable("No se pudo iniciar COM.")
            },
        );
    }
    for id in [ControlId::Wifi, ControlId::Bluetooth] {
        controls.insert(
            id.key().into(),
            if apartment.is_ok() {
                radio_control(id)
            } else {
                ControlState::unavailable("No se pudo iniciar WinRT.")
            },
        );
    }
    controls.insert("brightness".into(), ControlState::unavailable("El brillo de monitores externos requiere un proveedor DDC/CI; no implementado en V0.1."));
    controls.insert(
        "doNotDisturb".into(),
        ControlState::unavailable("Control de No molestar de Windows no implementado en V0.1."),
    );
    let media = if apartment.is_ok() {
        read_media().unwrap_or_else(|reason| MediaState::unavailable(&reason))
    } else {
        MediaState::unavailable("No se pudo iniciar WinRT.")
    };
    Snapshot {
        protocol_version: PROTOCOL_VERSION,
        sampled_at: timestamp(),
        provider: "windows".into(),
        telemetry: Telemetry {
            cpu,
            ram,
            gpu,
            temperature,
            memory_used_bytes,
            memory_total_bytes,
            sensors,
        },
        controls,
        media,
    }
}

pub(super) fn set_control(
    request: ControlRequest,
    request_radio_access: impl FnOnce() -> Result<(), String>,
) -> Result<ControlResult, String> {
    let _apartment = Apartment::new()?;
    let value = match request.id {
        ControlId::Volume | ControlId::Microphone => {
            let volume =
                endpoint(request.id == ControlId::Microphone).map_err(|e| e.to_string())?;
            unsafe {
                volume.SetMasterVolumeLevelScalar(
                    request.value.as_f64().unwrap() as f32 / 100.0,
                    std::ptr::null(),
                )
            }
            .map_err(|e| e.to_string())?;
            serde_json::json!((unsafe { volume.GetMasterVolumeLevelScalar() }
                .map_err(|e| e.to_string())?
                * 100.0)
                .round())
        }
        ControlId::Wifi | ControlId::Bluetooth => {
            // The desktop shell initiates permission on its UI thread after a user action.
            request_radio_access()?;
            let radio = radio_for(request.id).map_err(|e| e.to_string())?;
            let desired = if request.value.as_bool().unwrap() {
                RadioState::On
            } else {
                RadioState::Off
            };
            let access = radio
                .SetStateAsync(desired)
                .map_err(|e| e.to_string())?
                .get()
                .map_err(|e| e.to_string())?;
            if access != RadioAccessStatus::Allowed {
                return Err("Windows rechazó el cambio de radio.".into());
            }
            let confirmed = radio.State().map_err(|e| e.to_string())?;
            if confirmed != desired {
                return Err("Windows todavía no confirmó el estado solicitado. Se actualizará en la siguiente lectura.".into());
            }
            serde_json::json!(confirmed == RadioState::On)
        }
        _ => return Err("Esta función no está disponible en el proveedor Windows V0.1.".into()),
    };
    Ok(ControlResult {
        protocol_version: PROTOCOL_VERSION,
        id: request.id,
        value,
    })
}

pub(super) fn media_action(action: MediaAction) -> Result<MediaState, String> {
    let _apartment = Apartment::new()?;
    let manager = SessionManager::RequestAsync()
        .map_err(|e| e.to_string())?
        .get()
        .map_err(|e| e.to_string())?;
    let session = manager
        .GetCurrentSession()
        .map_err(|_| "No hay una sesión multimedia activa.".to_string())?;
    let accepted = match action {
        MediaAction::PlayPause => session.TryTogglePlayPauseAsync(),
        MediaAction::Previous => session.TrySkipPreviousAsync(),
        MediaAction::Next => session.TrySkipNextAsync(),
    }
    .map_err(|e| e.to_string())?
    .get()
    .map_err(|e| e.to_string())?;
    if !accepted {
        return Err("La aplicación multimedia rechazó la acción.".into());
    }
    read_media()
}
