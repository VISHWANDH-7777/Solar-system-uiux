import { Router } from "express";
import * as documentController from "../controllers/document.controller";

const router = Router();

// POST /api/document/process
router.post("/process", documentController.uploadDocument);

// GET /api/document/:id
router.get("/:id", documentController.getDocument);

// GET /api/document (all)
router.get("/", documentController.getAllDocuments);

// Test route for debugging 404s
router.get("/test/ping", (req, res) => res.json({ message: "Document routes are active" }));

export default router;
