import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

// Path to the sibling project containing offline map tiles
const tilesDir = path.resolve(__dirname, "../tiles/tiles");

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Custom plugin to serve tiles from the sibling directory
    {
      name: "serve-tiles",
      configureServer(server) {
        server.middlewares.use("/tiles", (req, res, _next) => {
          const filePath = path.join(tilesDir, req.url || "");
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes: Record<string, string> = {
              ".webp": "image/webp",
              ".png": "image/png",
              ".jpg": "image/jpeg",
              ".jpeg": "image/jpeg",
              ".json": "application/json",
            };
            res.setHeader(
              "Content-Type",
              mimeTypes[ext] || "application/octet-stream",
            );
            res.setHeader("Cache-Control", "public, max-age=31536000");
            fs.createReadStream(filePath).pipe(res);
          } else {
            res.statusCode = 404;
            res.end("Tile not found");
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    open: true,
    fs: {
      // Allow serving files from the parent directory (for tiles)
      allow: [path.resolve(__dirname, "..")],
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
