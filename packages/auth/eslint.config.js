import baseConfig, { restrictEnvAccess } from "@korino/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".apollo"],
  },
  ...baseConfig,
  ...restrictEnvAccess,
];
