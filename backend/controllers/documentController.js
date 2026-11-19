const fs = require("fs");
const path = require("path");

const Document = require("../models/Document");
const PendingUpload = require("../models/PendingUpload");

const { extractTextFromDocument } = require("../services/ocrService");

const {
  suggestDocumentDetails
} = require("../services/documentSuggestionService");

const {
  getChecklist,
  calculateReadiness
} = require("../services/checklistService");

const { searchDocuments } = require("../services/searchService");


// =====================================
// 1. PREVIEW DOCUMENT
// =====================================

const previewDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a document."
      });
    }

    const ocrResult = await extractTextFromDocument(req.file.path);

    const suggestions = suggestDocumentDetails(
      ocrResult.text || ""
    );

    const pendingUpload = await PendingUpload.create({
      userId: req.user.id,

      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,

      extractedText: ocrResult.text || "",
      confidence: ocrResult.confidence || 0,
      sourceType: ocrResult.sourceType,

      suggestedTitle: suggestions.documentName,
      suggestedCategory: suggestions.category,
      checklistKey: suggestions.checklistKey
    });

    return res.status(200).json({
      success: true,
      message: "Document processed successfully.",

      uploadId: pendingUpload._id,

      extractedText: ocrResult.text,

      suggestions: {
        title: suggestions.documentName,
        category: suggestions.category,
        checklistKey: suggestions.checklistKey
      },

      confidence: ocrResult.confidence,
      sourceType: ocrResult.sourceType
    });

  } catch (error) {
    console.error("Preview Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Document preview failed."
    });
  }
};


// =====================================
// 2. CONFIRM DOCUMENT
// =====================================

const confirmDocument = async (req, res) => {
  try {
    const {
      uploadId,
      title,
      category,
      expiryDate,
      isTrackOnly
    } = req.body;

    if (!uploadId) {
      return res.status(400).json({
        success: false,
        message: "Upload ID is required."
      });
    }

    const pendingUpload = await PendingUpload.findOne({
      _id: uploadId,
      userId: req.user.id
    });

    if (!pendingUpload) {
      return res.status(404).json({
        success: false,
        message: "Pending upload not found or expired."
      });
    }

    if (!fs.existsSync(pendingUpload.filePath)) {
      return res.status(404).json({
        success: false,
        message: "Uploaded file not found."
      });
    }

    if (expiryDate && Number.isNaN(Date.parse(expiryDate))) {
      return res.status(400).json({
        success: false,
        message: "Invalid expiry date."
      });
    }

    const document = await Document.create({
      userId: req.user.id,

      title: title || pendingUpload.suggestedTitle || pendingUpload.originalName,

      category: category || pendingUpload.suggestedCategory,

      fileName: pendingUpload.fileName,
      filePath: pendingUpload.filePath,
      fileType: pendingUpload.fileType,

      extractedText: pendingUpload.extractedText,

      checklistKey: pendingUpload.checklistKey,

      expiryDate: expiryDate || undefined,

      isTrackOnly: isTrackOnly === true || isTrackOnly === "true"
    });

    await PendingUpload.deleteOne({
      _id: pendingUpload._id
    });

    return res.status(201).json({
      success: true,
      message: "Document saved successfully.",
      document
    });

  } catch (error) {
    console.error("Confirm Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Document confirmation failed."
    });
  }
};


// =====================================
// 3. GET ALL DOCUMENTS
// =====================================

const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      userId: req.user.id
    }).sort({ uploadDate: -1 });

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents
    });

  } catch (error) {
  console.error("Get Documents Error:", error);

  return res.status(500).json({
    success: false,
    message: "Unable to fetch documents.",
    error: error.message
    });
  }
};


// =====================================
// 4. SEARCH DOCUMENTS
// =====================================

const searchUserDocuments = async (req, res) => {
  try {
    const query = req.query.q || "";

    const documents = await Document.find({
      userId: req.user.id
    });

    // Map title to documentName for Member 3's existing service.
    // Original searchService.js remains unchanged.

    const searchableDocuments = documents.map((doc) => ({
      ...doc.toObject(),
      documentName: doc.title
    }));

    const results = searchDocuments(
      searchableDocuments,
      query
    );

    return res.status(200).json({
      success: true,
      count: results.length,
      documents: results
    });

  } catch (error) {
    console.error("Search Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Document search failed."
    });
  }
};


// =====================================
// 5. GET DOCUMENT CHECKLIST
// =====================================

const getDocumentChecklist = async (req, res) => {
  try {
    const documents = await Document.find({
      userId: req.user.id
    });

    const uploadedKeys = documents.map(
      (doc) => doc.checklistKey
    );

    const checklist = getChecklist(uploadedKeys);

    const readiness = calculateReadiness(uploadedKeys);

    return res.status(200).json({
      success: true,
      checklist,
      readiness
    });

  } catch (error) {
    console.error("Checklist Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to generate checklist."
    });
  }
};
// 6. GET DOCUMENT BY ID
const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found."
      });
    }

    return res.status(200).json({
      success: true,
      document
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid document ID."
    });
  }
};


// 7. UPDATE DOCUMENT
const updateDocument = async (req, res) => {
  try {
    const { title, category, expiryDate, isTrackOnly } = req.body;

    if (expiryDate && Number.isNaN(Date.parse(expiryDate))) {
      return res.status(400).json({
        success: false,
        message: "Invalid expiry date."
      });
    }

    const updates = {};

    if (title !== undefined) updates.title = title;
    if (category !== undefined) updates.category = category;
    if (expiryDate !== undefined) updates.expiryDate = expiryDate || null;

    if (isTrackOnly !== undefined) {
      updates.isTrackOnly =
        isTrackOnly === true || isTrackOnly === "true";
    }

    const document = await Document.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Document updated successfully.",
      document
    });

  } catch (error) {
    console.error("Update Error:", error.message);

    return res.status(400).json({
      success: false,
      message: "Unable to update document."
    });
  }
};


// 8. DELETE DOCUMENT
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully."
    });

  } catch (error) {
    console.error("Delete Error:", error.message);

    return res.status(400).json({
      success: false,
      message: "Unable to delete document."
    });
  }
};

// 9. GET DOCUMENT FILE (inline stream for preview / download)
const getDocumentFile = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document || !document.filePath) {
      return res.status(404).json({
        success: false,
        message: "Document file not found."
      });
    }

    const absolutePath = path.resolve(document.filePath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        message: "Document file is missing on the server."
      });
    }

    const fileName = encodeURIComponent(document.fileName || document.title || "document");

    res.setHeader("Content-Type", document.fileType || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

    return res.sendFile(absolutePath);

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid document ID."
    });
  }
};

module.exports = {
  previewDocument,
  confirmDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getDocumentFile,
  searchUserDocuments,
  getDocumentChecklist
};