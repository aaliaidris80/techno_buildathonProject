const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../uploads/uploadMiddleware");

const {
  previewDocument,
  confirmDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getDocumentFile,
  searchUserDocuments,
  getDocumentChecklist
} = require("../controllers/documentController");

const handleUpload = (req, res, next) => {
  upload.single("document")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next();
  });
};

router.post("/preview", authMiddleware, handleUpload, previewDocument);
router.post("/confirm", authMiddleware, confirmDocument);

router.get("/search", authMiddleware, searchUserDocuments);
router.get("/checklist", authMiddleware, getDocumentChecklist);

router.get("/", authMiddleware, getDocuments);
router.get("/:id/file", authMiddleware, getDocumentFile);
router.get("/:id", authMiddleware, getDocumentById);
router.put("/:id", authMiddleware, updateDocument);
router.delete("/:id", authMiddleware, deleteDocument);

module.exports = router;