import { createStore } from "solid-js/store";
import { invoke } from "@tauri-apps/api/core";

export interface BeRealLoggerSettings {
  save_directory: string;
  selected_friends: string[]; // user IDs
  auto_save_enabled: boolean;
}

export interface SavedBeRealPost {
  id: string;
  user_id: string;
  username: string;
  moment_id: string;
  primary_image_path: string;
  secondary_image_path: string;
  caption?: string;
  taken_at: string;
  saved_at: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface SavedLocation {
  latitude: number;
  longitude: number;
}

const [berealLoggerStore, setBerealLoggerStore] = createStore<{
  settings: BeRealLoggerSettings;
  savedPosts: SavedBeRealPost[];
  isLoading: boolean;
  error?: string;
}>({
  settings: {
    save_directory: "",
    selected_friends: [],
    auto_save_enabled: false,
  },
  savedPosts: [],
  isLoading: false,
});

export const berealLogger = {
  get store() {
    return berealLoggerStore;
  },

  async loadSettings() {
    setBerealLoggerStore("isLoading", true);
    setBerealLoggerStore("error", undefined);
    
    try {
      const settings: BeRealLoggerSettings = await invoke("get_bereal_logger_settings");
      setBerealLoggerStore("settings", settings);
    } catch (error) {
      setBerealLoggerStore("error", `Failed to load settings: ${error}`);
      console.error("Failed to load BeReal Logger settings:", error);
    } finally {
      setBerealLoggerStore("isLoading", false);
    }
  },

  async saveSettings(settings: BeRealLoggerSettings) {
    setBerealLoggerStore("isLoading", true);
    setBerealLoggerStore("error", undefined);
    
    try {
      await invoke("save_bereal_logger_settings", { settings });
      setBerealLoggerStore("settings", settings);
    } catch (error) {
      setBerealLoggerStore("error", `Failed to save settings: ${error}`);
      console.error("Failed to save BeReal Logger settings:", error);
      throw error;
    } finally {
      setBerealLoggerStore("isLoading", false);
    }
  },

  async selectSaveDirectory(): Promise<string | null> {
    try {
      const result: string | null = await invoke("select_save_directory");
      return result;
    } catch (error) {
      setBerealLoggerStore("error", `Failed to select directory: ${error}`);
      console.error("Failed to select save directory:", error);
      throw error;
    }
  },

  async savePost(
    userId: string,
    username: string,
    momentId: string,
    primaryImageUrl: string,
    secondaryImageUrl: string,
    caption?: string,
    takenAt?: string,
    location?: SavedLocation
  ): Promise<string> {
    setBerealLoggerStore("isLoading", true);
    setBerealLoggerStore("error", undefined);
    
    try {
      const postId: string = await invoke("save_bereal_post", {
        user_id: userId,
        username,
        moment_id: momentId,
        primary_image_url: primaryImageUrl,
        secondary_image_url: secondaryImageUrl,
        caption,
        taken_at: takenAt || new Date().toISOString(),
        location,
      });
      
      // Refresh saved posts
      await this.loadSavedPosts();
      
      return postId;
    } catch (error) {
      setBerealLoggerStore("error", `Failed to save post: ${error}`);
      console.error("Failed to save BeReal post:", error);
      throw error;
    } finally {
      setBerealLoggerStore("isLoading", false);
    }
  },

  async loadSavedPosts() {
    setBerealLoggerStore("isLoading", true);
    setBerealLoggerStore("error", undefined);
    
    try {
      const posts: SavedBeRealPost[] = await invoke("get_saved_posts");
      setBerealLoggerStore("savedPosts", posts);
    } catch (error) {
      setBerealLoggerStore("error", `Failed to load saved posts: ${error}`);
      console.error("Failed to load saved posts:", error);
    } finally {
      setBerealLoggerStore("isLoading", false);
    }
  },

  async loadSavedPostsByUser(userId: string): Promise<SavedBeRealPost[]> {
    try {
      const posts: SavedBeRealPost[] = await invoke("get_saved_posts_by_user", { user_id: userId });
      return posts;
    } catch (error) {
      setBerealLoggerStore("error", `Failed to load user posts: ${error}`);
      console.error("Failed to load user posts:", error);
      throw error;
    }
  },

  async deletePost(postId: string) {
    setBerealLoggerStore("isLoading", true);
    setBerealLoggerStore("error", undefined);
    
    try {
      await invoke("delete_saved_post", { post_id: postId });
      
      // Remove from local state
      setBerealLoggerStore("savedPosts", (posts) => 
        posts.filter(post => post.id !== postId)
      );
    } catch (error) {
      setBerealLoggerStore("error", `Failed to delete post: ${error}`);
      console.error("Failed to delete post:", error);
      throw error;
    } finally {
      setBerealLoggerStore("isLoading", false);
    }
  },

  async getStats(): Promise<Record<string, number>> {
    try {
      const stats: Record<string, number> = await invoke("get_saved_posts_stats");
      return stats;
    } catch (error) {
      setBerealLoggerStore("error", `Failed to get stats: ${error}`);
      console.error("Failed to get stats:", error);
      throw error;
    }
  },

  updateSelectedFriends(friendIds: string[]) {
    setBerealLoggerStore("settings", "selected_friends", friendIds);
  },

  updateAutoSaveEnabled(enabled: boolean) {
    setBerealLoggerStore("settings", "auto_save_enabled", enabled);
  },

  updateSaveDirectory(directory: string) {
    setBerealLoggerStore("settings", "save_directory", directory);
  },

  clearError() {
    setBerealLoggerStore("error", undefined);
  },

  // Check if a user is selected for auto-saving
  isUserSelected(userId: string): boolean {
    return berealLoggerStore.settings.selected_friends.includes(userId);
  },

  // Auto-save a post if the user is selected and auto-save is enabled
  async autoSavePostIfEnabled(
    userId: string,
    username: string,
    momentId: string,
    primaryImageUrl: string,
    secondaryImageUrl: string,
    caption?: string,
    takenAt?: string,
    location?: SavedLocation
  ): Promise<string | null> {
    if (!berealLoggerStore.settings.auto_save_enabled) {
      return null;
    }

    if (!this.isUserSelected(userId)) {
      return null;
    }

    try {
      return await this.savePost(
        userId,
        username,
        momentId,
        primaryImageUrl,
        secondaryImageUrl,
        caption,
        takenAt,
        location
      );
    } catch (error) {
      console.error("Auto-save failed:", error);
      return null;
    }
  }
};

export default berealLogger;