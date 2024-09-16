import prettier from "eslint-plugin-prettier";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...compat.extends("eslint:recommended", "prettier"),
  {
    plugins: {
      prettier,
    },

    languageOptions: {
      globals: {
        ARGV: "readonly",
        Debugger: "readonly",
        GIRepositoryGType: "readonly",
        globalThis: "readonly",
        imports: "readonly",
        Intl: "readonly",
        log: "readonly",
        logError: "readonly",
        print: "readonly",
        printerr: "readonly",
        window: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
      },

      ecmaVersion: "latest",
      sourceType: "module",
    },

    rules: {
      "prettier/prettier": "error",
    },
  },
];
