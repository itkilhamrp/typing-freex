import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin, type ServerOptions } from "vite";
import path from "node:path";
import process from "node:process";

/**
 * Guard plugin: prevents @tailwindcss/vite (enforce:"pre") from crashing
 * when vite-plugin-svelte's virtual CSS module load returns unprocessed
 * script content during cold-start race conditions.
 *
 * Both this plugin and @tailwindcss/vite use enforce:"pre", but this
 * plugin appears first in the array so Vite calls its transform first.
 */
function svelteStyleGuard(): Plugin {
  return {
    name: "svelte-style-guard",
    enforce: "pre",
    transform(code, id) {
      if (!id.includes("?svelte&type=style&lang.css")) return;
      const trimmed = code.trimStart();
      if (
        trimmed.startsWith("import ") ||
        trimmed.startsWith("import{") ||
        trimmed.startsWith("export ") ||
        trimmed.startsWith("export{")
      ) {
        return { code: "/* svelte css pending */", map: null };
      }
    },
  };
}

const host = process.env.TAURI_DEV_HOST;
const isDebug = process.env.DEBUG === "true";

const serverConfig: ServerOptions = {
  port: 1420,
  strictPort: true,
  host: host || false,
  fs: {
    allow: [path.resolve(import.meta.dirname)],
  },
  watch: {
    ignored: ["**/src-tauri/**"],
  },
};

if (host) {
  serverConfig.hmr = {
    protocol: "ws",
    host,
    port: 1421,
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelteStyleGuard(),
    sveltekit({
      adapter: adapter({
        pages: "dist",
        assets: "dist",
        fallback: "index.html",
        precompress: false,
        strict: false,
      }),
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "$core": path.resolve(import.meta.dirname, "./src/core"),
    },
  },
  clearScreen: false,
  server: serverConfig,
  build: {
    sourcemap: false,
    minify: "terser", // Menggunakan Terser untuk kompresi JS yang lebih agresif dibanding esbuild
    terserOptions: {
      compress: {
        drop_console: !isDebug, // Menghapus console.log otomatis pada mode release
        drop_debugger: !isDebug, // Menghapus debugger otomatis
        pure_funcs: !isDebug ? ["console.info", "console.error", "console.warn"] : [],
      },
      mangle: true, // Menyamarkan nama variabel & fungsi agar kode menjadi sangat pendek
    },
    cssMinify: "lightningcss", // Menggunakan Lightning CSS yang sangat cepat dan maksimal mengecilkan CSS Tailwind
    reportCompressedSize: false, // Mempercepat proses build dengan tidak menghitung ulang ukuran gzip di terminal
    chunkSizeWarningLimit: 500,
  },
});


