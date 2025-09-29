import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

/** @type { import("vite").UserConfig} */
const config = defineConfig({
    plugins: [tailwindcss()],
    build: {
        minify: false,
        rollupOptions: {},
    },
    server: {
        host: true,
        port: 8000,
        watch: {
            usePolling: true,
        },
    },
});

export default config;
