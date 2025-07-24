import { Component, createEffect, createSignal, For, Show } from "solid-js";
import logger, { SavedPostInfo } from "~/stores/logger";
import MdiFolderOpen from '~icons/mdi/folder-open';
import { readDir } from "@tauri-apps/api/fs";
import { convertFileSrc } from "@tauri-apps/api/tauri";

/**
 * Logger Viewer – lists all saved BeReal posts by friend and date.
 */
const LoggerViewer: Component = () => {
  const [posts, setPosts] = createSignal<SavedPostInfo[]>([]);

  const scanDirectory = async () => {
    if (!logger.state.directory) return;

    const result: SavedPostInfo[] = [];
    try {
      const friends = await readDir(logger.state.directory, { recursive: false });
      for (const friend of friends) {
        if (!friend.children) continue;
        for (const dateDir of friend.children) {
          if (!dateDir.children) continue;
          const primary = dateDir.children.find(c => c.name?.startsWith("primary"));
          const secondary = dateDir.children.find(c => c.name?.startsWith("secondary"));
          if (primary && secondary) {
            result.push({
              username: friend.name!,
              date: dateDir.name!,
              primaryPath: primary.path,
              secondaryPath: secondary.path,
            });
          }
        }
      }
    } catch (e) {
      console.error("logger viewer: scan failed", e);
    }
    // most recent first
    result.sort((a, b) => b.date.localeCompare(a.date));
    setPosts(result);
  };

  createEffect(() => {
    // Rescan when directory changes
    logger.state.directory;
    scanDirectory();
  });

  return (
    <div class="flex flex-col h-full p-4 gap-4">
      <header class="flex items-center gap-2">
        <h1 class="text-xl font-bold flex-1">Saved BeReal Posts</h1>
        <button onClick={logger.pickDirectory} class="p-2 bg-white/10 rounded"><MdiFolderOpen /></button>
      </header>

      <Show when={posts().length === 0}>
        <p class="text-center text-white/50 mt-8">No saved posts found.</p>
      </Show>

      <div class="overflow-y-auto flex flex-col gap-6 pb-8">
        <For each={posts()}>{(p) => (
          <div class="flex flex-col gap-2">
            <h2 class="font-medium">{p.username} – {p.date}</h2>
            <div class="flex gap-2">
              <img src={convertFileSrc(p.primaryPath)} class="w-40 rounded" />
              <img src={convertFileSrc(p.secondaryPath)} class="w-40 rounded" />
            </div>
          </div>
        )}</For>
      </div>
    </div>
  );
};

export default LoggerViewer;