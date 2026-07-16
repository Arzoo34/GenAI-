// vite.config.ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    tanstackStart({
      server: {
        entry: "server"
      }
    })
  ]
});
export {
  vite_config_default as default
};
