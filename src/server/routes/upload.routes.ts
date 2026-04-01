import { Router, Request, Response } from "express";
import multer from "multer";
import * as pdfParse from "pdf-parse";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const allowedTypes = ["application/pdf", "text/plain"];

router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: "Invalid file type. Only .pdf and .txt are allowed." });
    }

    let text = "";
    if (req.file.mimetype === "application/pdf") {
      // Robustly handle different import scenarios for pdf-parse
      let parser: any = pdfParse;
      
      console.log(`[${new Date().toISOString()}] Initial parser type: ${typeof parser}`);
      
      if (typeof parser !== 'function') {
        if (parser && parser.PDFParse && typeof parser.PDFParse === 'function') {
          console.log(`[${new Date().toISOString()}] Using parser.PDFParse`);
          parser = parser.PDFParse;
        } else if (parser && parser.default && typeof parser.default === 'function') {
          console.log(`[${new Date().toISOString()}] Using parser.default`);
          parser = parser.default;
        } else if (parser && typeof parser === 'object') {
          const keys = Object.keys(parser);
          console.log(`[${new Date().toISOString()}] Parser is an object. Keys:`, keys);
          // Prioritize PDFParse if it exists
          if (parser.PDFParse && typeof parser.PDFParse === 'function') {
             parser = parser.PDFParse;
          } else {
            const funcKey = keys.find(k => typeof parser[k] === 'function' && !k.endsWith('Exception') && !k.endsWith('Error'));
            if (funcKey) {
              console.log(`[${new Date().toISOString()}] Found function property: ${funcKey}`);
              parser = parser[funcKey];
            }
          }
        }
      }

      if (typeof parser !== 'function') {
        console.error(`[${new Date().toISOString()}] Failed to find a valid pdf-parse function. Value:`, parser);
        throw new Error(`PDF parsing library not correctly initialized (type: ${typeof parser})`);
      }

      const data = await parser(req.file.buffer);
      text = data.text;
    } else {
      text = req.file.buffer.toString("utf-8");
    }

    console.log(`[${new Date().toISOString()}] File parsed successfully: ${req.file.originalname}`);

    res.json({ 
      message: "File uploaded and parsed successfully",
      filename: req.file.originalname,
      text: text
    });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Upload Error:`, error);
    res.status(500).json({ error: error.message || "Failed to process file" });
  }
});

export default router;
