import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Served from berryde.com/projects/satellites by its own Worker. Assets live at
// the same path inside dist/, because Workers serve static assets by file path.
const BASE = "/projects/satellites/";

export default defineConfig({
	base: BASE,
	plugins: [react(), tailwindcss()],
	build: { outDir: `dist${BASE}`, emptyOutDir: true },
});
