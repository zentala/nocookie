import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "NoCookieCMP",
      formats: ["es", "umd"],
      fileName: (format) => {
        if (format === "es") return "nocookie-cmp.esm.js";
        return "nocookie-cmp.umd.cjs";
      },
    },
    cssFileName: "nocookie-cmp",
    rollupOptions: {
      output: {
        exports: "named",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "nocookie-cmp.css";
          }
          return assetInfo.name ?? "asset";
        },
      },
    },
  },
});
