use std::fs;
use std::path::PathBuf;

fn data_dir() -> PathBuf {
    let home = dirs::home_dir().expect("Could not find home directory");
    home.join(".contratiempo")
}

fn data_file() -> PathBuf {
    data_dir().join("data.json")
}

#[tauri::command]
fn ensure_data_dir() -> Result<String, String> {
    let dir = data_dir();
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    Ok(dir.to_string_lossy().to_string())
}

#[tauri::command]
fn read_sync_data() -> Result<String, String> {
    let file = data_file();
    if !file.exists() {
        return Ok(String::new());
    }
    fs::read_to_string(&file).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_sync_data(data: String) -> Result<(), String> {
    let dir = data_dir();
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    // Atomic write: write to tmp, then rename
    let file = data_file();
    let tmp = file.with_extension("json.tmp");
    fs::write(&tmp, &data).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &file).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            ensure_data_dir,
            read_sync_data,
            write_sync_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
