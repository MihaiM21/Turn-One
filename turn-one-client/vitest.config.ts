import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
    // Prevent Vite from picking up the app's postcss.config.mjs (string-form plugin list, valid for
    // Next's own PostCSS loader but not Vite's) — tests don't import CSS, so an empty config is fine.
    css: {
        postcss: {
            plugins: [],
        },
    },
    resolve: {
        alias: {
            "@": fileURLToPath(new URL(".", import.meta.url)),
        },
    },
    test: {
        environment: "node",
        include: ["**/__tests__/**/*.test.ts", "**/*.test.ts"],
        exclude: ["**/node_modules/**", "**/.next/**"],
        coverage: {
            provider: "v8",
        },
    },
});
