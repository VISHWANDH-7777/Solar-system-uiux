import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import path from "path";
import documentRoutes from "./src/server/routes/document.routes";
import uploadRoutes from "./src/server/routes/upload.routes";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 5000;

  console.log(`[${new Date().toISOString()}] Initializing LegalOrbit Server...`);

  // 1. Global Middleware
  app.use(express.json());

  // 2. Request Logging Middleware (Step 7)
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Request hit: ${req.url}`);
    console.log(`[${new Date().toISOString()}] Incoming request: ${req.method} ${req.url}`);
    next();
  });

  // Allow frontend app to call API from a different dev origin when needed.
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }
    next();
  });

  // 3. API Routes (Mounted BEFORE Vite)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Mount modular routes
  app.use("/api/document", documentRoutes);
  app.use("/api", uploadRoutes);

  // 4. API 404 Handler (Step 2)
  app.all("/api/*", (req, res) => {
    console.warn(`[${new Date().toISOString()}] 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: "Route Not Found",
      method: req.method,
      path: req.url
    });
  });

  // 5. Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[${new Date().toISOString()}] Server Error:`, err);
    res.status(err.status || 500).json({ 
      error: err.message || "Internal Server Error" 
    });
  });

  // 6. Vite Middleware (Development only)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[${new Date().toISOString()}] Server running on http://localhost:${PORT}`);
  });
}

startServer();
