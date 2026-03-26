import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://nocookie.zentala.io",
  vite: {
    plugins: [tailwindcss()],
  },
});
