import { Component, createSignal, Show } from "solid-js";
import berealLogger, { type SavedLocation } from "~/stores/bereal-logger";
import toast from "solid-toast";
import type { Post } from "~/api/requests/feeds/friends";

interface SaveButtonProps {
  post: Post;
  userId: string;
  username: string;
}

const SaveButton: Component<SaveButtonProps> = (props) => {
  const [isSaving, setIsSaving] = createSignal(false);
  const [isSaved, setIsSaved] = createSignal(false);

  const handleSavePost = async () => {
    setIsSaving(true);
    
    try {
      const location: SavedLocation | undefined = props.post.location 
        ? {
            latitude: props.post.location.latitude,
            longitude: props.post.location.longitude,
          }
        : undefined;

      await berealLogger.savePost(
        props.userId,
        props.username,
        props.post.momentId,
        props.post.primary.url,
        props.post.secondary.url,
        props.post.caption,
        props.post.takenAt,
        location
      );

      setIsSaved(true);
      toast.success(`Saved BeReal from @${props.username}!`);
      
      // Reset saved state after 3 seconds
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      toast.error("Failed to save BeReal");
      console.error("Failed to save BeReal:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      onClick={handleSavePost}
      disabled={isSaving() || isSaved()}
      class={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
        isSaved()
          ? "bg-green-500/20 text-green-400 border border-green-500/30"
          : isSaving()
          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 opacity-50"
          : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:text-white"
      }`}
    >
      <Show when={isSaving()}>
        <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      </Show>
      
      <Show when={!isSaving() && !isSaved()}>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      </Show>
      
      <Show when={isSaved()}>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </Show>
      
      <span>
        {isSaving() ? "Saving..." : isSaved() ? "Saved!" : "Save"}
      </span>
    </button>
  );
};

export default SaveButton;