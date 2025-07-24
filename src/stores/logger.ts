import { createRoot } from "solid-js";
import { createStore } from "solid-js/store";
import { open } from "@tauri-apps/plugin-dialog";
import { writeBinaryFile, createDir, exists } from "@tauri-apps/api/fs";
import { join } from "@tauri-apps/api/path";
import { fetch as httpFetch } from "@tauri-apps/plugin-http";
import type { GetFeedsFriends, Post } from "~/api/requests/feeds/friends";

/**
 * LoggerState keeps track of the root save directory and the list of friend usernames that are being monitored.
 */
interface LoggerState {
  directory: string | null;
  friends: string[];
  enabled: boolean;
}

export type SavedPostInfo = {
  username: string;
  date: string;
  primaryPath: string;
  secondaryPath: string;
};

const STORAGE_KEY = "stayreal_logger_preferences";

export default createRoot(() => {
  const INITIAL: LoggerState = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as LoggerState;
    } catch {}
    return { directory: null, friends: [], enabled: false } as LoggerState;
  })();

  const [state, setState] = createStore<LoggerState>(INITIAL);

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */
  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  };

  const pickDirectory = async () => {
    const selected = await open({ directory: true });
    if (selected && typeof selected === "string") {
      setState("directory", selected);
      setState("enabled", true);
      persist();
    }
  };

  const toggleFriend = (username: string) => {
    setState("friends", list => {
      const idx = list.indexOf(username);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(username);
      return [...list];
    });
    persist();
  };

  const setEnabled = (flag: boolean) => {
    setState("enabled", flag);
    persist();
  };

  /* ------------------------------------------------------------------ */
  /* Automatic saving                                                   */
  /* ------------------------------------------------------------------ */
  const processFeed = async (feed: GetFeedsFriends | null) => {
    if (!state.enabled || !state.directory || !feed) return;

    const overviews = [feed.userPosts, ...(feed.friendsPosts ?? [])].filter(Boolean) as Exclude<GetFeedsFriends["userPosts"], null>[];

    for (const overview of overviews) {
      const username = overview.user.username;
      if (!state.friends.includes(username)) continue;

      // Each friend has at most one post per day (moment)
      const post = overview.posts?.[0];
      if (!post) continue;

      try {
        await downloadPost(username, post);
      } catch (e) {
        console.error("logger: failed to save post", e);
      }
    }
  };

  /**
   * Downloads both primary and secondary camera images of a post and saves them to disk.
   */
  const downloadPost = async (username: string, post: Post) => {
    if (!state.directory) return;

    const createdAt = post.creationDate ?? post.createdAt ?? post.postedAt;
    const date = new Date(createdAt).toISOString().split("T")[0];

    const rootDir = await join(state.directory, username, date);
    if (!(await exists(rootDir))) await createDir(rootDir, { recursive: true });

    // Helper to fetch and save
    const saveMedia = async (media: typeof post.primary, label: string) => {
      const url = media.url;
      const extensionMatch = url.split(".").pop()?.split("?")[0] || "jpg";
      const filePath = await join(rootDir, `${label}.${extensionMatch}`);
      if (await exists(filePath)) return; // already saved

      const response = await httpFetch(url, { method: "GET", responseType: "binary" });
      if (response.status !== 200) throw new Error(`HTTP ${response.status} when downloading image`);

      await writeBinaryFile({ path: filePath, contents: new Uint8Array(response.data as ArrayBuffer) });
      console.info(`BeReal Logger: saved ${filePath}`);
    };

    await Promise.all([
      saveMedia(post.primary, "primary"),
      saveMedia(post.secondary, "secondary"),
    ]);
  };

  /* ------------------------------------------------------------------ */
  /* Public API                                                         */
  /* ------------------------------------------------------------------ */
  const api = {
    state,
    pickDirectory,
    toggleFriend,
    setEnabled,
    processFeed,
  } as const;

  return api;
});