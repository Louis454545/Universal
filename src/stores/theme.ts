import { createSignal, createEffect, onMount } from "solid-js";

/**
 * Available theme modes for the application
 * - "light": Force light theme
 * - "dark": Force dark theme  
 * - "system": Follow system preference
 */
export type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "stayreal-theme";

// Create reactive signals for theme state
const [themeMode, setThemeMode] = createSignal<ThemeMode>("system");
const [isDark, setIsDark] = createSignal(true);

/**
 * Get the system's preferred color scheme
 * @returns true if system prefers dark mode, false for light mode
 */
const getSystemPreference = (): boolean => {
  if (typeof window === "undefined") return true; // Default to dark
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

/**
 * Apply the theme to the document by adding/removing CSS classes and updating styles
 * @param dark - Whether to apply dark theme (true) or light theme (false)
 */
const applyTheme = (dark: boolean) => {
  if (typeof document === "undefined") return; // Only run in browser
  
  const root = document.documentElement;
  const body = document.body;
  
  if (dark) {
    root.classList.add("dark");
    root.classList.remove("light");
    if (body) {
      body.style.backgroundColor = "rgb(13, 14, 18)";
      body.style.color = "rgb(255, 255, 255)";
    }
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
    if (body) {
      body.style.backgroundColor = "rgb(255, 255, 255)";
      body.style.color = "rgb(0, 0, 0)";
    }
  }
};

/**
 * Update the current theme based on the selected mode
 * Determines if dark or light theme should be applied based on:
 * - "dark": Always dark
 * - "light": Always light  
 * - "system": Follow system preference
 */
const updateTheme = () => {
  const mode = themeMode();
  let shouldBeDark: boolean;

  switch (mode) {
    case "dark":
      shouldBeDark = true;
      break;
    case "light":
      shouldBeDark = false;
      break;
    case "system":
    default:
      shouldBeDark = getSystemPreference();
      break;
  }

  setIsDark(shouldBeDark);
  applyTheme(shouldBeDark);
};

/**
 * Initialize the theme system
 * - Loads saved theme preference from localStorage
 * - Sets up system theme change listener
 * - Applies initial theme
 * @returns Cleanup function to remove event listeners
 */
const initializeTheme = () => {
  // Only run in browser environment
  if (typeof window === "undefined") return;

  // Get saved theme from localStorage
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
  if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
    setThemeMode(savedTheme);
  }

  // Listen for system theme changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleSystemThemeChange = () => {
    if (themeMode() === "system") {
      updateTheme();
    }
  };

  mediaQuery.addEventListener("change", handleSystemThemeChange);

  // Initial theme update
  updateTheme();

  // Cleanup function
  return () => {
    mediaQuery.removeEventListener("change", handleSystemThemeChange);
  };
};

/**
 * Change the theme mode and persist the preference
 * @param mode - The new theme mode to apply
 */
const changeThemeMode = (mode: ThemeMode) => {
  setThemeMode(mode);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }
  updateTheme();
};

// Create effect to handle theme changes
createEffect(() => {
  updateTheme();
});

/**
 * Theme store providing reactive theme state and controls
 */
const theme = {
  /** Current theme mode (reactive signal) */
  mode: themeMode,
  /** Whether dark theme is currently active (reactive signal) */
  isDark,
  /** Change the theme mode */
  changeMode: changeThemeMode,
  /** Initialize the theme system */
  initialize: initializeTheme
};

export default theme;