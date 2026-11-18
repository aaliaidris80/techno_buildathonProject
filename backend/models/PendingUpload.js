const mongoose = require("mongoose");

const pendingUploadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  fileName: {
    type: String,
    required: true
  },

  originalName: String,

  filePath: {
    type: String,
    required: true
  },

  fileType: String,

  extractedText: {
    type: String,
    default: ""
  },

  confidence: Number,

  sourceType: String,

  suggestedTitle: String,
  suggestedCategory: String,
  checklistKey: String,

  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 60 * 1000)
  }

}, { timestamps: true });

pendingUploadSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model(
  "PendingUpload",
  pendingUploadSchema
);