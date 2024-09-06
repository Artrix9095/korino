import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

import VidstackTailwindConfig from "@korino/media-player/tailwind";
import baseConfig from "@korino/tailwind-config/web";

export default {
  // We need to append the path to the UI package to the content array so that
  // those classes are included correctly.
  content: [
    ...baseConfig.content,
    "../../packages/ui/**/*.{ts,tsx}",
    "../../packages/media-player/**/*.{ts,tsx}",
  ],
  presets: [baseConfig],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        mono: [...fontFamily.mono],
      },
    },
  },
  plugins: [VidstackTailwindConfig],
} satisfies Config;
