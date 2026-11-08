use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;
use std::time::{Instant, SystemTime, UNIX_EPOCH};

#[cfg(windows)]
mod windows_provider;

pub const PROTOCOL_VERSION: u32 = 1;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Reading {
    pub value: Option<f64>,
    pub unit: String,
    pub reason: Option<String>,
}
impl Reading {
    fn available(value: f64, unit: &str) -> Self {
        Self {
            value: Some(value),
            unit: unit.into(),
            reason: None,
        }
    }
    fn unavailable(unit: &str, reason: &str) -> Self {
        Self {
            value: None,
            unit: unit.into(),
            reason: Some(reason.into()),
        }
    }
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Sensor {
    pub id: String,
    pub name: String,
    pub kind: String,
    pub value: f64,
    pub unit: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Telemetry {
    pub cpu: Reading,
    pub ram: Reading,
    pub gpu: Reading,
    pub temperature: Reading,
    pub memory_used_bytes: Option<u64>,
    pub memory_total_bytes: Option<u64>,
    pub sensors: Vec<Sensor>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ControlState {
    pub available: bool,
    pub writable: bool,
    pub value: Value,
    pub reason: Option<String>,
}
impl ControlState {
    fn unavailable(reason: &str) -> Self {
        Self {
            available: false,
            writable: false,
            value: Value::Null,
            reason: Some(reason.into()),
        }
    }
    fn available(value: Value) -> Self {
        Self {
            available: true,
            writable: true,
            value,
            reason: None,
        }
    }
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaControls {
    pub play_pause: bool,
    pub previous: bool,
    pub next: bool,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaState {
    pub available: bool,
    pub title: String,
    pub artist: String,
    pub artwork: Option<String>,
    pub playing: bool,
    pub position_seconds: Option<f64>,
    pub duration_seconds: Option<f64>,
    pub controls: MediaControls,
    pub reason: Option<String>,
}
impl MediaState {
    fn unavailable(reason: &str) -> Self {
        Self {
            available: false,
            title: String::new(),
            artist: String::new(),
            artwork: None,
            playing: false,
            position_seconds: None,
            duration_seconds: None,
            controls: MediaControls::default(),
            reason: Some(reason.into()),
        }
    }
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub protocol_version: u32,
    pub sampled_at: u64,
    pub provider: String,
    pub telemetry: Telemetry,
    pub controls: BTreeMap<String, ControlState>,
    pub media: MediaState,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Capabilities {
    pub protocol_version: u32,
    pub platform: String,
    pub provider: String,
    pub controls: BTreeMap<String, ControlState>,
    pub media: bool,
    pub sensor_provider: Option<String>,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ControlId {
    Volume,
    Microphone,
    Wifi,
    Bluetooth,
    Brightness,
    DoNotDisturb,
}
impl ControlId {
    pub fn key(self) -> &'static str {
        match self {
            Self::Volume => "volume",
            Self::Microphone => "microphone",
            Self::Wifi => "wifi",
            Self::Bluetooth => "bluetooth",
            Self::Brightness => "brightness",
            Self::DoNotDisturb => "doNotDisturb",
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ControlRequest {
    pub id: ControlId,
    pub value: Value,
}
impl ControlRequest {
    pub fn validate(&self) -> Result<(), String> {
        match self.id {
            ControlId::Volume | ControlId::Microphone | ControlId::Brightness => {
                let value = self
                    .value
                    .as_f64()
                    .filter(|value| value.is_finite() && (0.0..=100.0).contains(value));
                if value.is_none() {
                    return Err("El valor debe ser un número entre 0 y 100.".into());
                }
            }
            _ => {
                if !self.value.is_boolean() {
                    return Err("El valor debe ser booleano.".into());
                }
            }
        }
        Ok(())
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ControlResult {
    pub protocol_version: u32,
    pub id: ControlId,
    pub value: Value,
}

#[derive(Clone, Copy, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum MediaAction {
    PlayPause,
    Previous,
    Next,
}

#[derive(Default)]
pub struct NativeState {
    cpu_previous: Option<(u64, u64, u64, Instant)>,
    sensor_cache: Option<(Instant, Vec<Sensor>, Option<String>)>,
}
impl NativeState {
    pub fn snapshot(&mut self) -> Snapshot {
        #[cfg(windows)]
        {
            windows_provider::snapshot(self)
        }
        #[cfg(not(windows))]
        {
            unavailable_snapshot("Proveedor nativo aún no implementado para este sistema.")
        }
    }
    pub fn capabilities(&mut self) -> Capabilities {
        let snapshot = self.snapshot();
        Capabilities {
            protocol_version: PROTOCOL_VERSION,
            platform: std::env::consts::OS.into(),
            provider: snapshot.provider,
            controls: snapshot.controls,
            media: cfg!(windows),
            sensor_provider: self
                .sensor_cache
                .as_ref()
                .and_then(|(_, _, provider)| provider.clone()),
        }
    }
}

fn timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

#[cfg(not(windows))]
fn unavailable_snapshot(reason: &str) -> Snapshot {
    let controls = [
        "volume",
        "microphone",
        "wifi",
        "bluetooth",
        "brightness",
        "doNotDisturb",
    ]
    .into_iter()
    .map(|id| (id.into(), ControlState::unavailable(reason)))
    .collect();
    Snapshot {
        protocol_version: PROTOCOL_VERSION,
        sampled_at: timestamp(),
        provider: "unsupported".into(),
        controls,
        telemetry: Telemetry {
            cpu: Reading::unavailable("%", reason),
            ram: Reading::unavailable("%", reason),
            gpu: Reading::unavailable("%", reason),
            temperature: Reading::unavailable("°C", reason),
            memory_used_bytes: None,
            memory_total_bytes: None,
            sensors: vec![],
        },
        media: MediaState::unavailable(reason),
    }
}

pub fn set_control(
    request: ControlRequest,
    request_radio_access: impl FnOnce() -> Result<(), String>,
) -> Result<ControlResult, String> {
    request.validate()?;
    #[cfg(windows)]
    {
        windows_provider::set_control(request, request_radio_access)
    }
    #[cfg(not(windows))]
    {
        let _ = (request, request_radio_access);
        Err("Control no compatible con este sistema.".into())
    }
}

pub fn media_action(action: MediaAction) -> Result<MediaState, String> {
    #[cfg(windows)]
    {
        windows_provider::media_action(action)
    }
    #[cfg(not(windows))]
    {
        let _ = action;
        Err("Multimedia no compatible con este sistema.".into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn validates_control_values_before_any_os_call() {
        assert!(ControlRequest {
            id: ControlId::Volume,
            value: serde_json::json!(101)
        }
        .validate()
        .is_err());
        assert!(ControlRequest {
            id: ControlId::Volume,
            value: serde_json::json!(true)
        }
        .validate()
        .is_err());
        assert!(ControlRequest {
            id: ControlId::Wifi,
            value: serde_json::json!(50)
        }
        .validate()
        .is_err());
        assert!(ControlRequest {
            id: ControlId::Volume,
            value: serde_json::json!(50)
        }
        .validate()
        .is_ok());
        assert!(
            serde_json::from_str::<ControlRequest>(r#"{"id":"terminal","value":"cmd"}"#).is_err()
        );
    }
    #[test]
    fn unavailable_is_null_instead_of_zero() {
        let reading = serde_json::to_value(Reading::unavailable("°C", "No sensor")).unwrap();
        assert!(reading["value"].is_null());
        assert_eq!(reading["reason"], "No sensor");
    }
    #[test]
    fn reads_real_snapshot_without_changing_system_settings() {
        let mut state = NativeState::default();
        let snapshot = state.snapshot();
        assert_eq!(snapshot.protocol_version, 1);
        #[cfg(windows)]
        {
            assert!(snapshot.telemetry.memory_total_bytes.unwrap_or(0) > 0);
            assert!(snapshot.telemetry.ram.value.is_some());
        }
        let encoded = serde_json::to_value(snapshot).unwrap();
        assert!(encoded.get("sampledAt").is_some());
    }
}
