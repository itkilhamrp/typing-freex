import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "node:path";

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    conditions: ['browser'],
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "#lib": path.resolve(import.meta.dirname, "./src/lib"),
      "$lib": path.resolve(import.meta.dirname, "./src/lib"),
      "$core": path.resolve(import.meta.dirname, "./src/core"),
      "$app": path.resolve(import.meta.dirname, "./tests/mocks/app"),
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./tests/setup-audio.ts"],
    server: {
      deps: {
        inline: ["@skeletonlabs/skeleton-svelte", "phosphor-svelte"],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/core/**"],
      exclude: ["src/core/**/index.ts", "src/core/**/types.ts", "src/core/ipc/**"],
      thresholds: {
        lines: 85,
        functions: 85,
        statements: 85,
      },
    },
  },
});
