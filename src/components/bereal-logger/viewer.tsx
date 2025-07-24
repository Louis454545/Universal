import { Component, createSignal, createEffect, For, Show, createMemo } from "solid-js";
import berealLogger, { type SavedBeRealPost } from "~/stores/bereal-logger";
import toast from "solid-toast";
import { convertFileSrc } from "@tauri-apps/api/core";

interface GroupedPosts {
  [date: string]: {
    [username: string]: SavedBeRealPost[];
  };
}

const BeRealLoggerViewer: Component = () => {
  const [selectedPost, setSelectedPost] = createSignal<SavedBeRealPost | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = createSignal(false);
  const [currentImageType, setCurrentImageType] = createSignal<'primary' | 'secondary'>('primary');
  const [searchFilter, setSearchFilter] = createSignal("");
  const [sortBy, setSortBy] = createSignal<'date' | 'username'>('date');

  createEffect(() => {
    berealLogger.loadSavedPosts();
  });

  const filteredPosts = createMemo(() => {
    const posts = berealLogger.store.savedPosts;
    if (!searchFilter()) return posts;
    
    return posts.filter(post => 
      post.username.toLowerCase().includes(searchFilter().toLowerCase()) ||
      (post.caption && post.caption.toLowerCase().includes(searchFilter().toLowerCase()))
    );
  });

  const groupedPosts = createMemo((): GroupedPosts => {
    const posts = filteredPosts();
    const grouped: GroupedPosts = {};
    
    posts.forEach(post => {
      const date = new Date(post.saved_at).toLocaleDateString();
      if (!grouped[date]) grouped[date] = {};
      if (!grouped[date][post.username]) grouped[date][post.username] = [];
      grouped[date][post.username].push(post);
    });
    
    return grouped;
  });

  const sortedDates = createMemo(() => {
    const dates = Object.keys(groupedPosts());
    return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  });

  const handleImageClick = (post: SavedBeRealPost, imageType: 'primary' | 'secondary') => {
    setSelectedPost(post);
    setCurrentImageType(imageType);
    setIsImageModalOpen(true);
  };

  const handleDeletePost = async (post: SavedBeRealPost) => {
    if (confirm(`Are you sure you want to delete this BeReal from ${post.username}?`)) {
      try {
        await berealLogger.deletePost(post.id);
        toast.success("Post deleted successfully");
      } catch (error) {
        toast.error("Failed to delete post");
      }
    }
  };

  const getImageSrc = (imagePath: string) => {
    return convertFileSrc(imagePath);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div class="p-4 space-y-6 min-h-screen bg-black">
      {/* Header */}
      <div class="text-center">
        <h2 class="text-2xl font-bold text-white mb-2">Saved BeReals</h2>
        <p class="text-gray-400 text-sm">
          Browse your saved BeReal posts organized by date and person
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div class="space-y-3">
        <div class="flex gap-3">
          <input
            type="text"
            placeholder="Search by username or caption..."
            value={searchFilter()}
            onInput={(e) => setSearchFilter(e.currentTarget.value)}
            class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
          <select
            value={sortBy()}
            onChange={(e) => setSortBy(e.currentTarget.value as 'date' | 'username')}
            class="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="date">Sort by Date</option>
            <option value="username">Sort by Username</option>
          </select>
        </div>
        
        <div class="text-center">
          <p class="text-gray-400 text-sm">
            {filteredPosts().length} posts saved
          </p>
        </div>
      </div>

      {/* Error Display */}
      <Show when={berealLogger.store.error}>
        <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p class="text-red-400 text-sm">{berealLogger.store.error}</p>
        </div>
      </Show>

      {/* Loading State */}
      <Show when={berealLogger.store.isLoading}>
        <div class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p class="text-gray-400">Loading saved posts...</p>
        </div>
      </Show>

      {/* Empty State */}
      <Show when={!berealLogger.store.isLoading && filteredPosts().length === 0}>
        <div class="text-center py-12">
          <div class="text-6xl mb-4">📸</div>
          <h3 class="text-xl font-bold text-white mb-2">No saved posts yet</h3>
          <p class="text-gray-400 mb-4">
            Configure your BeReal Logger settings to start saving posts automatically
          </p>
        </div>
      </Show>

      {/* Posts Grid */}
      <Show when={!berealLogger.store.isLoading && filteredPosts().length > 0}>
        <div class="space-y-8">
          <For each={sortedDates()}>
            {(date) => (
              <div class="space-y-4">
                {/* Date Header */}
                <h3 class="text-lg font-bold text-white sticky top-0 bg-black py-2">
                  {formatDate(date)}
                </h3>
                
                {/* Posts for this date */}
                <For each={Object.entries(groupedPosts()[date])}>
                  {([username, posts]) => (
                    <div class="space-y-3">
                      {/* Username Header */}
                      <h4 class="text-md font-semibold text-blue-400 pl-2">
                        @{username} ({posts.length} post{posts.length !== 1 ? 's' : ''})
                      </h4>
                      
                      {/* Posts Grid for this user */}
                      <div class="grid grid-cols-1 gap-4">
                        <For each={posts}>
                          {(post) => (
                            <div class="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-colors">
                              {/* Post Header */}
                              <div class="p-3 border-b border-gray-800 flex justify-between items-center">
                                <div>
                                  <p class="text-white font-medium">@{post.username}</p>
                                  <p class="text-gray-400 text-xs">
                                    Saved on {formatTime(post.saved_at)}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleDeletePost(post)}
                                  class="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                              
                              {/* Images */}
                              <div class="grid grid-cols-2 gap-1">
                                {/* Primary Image */}
                                <div class="relative aspect-square">
                                  <img
                                    src={getImageSrc(post.primary_image_path)}
                                    alt="Primary camera"
                                    class="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => handleImageClick(post, 'primary')}
                                  />
                                  <div class="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                    Primary
                                  </div>
                                </div>
                                
                                {/* Secondary Image */}
                                <div class="relative aspect-square">
                                  <img
                                    src={getImageSrc(post.secondary_image_path)}
                                    alt="Secondary camera"
                                    class="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => handleImageClick(post, 'secondary')}
                                  />
                                  <div class="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                    Secondary
                                  </div>
                                </div>
                              </div>
                              
                              {/* Caption */}
                              <Show when={post.caption}>
                                <div class="p-3 border-t border-gray-800">
                                  <p class="text-gray-300 text-sm">{post.caption}</p>
                                </div>
                              </Show>
                              
                              {/* Location */}
                              <Show when={post.location}>
                                <div class="px-3 pb-3">
                                  <p class="text-gray-400 text-xs">
                                    📍 {post.location!.latitude.toFixed(4)}, {post.location!.longitude.toFixed(4)}
                                  </p>
                                </div>
                              </Show>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Image Modal */}
      <Show when={isImageModalOpen() && selectedPost()}>
        <div 
          class="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div class="relative max-w-lg w-full">
            <button
              onClick={() => setIsImageModalOpen(false)}
              class="absolute -top-12 right-0 text-white hover:text-gray-300 text-2xl"
            >
              ✕
            </button>
            
            <div class="bg-gray-900 rounded-xl overflow-hidden">
              <div class="p-4 border-b border-gray-700">
                <h3 class="text-white font-bold">
                  @{selectedPost()!.username} - {currentImageType() === 'primary' ? 'Primary' : 'Secondary'} Camera
                </h3>
                <p class="text-gray-400 text-sm">
                  {formatDate(selectedPost()!.saved_at)} at {formatTime(selectedPost()!.saved_at)}
                </p>
              </div>
              
              <img
                src={getImageSrc(
                  currentImageType() === 'primary' 
                    ? selectedPost()!.primary_image_path 
                    : selectedPost()!.secondary_image_path
                )}
                alt={`${currentImageType()} camera view`}
                class="w-full max-h-[70vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              
              <div class="p-4 flex gap-2">
                <button
                  onClick={() => setCurrentImageType('primary')}
                  class={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    currentImageType() === 'primary'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Primary
                </button>
                <button
                  onClick={() => setCurrentImageType('secondary')}
                  class={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    currentImageType() === 'secondary'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Secondary
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default BeRealLoggerViewer;