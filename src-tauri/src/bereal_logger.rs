use std::path::PathBuf;
use std::fs;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use tauri::{command, Manager, AppHandle};
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BeRealLoggerSettings {
    pub save_directory: String,
    pub selected_friends: Vec<String>, // user IDs
    pub auto_save_enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SavedBeRealPost {
    pub id: String,
    pub user_id: String,
    pub username: String,
    pub moment_id: String,
    pub primary_image_path: String,
    pub secondary_image_path: String,
    pub caption: Option<String>,
    pub taken_at: String,
    pub saved_at: String,
    pub location: Option<SavedLocation>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SavedLocation {
    pub latitude: f64,
    pub longitude: f64,
}

impl Default for BeRealLoggerSettings {
    fn default() -> Self {
        Self {
            save_directory: String::new(),
            selected_friends: Vec::new(),
            auto_save_enabled: false,
        }
    }
}

fn get_config_path(app_handle: &AppHandle) -> Result<PathBuf, Box<dyn std::error::Error>> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    fs::create_dir_all(&app_data_dir)?;
    Ok(app_data_dir.join("bereal_logger_config.json"))
}

fn get_posts_index_path(app_handle: &AppHandle) -> Result<PathBuf, Box<dyn std::error::Error>> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    fs::create_dir_all(&app_data_dir)?;
    Ok(app_data_dir.join("saved_posts_index.json"))
}

#[command]
pub async fn get_bereal_logger_settings(app_handle: AppHandle) -> Result<BeRealLoggerSettings, String> {
    let config_path = get_config_path(&app_handle).map_err(|e| e.to_string())?;
    
    if !config_path.exists() {
        return Ok(BeRealLoggerSettings::default());
    }
    
    let content = fs::read_to_string(config_path).map_err(|e| e.to_string())?;
    let settings: BeRealLoggerSettings = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    
    Ok(settings)
}

#[command]
pub async fn save_bereal_logger_settings(
    app_handle: AppHandle,
    settings: BeRealLoggerSettings,
) -> Result<(), String> {
    let config_path = get_config_path(&app_handle).map_err(|e| e.to_string())?;
    let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(config_path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub async fn select_save_directory(app_handle: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
    
    let dialog_result = app_handle
        .dialog()
        .file()
        .set_directory(true)
        .blocking_pick_folder();
    
    match dialog_result {
        Some(path) => Ok(Some(path.to_string_lossy().to_string())),
        None => Ok(None),
    }
}

#[command]
pub async fn save_bereal_post(
    app_handle: AppHandle,
    user_id: String,
    username: String,
    moment_id: String,
    primary_image_url: String,
    secondary_image_url: String,
    caption: Option<String>,
    taken_at: String,
    location: Option<SavedLocation>,
) -> Result<String, String> {
    let settings = get_bereal_logger_settings(app_handle.clone()).await?;
    
    if settings.save_directory.is_empty() {
        return Err("No save directory configured".to_string());
    }
    
    let save_dir = PathBuf::from(&settings.save_directory);
    if !save_dir.exists() {
        return Err("Save directory does not exist".to_string());
    }
    
    // Create user directory if it doesn't exist
    let user_dir = save_dir.join(&username);
    fs::create_dir_all(&user_dir).map_err(|e| e.to_string())?;
    
    // Generate unique filenames
    let post_id = Uuid::new_v4().to_string();
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let primary_filename = format!("{}_{}_primary.jpg", timestamp, post_id);
    let secondary_filename = format!("{}_{}_secondary.jpg", timestamp, post_id);
    
    let primary_path = user_dir.join(&primary_filename);
    let secondary_path = user_dir.join(&secondary_filename);
    
    // Download and save images
    download_image(&primary_image_url, &primary_path).await?;
    download_image(&secondary_image_url, &secondary_path).await?;
    
    // Create saved post record
    let saved_post = SavedBeRealPost {
        id: post_id.clone(),
        user_id,
        username,
        moment_id,
        primary_image_path: primary_path.to_string_lossy().to_string(),
        secondary_image_path: secondary_path.to_string_lossy().to_string(),
        caption,
        taken_at,
        saved_at: Utc::now().to_rfc3339(),
        location,
    };
    
    // Add to index
    add_post_to_index(app_handle, saved_post).await?;
    
    Ok(post_id)
}

async fn download_image(url: &str, path: &PathBuf) -> Result<(), String> {
    let client = reqwest::Client::new();
    let response = client.get(url).send().await.map_err(|e| e.to_string())?;
    
    if !response.status().is_success() {
        return Err(format!("Failed to download image: HTTP {}", response.status()));
    }
    
    let bytes = response.bytes().await.map_err(|e| e.to_string())?;
    fs::write(path, bytes).map_err(|e| e.to_string())?;
    
    Ok(())
}

async fn add_post_to_index(app_handle: AppHandle, post: SavedBeRealPost) -> Result<(), String> {
    let index_path = get_posts_index_path(&app_handle).map_err(|e| e.to_string())?;
    
    let mut posts: Vec<SavedBeRealPost> = if index_path.exists() {
        let content = fs::read_to_string(&index_path).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        Vec::new()
    };
    
    posts.push(post);
    
    let content = serde_json::to_string_pretty(&posts).map_err(|e| e.to_string())?;
    fs::write(index_path, content).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[command]
pub async fn get_saved_posts(app_handle: AppHandle) -> Result<Vec<SavedBeRealPost>, String> {
    let index_path = get_posts_index_path(&app_handle).map_err(|e| e.to_string())?;
    
    if !index_path.exists() {
        return Ok(Vec::new());
    }
    
    let content = fs::read_to_string(index_path).map_err(|e| e.to_string())?;
    let posts: Vec<SavedBeRealPost> = serde_json::from_str(&content).unwrap_or_default();
    
    Ok(posts)
}

#[command]
pub async fn get_saved_posts_by_user(app_handle: AppHandle, user_id: String) -> Result<Vec<SavedBeRealPost>, String> {
    let all_posts = get_saved_posts(app_handle).await?;
    let user_posts = all_posts
        .into_iter()
        .filter(|post| post.user_id == user_id)
        .collect();
    
    Ok(user_posts)
}

#[command]
pub async fn delete_saved_post(app_handle: AppHandle, post_id: String) -> Result<(), String> {
    let index_path = get_posts_index_path(&app_handle).map_err(|e| e.to_string())?;
    
    if !index_path.exists() {
        return Err("No saved posts found".to_string());
    }
    
    let content = fs::read_to_string(&index_path).map_err(|e| e.to_string())?;
    let mut posts: Vec<SavedBeRealPost> = serde_json::from_str(&content).unwrap_or_default();
    
    // Find and remove the post
    let post_index = posts
        .iter()
        .position(|post| post.id == post_id)
        .ok_or("Post not found")?;
    
    let removed_post = posts.remove(post_index);
    
    // Delete the image files
    let _ = fs::remove_file(&removed_post.primary_image_path);
    let _ = fs::remove_file(&removed_post.secondary_image_path);
    
    // Update the index
    let content = serde_json::to_string_pretty(&posts).map_err(|e| e.to_string())?;
    fs::write(index_path, content).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[command]
pub async fn get_saved_posts_stats(app_handle: AppHandle) -> Result<HashMap<String, usize>, String> {
    let all_posts = get_saved_posts(app_handle).await?;
    let mut stats = HashMap::new();
    
    for post in all_posts {
        *stats.entry(post.username).or_insert(0) += 1;
    }
    
    Ok(stats)
}