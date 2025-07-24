import { Component, createSignal, Show } from "solid-js";
import BeRealLoggerSettings from "~/components/bereal-logger/settings";
import BeRealLoggerViewer from "~/components/bereal-logger/viewer";

type Tab = 'settings' | 'viewer';

const BeRealLoggerView: Component = () => {
  const [activeTab, setActiveTab] = createSignal<Tab>('settings');

  return (
    <div class="min-h-screen bg-black text-white">
      {/* Header with Tabs */}
      <div class="sticky top-0 z-10 bg-black border-b border-gray-800">
        <div class="flex">
          <button
            onClick={() => setActiveTab('settings')}
            class={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab() === 'settings'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                : 'text-gray-400 hover:text-white hover:bg-gray-900'
            }`}
          >
            ⚙️ Settings
          </button>
          <button
            onClick={() => setActiveTab('viewer')}
            class={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab() === 'viewer'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                : 'text-gray-400 hover:text-white hover:bg-gray-900'
            }`}
          >
            📸 Saved Posts
          </button>
        </div>
      </div>

      {/* Content */}
      <div class="w-full max-w-lg mx-auto">
        <Show when={activeTab() === 'settings'}>
          <BeRealLoggerSettings />
        </Show>
        
        <Show when={activeTab() === 'viewer'}>
          <BeRealLoggerViewer />
        </Show>
      </div>
    </div>
  );
};

export default BeRealLoggerView;