import { Component, For, Show } from "solid-js";
import theme, { type ThemeMode } from "~/stores/theme";
import MdiCheck from '~icons/mdi/check';
import MdiWeatherNight from '~icons/mdi/weather-night';
import MdiWeatherSunny from '~icons/mdi/weather-sunny';
import MdiMonitor from '~icons/mdi/monitor';

const ThemeSelector: Component = () => {
  const themeOptions: Array<{
    mode: ThemeMode;
    label: string;
    icon: Component;
    description: string;
  }> = [
    {
      mode: "system",
      label: "System",
      icon: MdiMonitor,
      description: "Follow system preference"
    },
    {
      mode: "light",
      label: "Light",
      icon: MdiWeatherSunny,
      description: "Light mode"
    },
    {
      mode: "dark",
      label: "Dark",
      icon: MdiWeatherNight,
      description: "Dark mode"
    }
  ];

  return (
    <div class="space-y-2">
      <For each={themeOptions}>
        {(option) => (
          <button
            type="button"
            onClick={() => theme.changeMode(option.mode)}
            class="flex items-center w-full px-4 py-3 rounded-lg transition-colors border dark:text-white light:text-black"
            classList={{
              "dark:bg-white/10 dark:hover:bg-white/20 light:bg-black/10 light:hover:bg-black/20 border-transparent": theme.mode() !== option.mode,
              "bg-blue-500/20 border-blue-500/50 text-white": theme.mode() === option.mode
            }}
          >
            <div class="flex items-center gap-4">
              <option.icon class="text-xl" />
              <div class="text-left">
                <p class="font-medium">{option.label}</p>
                <p class="text-sm opacity-60">{option.description}</p>
              </div>
            </div>
            <Show when={theme.mode() === option.mode}>
              <MdiCheck class="ml-auto text-xl text-blue-400" />
            </Show>
          </button>
        )}
      </For>
    </div>
  );
};

export default ThemeSelector;