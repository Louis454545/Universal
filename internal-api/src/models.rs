use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthDetails {
  pub device_id: String,
  pub access_token: String,
  pub refresh_token: String,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Preferences {
  pub region: String,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub balances_download_folder: Option<String>,
  #[serde(default)]
  pub balances_people_ids: Vec<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetRegionArgs {
  pub region: String,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Moment {
  pub id: String,
  pub region: String,
  pub start_date: String,
  pub end_date: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertJpegToWebpArgs {
  pub jpeg: Vec<u8>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompressWebpToSizeArgs {
  pub webp: Vec<u8>,
  pub max_size: usize,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationPermissionStatus {
  pub status: String, // "prompt" | "denied" | "granted"
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BalancesSettings {
  pub folder: String,
  pub people_ids: Vec<String>,
}
