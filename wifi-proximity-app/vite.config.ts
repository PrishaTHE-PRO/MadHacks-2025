import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    base: "/", // <-- your REPO name here
    build: {
        outDir: "docs",
    },
});
