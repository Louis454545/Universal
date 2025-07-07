import { Component, For, createSignal, onMount, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { open } from "@tauri-apps/plugin-dialog";
import { getBalancesSettings, setBalancesSettings, BalancesSettings } from "~/api/requests/balances";
import MdiChevronLeft from '~icons/mdi/chevron-left';
import MdiFolder from '~icons/mdi/folder';
import MdiContentSave from '~icons/mdi/content-save';
import MdiPlus from '~icons/mdi/plus';

const BalancesSettingsPage: Component = () => {
  const navigate = useNavigate();

  const [folderPath, setFolderPath] = createSignal<string>("");
  const [peopleInput, setPeopleInput] = createSignal<string>("");
  const [people, setPeople] = createSignal<string[]>([]);

  onMount(async () => {
    const settings = await getBalancesSettings();
    setFolderPath(settings.folder);
    setPeople([...settings.peopleIds]);
  });

  const save = async () => {
    const settings: BalancesSettings = {
      folder: folderPath(),
      peopleIds: [...people()]
    };
    await setBalancesSettings(settings);
    navigate("/settings");
  };

  return (
    <>
      <header class="pt-[env(safe-area-inset-top)]">
        <nav class="flex items-center justify-between px-4 h-[72px]">
          <a href="/settings" class="p-2.5 rounded-full ml-[-10px]" aria-label="Back to settings">
            <MdiChevronLeft class="text-2xl" />
          </a>

          <button onClick={save} class="p-2.5" title="Save settings">
            <MdiContentSave class="text-2xl" />
          </button>
        </nav>
      </header>

      <main class="p-4 space-y-6">
        <section class="space-y-3">
          <h2 class="uppercase font-bold text-white/50 text-sm">Download Folder</h2>
          <p class="text-sm">Current folder: <span class="text-white/70 break-all">{folderPath() || "Not set"}</span></p>
          <button class="flex items-center gap-2 px-4 py-3 rounded-lg bg-white/10" onClick={async () => {
            const selected = await open({ directory: true });
            if (selected && typeof selected === "string") {
              setFolderPath(selected);
            }
          }}>
            <MdiFolder class="text-xl" />
            <span>Choose Folder</span>
          </button>
        </section>

        <section class="space-y-3">
          <h2 class="uppercase font-bold text-white/50 text-sm">People IDs/Usernames</h2>
          <div class="flex gap-2">
            <input
              class="flex-1 px-3 py-2 bg-white/10 rounded-lg focus:outline-none"
              placeholder="Enter username or id"
              value={peopleInput()}
              onInput={(e) => setPeopleInput(e.currentTarget.value)}
            />
            <button class="px-4 bg-white/20 rounded-lg" onClick={() => {
              const value = peopleInput().trim();
              if (value && !people().includes(value)) {
                setPeople([...people(), value]);
              }
              setPeopleInput("");
            }}>
              <MdiPlus />
            </button>
          </div>
          <ul class="space-y-1">
            <For each={people()}>{(person) => (
              <li class="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg">
                <span>{person}</span>
                <button class="text-red" onClick={() => setPeople(people().filter(p => p !== person))}>Remove</button>
              </li>
            )}</For>
          </ul>
        </section>
      </main>
    </>
  );
};

export default BalancesSettingsPage;