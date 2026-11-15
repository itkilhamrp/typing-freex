import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginSvelte from "eslint-plugin-svelte";
import boundaries from "eslint-plugin-boundaries";
import svelteParser from "svelte-eslint-parser";
import globals from "globals";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginSvelte.configs["flat/recommended"],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.svelte.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        sourceType: "module",
      },
    },
  },
  {
    files: ["*.svelte", "**/*.svelte"],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
        sourceType: "module",
        extraFileExtensions: [".svelte"],
      },
    },
  },
  {
    plugins: {
      boundaries,
    },
    settings: {
      "boundaries/elements": [
        { type: "core", pattern: "src/core/**/*" },
        { type: "lib", pattern: "src/lib/**/*" },
        { type: "routes", pattern: "src/routes/**/*" },
      ],
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              from: { element: { type: "core" } },
              allow: [{ to: { element: { type: "core" } } }],
            },
            {
              from: { element: { type: "lib" } },
              allow: [
                { to: { element: { type: "core" } } },
                { to: { element: { type: "lib" } } },
              ],
            },
            {
              from: { element: { type: "routes" } },
              allow: [
                { to: { element: { type: "core" } } },
                { to: { element: { type: "lib" } } },
                { to: { element: { type: "routes" } } },
              ],
            },
          ],
        },
      ],
      "no-control-regex": "off",
      "svelte/no-at-html-tags": "warn",
      "svelte/no-navigation-without-resolve": "off",
    },
  },
  {
    ignores: [
      ".svelte-kit/**",
      "dist/**",
      "node_modules/**",
      "src-tauri/**",
      "coverage/**",
      "*.config.*",
      "scripts/**",
      "static/**",
      "public/**",
    ],
  }
);
