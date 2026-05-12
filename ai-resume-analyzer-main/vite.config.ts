import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import type { Plugin } from "vite";

// Silently handle Chrome DevTools well-known URL to prevent noisy React Router errors
const suppressChromeDevToolsPlugin: Plugin = {
  name: "suppress-chrome-devtools-well-known",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.startsWith("/.well-known/appspecific/com.chrome.devtools")) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end("{}");
        return;
      }
      next();
    });
  },
};

export default defineConfig({
  plugins: [suppressChromeDevToolsPlugin, tailwindcss(), reactRouter(), tsconfigPaths()],
  ssr: {
    external: ["firebase-admin"],
    noExternal: [],
  },
  // Speeds up SSR module transforms (including virtual:react-router/server-build → root.tsx).
  css: {
    devSourcemap: false,
  },
  server: {
    proxy: {
      '/api/rag': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  }
});
