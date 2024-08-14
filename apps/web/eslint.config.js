import baseConfig, { restrictEnvAccess } from "@korino/eslint-config/base";
import nextjsConfig from "@korino/eslint-config/nextjs";
import reactConfig from "@korino/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];
