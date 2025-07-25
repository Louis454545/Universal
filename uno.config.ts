import { defineConfig, presetWind3, transformerVariantGroup } from "unocss";
import corvu from "@corvu/unocss";
import { presetKobalte } from 'unocss-preset-primitives'

export default defineConfig({
  // @ts-expect-error
  presets: [presetWind3(), corvu(), presetKobalte({ prefix: "kobalte" })],
  transformers: [transformerVariantGroup()],
  theme: {
    colors: {
      primary: {
        50: 'rgb(var(--color-primary-50) / <alpha-value>)',
        100: 'rgb(var(--color-primary-100) / <alpha-value>)',
        200: 'rgb(var(--color-primary-200) / <alpha-value>)',
        300: 'rgb(var(--color-primary-300) / <alpha-value>)',
        400: 'rgb(var(--color-primary-400) / <alpha-value>)',
        500: 'rgb(var(--color-primary-500) / <alpha-value>)',
        600: 'rgb(var(--color-primary-600) / <alpha-value>)',
        700: 'rgb(var(--color-primary-700) / <alpha-value>)',
        800: 'rgb(var(--color-primary-800) / <alpha-value>)',
        900: 'rgb(var(--color-primary-900) / <alpha-value>)',
      },
      background: 'rgb(var(--color-background) / <alpha-value>)',
      surface: 'rgb(var(--color-surface) / <alpha-value>)',
      'surface-variant': 'rgb(var(--color-surface-variant) / <alpha-value>)',
      'on-background': 'rgb(var(--color-on-background) / <alpha-value>)',
      'on-surface': 'rgb(var(--color-on-surface) / <alpha-value>)',
      'on-surface-variant': 'rgb(var(--color-on-surface-variant) / <alpha-value>)',
    }
  }
});
