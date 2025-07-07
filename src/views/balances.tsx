import { Component, For, createResource } from "solid-js";
import { listBalances, downloadBalances } from "~/api/requests/balances";
import MdiChevronLeft from '~icons/mdi/chevron-left';
import MdiDownload from '~icons/mdi/download';
import { useNavigate } from "@solidjs/router";
import toast from "solid-toast";

const BalancesViewer: Component = () => {
  const navigate = useNavigate();
  const [files, { refetch }] = createResource(listBalances);

  const handleDownloadNow = async () => {
    await downloadBalances();
    toast.success("Balances downloaded");
    await refetch();
  };

  return (
    <>
      <header class="pt-[env(safe-area-inset-top)]">
        <nav class="flex items-center justify-between px-4 h-[72px]">
          <a href="/settings" class="p-2.5 rounded-full ml-[-10px]" aria-label="Back to settings">
            <MdiChevronLeft class="text-2xl" />
          </a>
          <button onClick={handleDownloadNow} class="p-2.5" title="Download now">
            <MdiDownload class="text-2xl" />
          </button>
        </nav>
      </header>

      <main class="p-4">
        <h1 class="text-xl font-bold mb-4">Recorded Balances</h1>
        <For each={files()} fallback={<p>No balances recorded yet.</p>}>
          {(file) => (
            <div class="px-4 py-3 bg-white/10 rounded-lg mb-2 break-all">{file}</div>
          )}
        </For>
      </main>
    </>
  );
};

export default BalancesViewer;