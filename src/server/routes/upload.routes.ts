import { Router, Request, Response } from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const allowedTypes = ["application/pdf", "text/plain"];

router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!allowedTypes.includes(req.file.mimetype)) {
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

    console.log(`[${new Date().toISOString()}] File parsed successfully: ${req.file.originalname}`);

    return res.json({ 
      success: true,
      message: "File uploaded and parsed successfully",
      filename: req.file.originalname,
      text: text
    });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Upload Error:`, error);
    return res.status(500).json({ error: error.message || "Failed to process file" });
  }
});

export default router;
