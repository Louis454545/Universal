import { Component, createSignal, createEffect, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import berealLogger, { type BeRealLoggerSettings } from "~/stores/bereal-logger";
import feed from "~/stores/feed";
import toast from "solid-toast";

interface Friend {
  id: string;
  username: string;
  profilePicture?: string;
}

const BeRealLoggerSettings: Component = () => {
  const [localSettings, setLocalSettings] = createStore<BeRealLoggerSettings>({
    save_directory: "",
    selected_friends: [],
    auto_save_enabled: false,
  });
  
  const [availableFriends, setAvailableFriends] = createSignal<Friend[]>([]);
  const [isSaving, setIsSaving] = createSignal(false);

  // Load settings on component mount
  createEffect(async () => {
    await berealLogger.loadSettings();
    setLocalSettings(berealLogger.store.settings);
    
    // Extract friends from feed data
    const friendsData = feed.store.data?.friendsPosts || [];
    const friends: Friend[] = friendsData.map(post => ({
      id: post.user.id,
      username: post.user.username,
      profilePicture: post.user.profilePicture?.url,
    }));
    setAvailableFriends(friends);
  });

  const handleSelectDirectory = async () => {
    try {
      const selectedPath = await berealLogger.selectSaveDirectory();
      if (selectedPath) {
        setLocalSettings("save_directory", selectedPath);
      }
    } catch (error) {
      toast.error("Failed to select directory");
    }
  };

  const handleToggleFriend = (friendId: string) => {
    const currentSelected = localSettings.selected_friends;
    if (currentSelected.includes(friendId)) {
      setLocalSettings("selected_friends", currentSelected.filter(id => id !== friendId));
    } else {
      setLocalSettings("selected_friends", [...currentSelected, friendId]);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await berealLogger.saveSettings(localSettings);
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = () => {
    return localSettings.save_directory.length > 0;
  };

  return (
    <div class="p-4 space-y-6">
      {/* Header */}
      <div class="text-center">
        <h2 class="text-2xl font-bold text-white mb-2">BeReal Logger Settings</h2>
        <p class="text-gray-400 text-sm">
          Configure automatic saving of BeReal posts from selected friends
        </p>
      </div>

      {/* Error Display */}
      <Show when={berealLogger.store.error}>
        <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p class="text-red-400 text-sm">{berealLogger.store.error}</p>
          <button
            onClick={() => berealLogger.clearError()}
            class="text-red-300 hover:text-red-200 text-xs mt-1 underline"
          >
            Dismiss
          </button>
        </div>
      </Show>

      {/* Save Directory */}
      <div class="space-y-3">
        <label class="block text-white font-medium">Save Directory</label>
        <div class="flex gap-2">
          <div class="flex-1 bg-gray-800 rounded-lg p-3 border border-gray-700">
            <p class="text-gray-300 text-sm">
              {localSettings.save_directory || "No directory selected"}
            </p>
          </div>
          <button
            onClick={handleSelectDirectory}
            class="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Browse
          </button>
        </div>
        <p class="text-gray-400 text-xs">
          BeReal posts will be saved to this directory, organized by username
        </p>
      </div>

      {/* Auto-save Toggle */}
      <div class="space-y-3">
        <label class="flex items-center justify-between">
          <span class="text-white font-medium">Enable Auto-save</span>
          <button
            onClick={() => setLocalSettings("auto_save_enabled", !localSettings.auto_save_enabled)}
            class={`w-12 h-6 rounded-full transition-colors ${
              localSettings.auto_save_enabled ? "bg-blue-600" : "bg-gray-600"
            }`}
          >
            <div
              class={`w-5 h-5 bg-white rounded-full transition-transform ${
                localSettings.auto_save_enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </label>
        <p class="text-gray-400 text-xs">
          Automatically save BeReal posts from selected friends when they appear in your feed
        </p>
      </div>

      {/* Friends Selection */}
      <div class="space-y-3">
        <label class="block text-white font-medium">
          Select Friends to Auto-save ({localSettings.selected_friends.length})
        </label>
        
        <Show when={availableFriends().length === 0}>
          <div class="bg-gray-800 rounded-lg p-4 text-center">
            <p class="text-gray-400 text-sm">
              No friends found. Make sure you're logged in and have loaded your feed.
            </p>
          </div>
        </Show>

        <Show when={availableFriends().length > 0}>
          <div class="max-h-64 overflow-y-auto space-y-2 bg-gray-800 rounded-lg p-3">
            <For each={availableFriends()}>
              {(friend) => (
                <label class="flex items-center gap-3 p-2 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={localSettings.selected_friends.includes(friend.id)}
                    onChange={() => handleToggleFriend(friend.id)}
                    class="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <Show when={friend.profilePicture}>
                    <img
                      src={friend.profilePicture}
                      alt={`${friend.username}'s profile`}
                      class="w-8 h-8 rounded-full"
                    />
                  </Show>
                  <Show when={!friend.profilePicture}>
                    <div class="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <span class="text-gray-300 text-xs font-medium">
                        {friend.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </Show>
                  <span class="text-white text-sm font-medium">{friend.username}</span>
                </label>
              )}
            </For>
          </div>
        </Show>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveSettings}
        disabled={!isFormValid() || isSaving()}
        class={`w-full py-3 rounded-lg font-medium transition-colors ${
          isFormValid() && !isSaving()
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-gray-700 text-gray-400 cursor-not-allowed"
        }`}
      >
        {isSaving() ? "Saving..." : "Save Settings"}
      </button>

      {/* Stats */}
      <Show when={localSettings.save_directory}>
        <div class="bg-gray-800 rounded-lg p-4">
          <h3 class="text-white font-medium mb-3">Quick Stats</h3>
          <div class="grid grid-cols-2 gap-4 text-center">
            <div>
              <p class="text-2xl font-bold text-blue-400">{localSettings.selected_friends.length}</p>
              <p class="text-gray-400 text-xs">Friends Selected</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-green-400">{berealLogger.store.savedPosts.length}</p>
              <p class="text-gray-400 text-xs">Posts Saved</p>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default BeRealLoggerSettings;