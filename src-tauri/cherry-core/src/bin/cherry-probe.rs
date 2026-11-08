// Read-only diagnostic: never invokes a control or media action.
fn main() {
    let mut state = cherry_core::NativeState::default();
    let capabilities = state.capabilities();
    std::thread::sleep(std::time::Duration::from_millis(500));
    let snapshot = state.snapshot();
    println!(
        "{}",
        serde_json::json!({ "capabilities": capabilities, "snapshot": snapshot })
    );
}
