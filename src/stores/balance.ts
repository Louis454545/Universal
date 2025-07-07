import { createRoot } from "solid-js";
import { createStore } from "solid-js/store";
import { invoke } from "@tauri-apps/api/core";

export interface BalanceEntry {
  id: string;
  user_id: string;
  username: string;
  fullname: string;
  balance_data: string;
  downloaded_at: string;
  file_path?: string;
}

export interface BalanceSettings {
  enabled_users: string[];
  download_folder: string;
}

export default createRoot(() => {
  const [settings, setSettings] = createStore<BalanceSettings>({
    enabled_users: [],
    download_folder: "",
  });

  const [history, setHistory] = createStore<{ entries: BalanceEntry[]; loading: boolean }>({
    entries: [],
    loading: false,
  });

  const loadSettings = async (): Promise<void> => {
    try {
      const loadedSettings = await invoke<BalanceSettings>("get_balance_settings");
      setSettings(loadedSettings);
    } catch (error) {
      console.error("Failed to load balance settings:", error);
    }
  };

  const saveSettings = async (newSettings: BalanceSettings): Promise<void> => {
    try {
      await invoke("save_balance_settings", { settings: newSettings });
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to save balance settings:", error);
      throw error;
    }
  };

  const loadHistory = async (): Promise<void> => {
    setHistory("loading", true);
    try {
      const entries = await invoke<BalanceEntry[]>("get_balance_history");
      setHistory({ entries, loading: false });
    } catch (error) {
      console.error("Failed to load balance history:", error);
      setHistory("loading", false);
    }
  };

  const downloadUserBalance = async (
    userId: string,
    username: string,
    fullname: string,
    balanceData: string
  ): Promise<string> => {
    try {
      const filename = await invoke<string>("download_user_balance", {
        userId,
        username,
        fullname,
        balanceData,
      });
      
      // Refresh history after download
      await loadHistory();
      
      return filename;
    } catch (error) {
      console.error("Failed to download balance:", error);
      throw error;
    }
  };

  const toggleUserEnabled = async (userId: string): Promise<void> => {
    const currentUsers = [...settings.enabled_users];
    const index = currentUsers.indexOf(userId);
    
    if (index >= 0) {
      currentUsers.splice(index, 1);
    } else {
      currentUsers.push(userId);
    }
    
    await saveSettings({
      ...settings,
      enabled_users: currentUsers,
    });
  };

  const setDownloadFolder = async (folder: string): Promise<void> => {
    await saveSettings({
      ...settings,
      download_folder: folder,
    });
  };

  const isUserEnabled = (userId: string): boolean => {
    return settings.enabled_users.includes(userId);
  };

  return {
    settings,
    history,
    loadSettings,
    saveSettings,
    loadHistory,
    downloadUserBalance,
    toggleUserEnabled,
    setDownloadFolder,
    isUserEnabled,
  };
});