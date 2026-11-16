/// <reference types="vitest/config" />
import path from "node:path";
import { fileURLToPath } from "node:url";
import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import rehypeKatex from "rehype-katex";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { buildContentIndex } from "./scripts/content-index.ts";

const root = path.dirname(fileURLToPath(import.meta.url));
// GitHub Pages serves the app under /hyperscale/; local dev and tests use /.
const base = process.env.HS_BASE ?? "/";

/** Serves the validated content index as `virtual:hyperscale/content` and reloads it on edits. */
function contentIndexPlugin(): Plugin {
  const id = "virtual:hyperscale/content";
  const resolved = "\0" + id;
  return {
    name: "hyperscale-content-index",
    resolveId(source) {
      return source === id ? resolved : undefined;
    },
    load(source) {
      if (source !== resolved) return undefined;
      const { index, errors } = buildContentIndex(root);
      if (errors.length) this.warn(`content has ${errors.length} error(s); run \`npm run validate\`:\n${errors.join("\n")}`);
      return `export default ${JSON.stringify(index)};`;
    },
    configureServer(server) {
      const refresh = (file: string) => {
        if (!file.includes(`${path.sep}content${path.sep}`) && !file.endsWith("curriculum.json")) return;
        const mod = server.moduleGraph.getModuleById(resolved);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: "full-reload" });
        }
      };
      server.watcher.on("add", refresh);
      server.watcher.on("change", refresh);
      server.watcher.on("unlink", refresh);
    },
  };
}

export default defineConfig({
  base,
  plugins: [
    contentIndexPlugin(),
    {
      enforce: "pre",
      ...mdx({
        providerImportSource: "@mdx-js/react",
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm, remarkMath],
        rehypePlugins: [rehypeKatex],
      }),
    },
    react({ include: /\.(mdx|tsx|ts|jsx|js)$/ }),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["icons/*.svg", "icons/*.png"],
      manifest: {
        name: "Hyperscale",
        short_name: "Hyperscale",
        description: "A personal course in machine learning engineering, set in a hyperscale data center.",
        theme_color: "#0b1016",
        background_color: "#0b1016",
        display: "standalone",
        start_url: base,
        scope: base,
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "icons/icon.svg", sizes: "any", type: "image/svg+xml" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,json,parquet}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            // Pyodide runtime and wheels (pinned version, so cache-first is safe)
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/pyodide\//,
            handler: "CacheFirst",
            options: { cacheName: "pyodide-v314.0.7", expiration: { maxEntries: 400 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(root, "src") },
  },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    css: false,
  },
});
