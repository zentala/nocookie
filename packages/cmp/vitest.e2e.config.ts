import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    globals: false,
    environment: "jsdom",
    include: ["e2e/**/*.test.ts"],
    setupFiles: ["e2e/setup.ts"],
  },
});
