import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// The client lives in src/client and is built into dist/client, which the Hono
// server serves as static files in production. In dev, this Vite server proxies
// /api and /ws to the Hono server on :3000 so everything is same-origin.
export default defineConfig({
    root: "src/client",
    plugins: [tailwindcss()],
    build: {
        outDir: "../../dist/client",
        emptyOutDir: true,
        minify: false,
    },
    server: {
        host: true,
        port: 8000,
        proxy: {
            "/api": "http://localhost:3000",
            "/ws": {
                target: "ws://localhost:3000",
                ws: true,
            },
        },
    },
});
