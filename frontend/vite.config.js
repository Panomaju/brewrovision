import { defineConfig } from "vite";

/** @type { import("vite").UserConfig} */
const config = defineConfig({
    plugins: [],
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
