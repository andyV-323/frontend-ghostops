import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					// Core React runtime — tiny, cached aggressively
					"vendor-react": ["react", "react-dom"],
					// Routing
					"vendor-router": ["react-router-dom"],
					// Auth
					"vendor-auth": ["react-oidc-context", "oidc-client-ts"],
					// UI / icons — large, changes rarely
					"vendor-ui": [
						"@fortawesome/react-fontawesome",
						"@fortawesome/free-solid-svg-icons",
						"@fortawesome/free-brands-svg-icons",
					],
					// State / data fetching
					"vendor-state": ["zustand", "axios"],
				},
			},
		},
	},
});
