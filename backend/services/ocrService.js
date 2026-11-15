const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { createWorker } = require("tesseract.js");

let workerPromise = null;

async function getOCRWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("eng");
  }
  return workerPromise;
}

async function extractTextFromDocument(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return { text: "", confidence: 0, sourceType: "Missing" };
    }

    const ext = path.extname(filePath).toLowerCase();

    // Case 1: PDF File
    if (ext === ".pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      const cleanedText = (pdfData.text || "").replace(/\n\s*\n/g, "\n").trim();

      return {
        text: cleanedText,
        confidence: cleanedText.length > 0 ? 100 : 0,
        sourceType: "PDF",
      };
    }

    // Case 2: Supported Image Formats
    const allowedImages = [".png", ".jpg", ".jpeg", ".webp", ".bmp"];
    if (!allowedImages.includes(ext)) {
      return { text: "", confidence: 0, sourceType: "Unsupported" };
    }

    const worker = await getOCRWorker();
    const result = await worker.recognize(filePath);
    const cleanedText = (result.data.text || "").replace(/\n\s*\n/g, "\n").trim();

    return {
      text: cleanedText,
      confidence: Math.round(result.data.confidence || 0),
      sourceType: "Image",
    };
  } catch (error) {
    console.error("OCR Safe Fallback Triggered:", error.message);
    // Live demo mein server crash bachane ke liye safe fallback
    return { text: "", confidence: 0, sourceType: "Error" };
  }
}

async function closeOCRWorker() {
  if (workerPromise) {
    const worker = await workerPromise;
    await worker.terminate();
    workerPromise = null;
  }
}

module.exports = {
  extractTextFromDocument,
  extractTextFromImage: extractTextFromDocument,
  closeOCRWorker,
};