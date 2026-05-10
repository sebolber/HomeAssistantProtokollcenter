import { defineConfig } from "vite";
import { resolve } from "node:path";

// HACS hat keinen Build-Step — wir committen den Build-Output unter
// custom_components/messagehub/frontend_dist/.
export default defineConfig({
  build: {
    // esnext verhindert, dass esbuild Optional-Chaining (`?.`) zu
    // `var t; (t = X) == null || t.method(...)` herabstuft. HA laeuft
    // ausschliesslich in modernen Browsern (Chrome 87+, Firefox 78+,
    // Safari 14+), die ES2020 nativ unterstuetzen — keine Notwendigkeit
    // fuer Lowering. Spart Bundle-Size und eliminiert Sonar-Findings
    // (var, comma operator, "consider moving declaration") im Bundle.
    target: "esnext",
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
