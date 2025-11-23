import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    base: "/wifi-proximity-app/", // <-- your REPO name here
    build: {
        outDir: "docs",
    },
});
