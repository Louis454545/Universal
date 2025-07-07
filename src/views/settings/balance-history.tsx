import { type Component, onMount, For, Show } from "solid-js";
import MdiChevronLeft from '~icons/mdi/chevron-left'
import MdiFile from '~icons/mdi/file'
import MdiDownload from '~icons/mdi/download'
import MdiOpenInNew from '~icons/mdi/open-in-new'
import balance from "~/stores/balance";
import ProfilePicture from "~/components/profile-picture";
import { openUrl } from "@tauri-apps/plugin-opener";
import toast from "solid-toast";

const BalanceHistoryView: Component = () => {
  onMount(async () => {
    await balance.loadHistory();
  });

  const openFile = async (filePath?: string) => {
    if (!filePath) {
      toast.error("File path not available");
      return;
    }

    try {
      await openUrl(`file://${filePath}`);
    } catch (error) {
      console.error("Failed to open file:", error);
      toast.error("Failed to open file");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <header class="pt-[env(safe-area-inset-top)]">
        <nav class="flex items-center justify-between px-4 h-[72px]">
          <a href="/settings/balance" class="p-2.5 rounded-full ml-[-10px]" aria-label="Back to balance settings">
            <MdiChevronLeft class="text-2xl" />
          </a>
        </nav>
      </header>

      <section class="px-4">
        <h2 class="text-sm text-white/60 uppercase font-600 mb-4">
          Download History ({balance.history.entries.length})
        </h2>

        <Show when={balance.history.loading}>
          <div class="text-center bg-[#1c1c1e] rounded-xl p-4">
            <p>Loading download history...</p>
          </div>
        </Show>

        <div class="flex flex-col gap-2">
          <For each={balance.history.entries} fallback={
            <div class="text-center bg-[#1c1c1e] rounded-xl p-4">
              <p class="font-600 pb-2">No downloads yet</p>
              <p>Balance downloads will appear here once you start downloading.</p>
            </div>
          }>
            {(entry) => (
              <div class="flex items-center gap-4 p-4 bg-white/10 rounded-lg">
                <div class="relative">
                  <ProfilePicture
                    fullName={entry.fullname}
                    username={entry.username}
                    media={null}
                    size={50}
                  />
                </div>

                <div class="flex flex-col flex-1">
                  <p class="font-medium">{entry.fullname}</p>
                  <p class="text-sm text-white/60">{entry.username}</p>
                  <p class="text-xs text-white/50">
                    Downloaded on {formatDate(entry.downloaded_at)}
                  </p>
                </div>

                <div class="flex flex-col gap-2">
                  <Show when={entry.file_path}>
                    <button 
                      type="button" 
                      class="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                      onClick={() => openFile(entry.file_path)}
                      title="Open file"
                    >
                      <MdiOpenInNew class="text-white/80" />
                    </button>
                  </Show>
                  
                  <button 
                    type="button" 
                    class="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    onClick={async () => {
                      try {
                        // In a real app, you might want to re-download or show details
                        await balance.downloadUserBalance(
                          entry.user_id, 
                          entry.username, 
                          entry.fullname, 
                          entry.balance_data
                        );
                        toast.success("Balance re-downloaded!");
                      } catch (error) {
                        toast.error("Failed to download balance");
                      }
                    }}
                    title="Download again"
                  >
                    <MdiDownload class="text-white/60" />
                  </button>
                </div>
              </div>
            )}
          </For>
        </div>

        <Show when={balance.history.entries.length > 0}>
          <div class="mt-6 p-4 bg-white/5 rounded-lg">
            <h3 class="font-medium mb-2">About Balance Files</h3>
            <ul class="text-sm text-white/60 space-y-1">
              <li>• Files are saved in JSON format for easy viewing</li>
              <li>• Each file contains user info and balance data</li>
              <li>• Files are automatically organized by date and username</li>
              <li>• Click the open icon to view files in your default JSON viewer</li>
            </ul>
          </div>
        </Show>
      </section>
    </>
  );
};

export default BalanceHistoryView;