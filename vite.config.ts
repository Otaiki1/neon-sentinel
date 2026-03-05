import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { createRequire } from "module";

const require = createRequire(import.meta.url);


export default defineConfig({
    plugins: [
        react(),
        mkcert({ hosts: ["localhost", "127.0.0.1"] }),
        wasm(),
        topLevelAwait(),
        nodePolyfills(),
    ],
    resolve: {
        alias: {
            eventemitter3: require.resolve("eventemitter3"),
        },
    },

    server: {
        allowedHosts: ["a6578d494569.ngrok-free.app"],
        https: {},
    },
    build: {
        target: "esnext",
        commonjsOptions: {
            include: [/eventemitter3/, /node_modules/],
            transformMixedEsModules: true,
        },
    },
    optimizeDeps: {
        exclude: ["@cartridge/connector", "@cartridge/controller"],
        include: ["eventemitter3", "phaser"],
        needsInterop: ["eventemitter3"],
    },


    define: {
        "process.env": {},
        global: "globalThis",
    },
});


