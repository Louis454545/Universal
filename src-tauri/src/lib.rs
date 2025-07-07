use tauri::{window::Color, WebviewUrl, WebviewWindowBuilder};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
pub struct BalanceEntry {
    id: String,
    user_id: String,
    username: String,
    fullname: String,
    balance_data: String,
    downloaded_at: String,
    file_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BalanceSettings {
    enabled_users: Vec<String>,
    download_folder: String,
}

#[tauri::command]
fn navigate(webview_window: tauri::WebviewWindow, url: String) {
  _ = webview_window.navigate(tauri::Url::parse(&url).unwrap());
}

#[tauri::command]
async fn get_balance_settings() -> Result<BalanceSettings, String> {
    let config_dir = dirs::config_dir()
        .ok_or("Could not find config directory")?
        .join("stayreal");
    
    let settings_file = config_dir.join("balance_settings.json");
    
    if !settings_file.exists() {
        let default_download_folder = dirs::download_dir()
            .unwrap_or_else(|| dirs::home_dir().unwrap_or_default())
            .join("StayReal Balances")
            .to_string_lossy()
            .to_string();
            
        return Ok(BalanceSettings {
            enabled_users: vec![],
            download_folder: default_download_folder,
        });
    }
    
    let content = fs::read_to_string(settings_file)
        .map_err(|e| format!("Failed to read settings: {}", e))?;
    
    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse settings: {}", e))
}

#[tauri::command]
async fn save_balance_settings(settings: BalanceSettings) -> Result<(), String> {
    let config_dir = dirs::config_dir()
        .ok_or("Could not find config directory")?
        .join("stayreal");
    
    fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;
    
    let settings_file = config_dir.join("balance_settings.json");
    let content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    
    fs::write(settings_file, content)
        .map_err(|e| format!("Failed to write settings: {}", e))
}

#[tauri::command]
async fn download_user_balance(user_id: String, username: String, fullname: String, balance_data: String) -> Result<String, String> {
    let settings = get_balance_settings().await?;
    
    if !settings.enabled_users.contains(&user_id) {
        return Err("User not enabled for balance downloads".to_string());
    }
    
    let download_dir = PathBuf::from(&settings.download_folder);
    fs::create_dir_all(&download_dir)
        .map_err(|e| format!("Failed to create download directory: {}", e))?;
    
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S").to_string();
    let filename = format!("{}_{}_balance.json", username, timestamp);
    let file_path = download_dir.join(&filename);
    
    let balance_entry = BalanceEntry {
        id: format!("{}_{}", user_id, timestamp),
        user_id: user_id.clone(),
        username: username.clone(),
        fullname: fullname.clone(),
        balance_data,
        downloaded_at: chrono::Utc::now().to_rfc3339(),
        file_path: Some(file_path.to_string_lossy().to_string()),
    };
    
    let content = serde_json::to_string_pretty(&balance_entry)
        .map_err(|e| format!("Failed to serialize balance: {}", e))?;
    
    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write balance file: {}", e))?;
    
    // Save to balance history
    save_balance_entry(balance_entry).await?;
    
    Ok(filename)
}

#[tauri::command]
async fn get_balance_history() -> Result<Vec<BalanceEntry>, String> {
    let config_dir = dirs::config_dir()
        .ok_or("Could not find config directory")?
        .join("stayreal");
    
    let history_file = config_dir.join("balance_history.json");
    
    if !history_file.exists() {
        return Ok(vec![]);
    }
    
    let content = fs::read_to_string(history_file)
        .map_err(|e| format!("Failed to read history: {}", e))?;
    
    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse history: {}", e))
}

async fn save_balance_entry(entry: BalanceEntry) -> Result<(), String> {
    let mut history = get_balance_history().await?;
    history.push(entry);
    
    // Keep only last 100 entries
    if history.len() > 100 {
        history = history.into_iter().skip(history.len() - 100).collect();
    }
    
    let config_dir = dirs::config_dir()
        .ok_or("Could not find config directory")?
        .join("stayreal");
    
    fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;
    
    let history_file = config_dir.join("balance_history.json");
    let content = serde_json::to_string_pretty(&history)
        .map_err(|e| format!("Failed to serialize history: {}", e))?;
    
    fs::write(history_file, content)
        .map_err(|e| format!("Failed to write history: {}", e))
}

#[tauri::command]
async fn select_download_folder() -> Result<Option<String>, String> {
    use tauri_plugin_dialog::{DialogExt, FilePath};
    
    // This would need to be called from the frontend with proper dialog access
    Ok(None)
}

pub const ARKOSE_INIT_SCRIPT: &str = r#"
if (window.location.origin === "https://client-api.arkoselabs.com") {
  const tweak = (obj, prop, val) => obj.__defineGetter__(prop, () => val)

  tweak(navigator, "hardwareConcurrency", 4)
  tweak(navigator, "userAgentData", null)
  tweak(navigator, "platform", "iPhone")
  tweak(navigator, "connection", null)

  tweak(window.screen, "height", 852)
  tweak(window.screen, "width", 393)

  tweak(window.screen, "availHeight", 852)
  tweak(window.screen, "availWidth", 393)

  tweak(window.screen, "pixelDepth", 24)
  tweak(window.screen, "colorDepth", 24)

  tweak(window.screen.orientation, "type", "portrait-primary")
  tweak(window, "devicePixelRatio", 3)
}
"#;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_os::init())
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_internal_api::init())
    .setup(|app| {
        let mut win = WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
          .background_color(Color(0, 0, 0, 255))
          .user_agent("Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148")
          .initialization_script_for_all_frames(ARKOSE_INIT_SCRIPT);

        #[cfg(not(mobile))]
        {
          win = win
            .title("StayReal")
            .theme(Some(tauri::Theme::Dark))
            .inner_size(436.0, 800.0)
            .min_inner_size(436.0, 600.0)
        }

        win.build()?;

        Ok(())
    })
    .invoke_handler(tauri::generate_handler![
        navigate,
        get_balance_settings,
        save_balance_settings,
        download_user_balance,
        get_balance_history,
        select_download_folder
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
