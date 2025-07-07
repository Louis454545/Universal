import { type Component, Show, createSignal } from "solid-js";
import MdiDownload from '~icons/mdi/download'
import MdiLoading from '~icons/mdi/loading'
import balance from "~/stores/balance";
import toast from "solid-toast";

interface BalanceDownloadButtonProps {
  userId: string;
  username: string;
  fullname: string;
  balanceData?: string; // This would come from the user's profile/balance API
}

const BalanceDownloadButton: Component<BalanceDownloadButtonProps> = (props) => {
  const [isDownloading, setIsDownloading] = createSignal(false);

  const handleDownload = async () => {
    if (!props.balanceData) {
      toast.error("No balance data available for this user");
      return;
    }

    if (!balance.isUserEnabled(props.userId)) {
      toast.error("Balance downloads not enabled for this user. Enable it in Settings > Balance Downloads.");
      return;
    }

    setIsDownloading(true);
    
    try {
      const filename = await balance.downloadUserBalance(
        props.userId,
        props.username,
        props.fullname,
        props.balanceData
      );
      
      toast.success(`Balance downloaded as ${filename}`);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download balance");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Show when={balance.isUserEnabled(props.userId) && props.balanceData}>
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading()}
        class="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg transition-colors"
        title="Download balance"
      >
        <Show when={isDownloading()} fallback={<MdiDownload />}>
          <MdiLoading class="animate-spin" />
        </Show>
        <span class="text-sm font-medium">
          {isDownloading() ? "Downloading..." : "Download Balance"}
        </span>
      </button>
    </Show>
  );
};

export default BalanceDownloadButton;