import { type Component, createSignal, onMount, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import MdiChevronLeft from '~icons/mdi/chevron-left'
import MdiDownload from '~icons/mdi/download'
import MdiFolder from '~icons/mdi/folder'
import MdiAccountPlus from '~icons/mdi/account-plus'
import MdiCheck from '~icons/mdi/check'
import MdiClose from '~icons/mdi/close'
import balance from "~/stores/balance";
import ProfilePicture from "~/components/profile-picture";
import { open } from '@tauri-apps/plugin-dialog';
import toast from "solid-toast";

const BalanceSettingsView: Component = () => {
  const navigate = useNavigate();
  const [availableUsers] = createSignal([
    // Mock data for demo - in real app, this would come from your friends/connections API
    { id: "user1", username: "john_doe", fullname: "John Doe" },
    { id: "user2", username: "jane_smith", fullname: "Jane Smith" },
    { id: "user3", username: "mike_wilson", fullname: "Mike Wilson" },
  ]);

  onMount(async () => {
    await balance.loadSettings();
  });

  const handleFolderSelect = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Download Folder",
      });

      if (selected && typeof selected === 'string') {
        await balance.setDownloadFolder(selected);
        toast.success("Download folder updated!");
      }
    } catch (error) {
      console.error("Failed to select folder:", error);
      toast.error("Failed to select folder");
    }
  };

  const Entry: Component<{ title: string, subtitle?: string, icon: any, onClick?: () => void, rightContent?: any }> = (props) => (
    <button
      type="button"
      onClick={props.onClick}
      class="flex items-center w-full px-4 py-3 bg-white/10 rounded-lg"
      disabled={!props.onClick}
    >
      <div class="flex items-center gap-4 flex-1">
        {props.icon}
        <div class="flex flex-col items-start">
          <p class="font-medium">{props.title}</p>
          {props.subtitle && <p class="text-sm text-white/60">{props.subtitle}</p>}
        </div>
      </div>
      {props.rightContent}
    </button>
  );

  return (
    <>
      <header class="pt-[env(safe-area-inset-top)]">
        <nav class="flex items-center justify-between px-4 h-[72px]">
          <a href="/settings" class="p-2.5 rounded-full ml-[-10px]" aria-label="Back to settings">
            <MdiChevronLeft class="text-2xl" />
          </a>
        </nav>
      </header>

      <div class="p-4">
        <section class="flex flex-col gap-2">
          <h2 class="uppercase font-bold text-white/50 text-sm">Download Settings</h2>

          <Entry 
            title="Download Folder" 
            subtitle={balance.settings.download_folder || "Select folder"}
            icon={<MdiFolder />} 
            onClick={handleFolderSelect}
          />
        </section>

        <section class="flex flex-col gap-2">
          <h2 class="uppercase font-bold text-white/50 text-sm mt-6">Enabled Users</h2>
          <p class="text-sm text-white/60 mb-2">
            Select users whose balances you want to automatically download
          </p>

          <div class="flex flex-col gap-2">
            <For each={availableUsers()} fallback={
              <div class="text-center bg-[#1c1c1e] rounded-xl p-4">
                <p class="font-600 pb-2">No users available</p>
                <p>Connect with friends to enable balance downloads.</p>
              </div>
            }>
              {(user) => (
                <div class="flex items-center gap-4 p-3 bg-white/10 rounded-lg">
                  <div class="relative">
                    <ProfilePicture
                      fullName={user.fullname}
                      username={user.username}
                      media={null}
                      size={50}
                    />
                  </div>

                  <div class="flex flex-col flex-1">
                    <p class="font-medium">{user.fullname}</p>
                    <p class="text-sm text-white/60">{user.username}</p>
                  </div>

                  <button 
                    type="button" 
                    class="p-2 rounded-full"
                    onClick={() => balance.toggleUserEnabled(user.id)}
                  >
                    <Show when={balance.isUserEnabled(user.id)} fallback={
                      <div class="w-6 h-6 rounded-full border-2 border-white/30" />
                    }>
                      <div class="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <MdiCheck class="text-white text-sm" />
                      </div>
                    </Show>
                  </button>
                </div>
              )}
            </For>
          </div>
        </section>

        <section class="flex flex-col gap-2">
          <h2 class="uppercase font-bold text-white/50 text-sm mt-6">Quick Actions</h2>

          <Entry 
            title="View Download History" 
            icon={<MdiDownload />} 
            onClick={() => navigate("/settings/balance/history")}
            rightContent={<MdiChevronLeft class="text-xl text-white/50 rotate-180" />}
          />
        </section>

        <div class="mt-6 p-4 bg-white/5 rounded-lg">
          <p class="text-sm text-white/60">
            <strong>Note:</strong> Balance downloads will only work for users who have enabled this feature and 
            when their balance data is available. Files are saved in JSON format for easy viewing and analysis.
          </p>
        </div>
      </div>
    </>
  );
};

export default BalanceSettingsView;