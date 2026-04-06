const express = require("express");
const multer = require("multer");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { PDFParse } = require("pdf-parse");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const allowedTypes = new Set(["application/pdf", "text/plain"]);

app.use((req, res, next) => {
  logger.info(`Request hit: ${req.url}`);
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

app.get("/api/health", (req, res) => {
  return res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!allowedTypes.has(req.file.mimetype)) {
      return res.status(400).json({ error: "Invalid file type. Only .pdf and .txt are allowed." });
    }

    let text = "";
    if (req.file.mimetype === "application/pdf") {
      const parser = new PDFParse({ data: req.file.buffer });
      try {
        const data = await parser.getText();
        text = data.text;
      } finally {
        await parser.destroy();
      }
    } else {
      text = req.file.buffer.toString("utf-8");
    }

    return res.json({
      success: true,
      message: "File uploaded and parsed successfully",
      filename: req.file.originalname,
      text,
    });
  } catch (error) {
    logger.error("Upload Error", error);
    return res.status(500).json({ error: error && error.message ? error.message : "Failed to process file" });
  }
});

app.all("/api/*", (req, res) => {
  return res.status(404).json({
    error: "Route Not Found",
    method: req.method,
    path: req.url,
  });
});

app.use((err, req, res, next) => {
  logger.error("Server Error", err);
  return res.status(err && err.status ? err.status : 500).json({
    error: err && err.message ? err.message : "Internal Server Error",
  });
});

exports.api = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 120,
    memory: "1GiB",
  },
  app
);
