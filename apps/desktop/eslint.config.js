import baseConfig from "@korino/eslint-config/base";
import reactConfig from "@korino/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["src-tauri/target/**/*"],
  },
  ...baseConfig,
  ...reactConfig,
];
