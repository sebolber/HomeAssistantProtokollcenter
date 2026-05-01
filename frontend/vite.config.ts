import { defineConfig } from "vite";
import { resolve } from "node:path";

// HACS hat keinen Build-Step — wir committen den Build-Output unter
// custom_components/messagehub/frontend_dist/.
export default defineConfig({
  build: {
    outDir: resolve(__dirname, "../custom_components/messagehub/frontend_dist"),
    emptyOutDir: true,
    sourcemap: false,
    lib: {
      entry: resolve(__dirname, "src/messagehub-panel.ts"),
      formats: ["es"],
      fileName: () => "messagehub-panel.js",
    },
    rollupOptions: {
      output: { entryFileNames: "messagehub-panel.js" },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
