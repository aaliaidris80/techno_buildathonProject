const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document"
  },

  title: {
    type: String,
    required: true
  },

  dueDate: {
    type: Date,
    required: true
  },

  reminderType: {
    type: String
  },

  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending"
  }

}, { timestamps: true });

module.exports = mongoose.model("Reminder", reminderSchema);