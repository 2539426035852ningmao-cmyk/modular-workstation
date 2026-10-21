// Minimal native entry adapted from create-tauri-app 4.7.5 (MIT OR Apache-2.0).
// Experiment only: reuse the workstation frontend; register no business commands.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running framework comparison");
}