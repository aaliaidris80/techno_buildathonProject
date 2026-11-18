const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  title: {
    type: String,
    trim: true
  },

  category: {
    type: String
  },

  fileName: {
    type: String
  },

  filePath: {
    type: String
  },

  fileType: {
    type: String
  },

  extractedText: {
    type: String,
    default: ""
  },

  checklistKey: {
    type: String,
    default: ""
  },

  expiryDate: {
    type: Date,
    default: null
  },

  isTrackOnly: {
    type: Boolean,
    default: false
  },

  uploadDate: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

module.exports = mongoose.model("Document", documentSchema);