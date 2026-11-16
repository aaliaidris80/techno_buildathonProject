const Reminder = require("../models/Reminder");
const Document = require("../models/Document");
const mongoose = require("mongoose");

// CREATE REMINDER
const createReminder = async (req, res) => {
  try {
    const { title, dueDate, reminderType, documentId } = req.body;

    if (!title || !dueDate || Number.isNaN(Date.parse(dueDate))) {
      return res.status(400).json({
        success: false,
        message: "Valid title and due date are required."
      });
    }

    if (documentId) {
      if (!mongoose.isValidObjectId(documentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid document ID."
        });
      }

      const document = await Document.findOne({
        _id: documentId,
        userId: req.user.id
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: "Document not found."
        });
      }
    }

    const reminder = await Reminder.create({
      userId: req.user.id,
      documentId: documentId || undefined,
      title,
      dueDate,
      reminderType
    });

    return res.status(201).json({
      success: true,
      message: "Reminder created successfully.",
      reminder
    });

  } catch (error) {
    console.error("Create Reminder Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create reminder."
    });
  }
};


// GET ALL REMINDERS
const getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({
      userId: req.user.id
    })
      .populate("documentId", "title category")
      .sort({ dueDate: 1 });

    return res.status(200).json({
      success: true,
      count: reminders.length,
      reminders
    });

  } catch (error) {
    console.error("Get Reminders Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch reminders."
    });
  }
};


// UPDATE REMINDER
const updateReminder = async (req, res) => {
  try {
    const { title, dueDate, reminderType, status } = req.body;

    const updates = {};

    if (title !== undefined) updates.title = title;
    if (reminderType !== undefined) updates.reminderType = reminderType;

    if (dueDate !== undefined) {
      if (Number.isNaN(Date.parse(dueDate))) {
        return res.status(400).json({
          success: false,
          message: "Invalid due date."
        });
      }
      updates.dueDate = dueDate;
    }

    if (status !== undefined) {
      if (!["pending", "completed"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid reminder status."
        });
      }
      updates.status = status;
    }

    const reminder = await Reminder.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reminder updated successfully.",
      reminder
    });

  } catch (error) {
    console.error("Update Reminder Error:", error.message);
    return res.status(400).json({
      success: false,
      message: "Unable to update reminder."
    });
  }
};


// DELETE REMINDER
const deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reminder deleted successfully."
    });

  } catch (error) {
    console.error("Delete Reminder Error:", error.message);
    return res.status(400).json({
      success: false,
      message: "Unable to delete reminder."
    });
  }
};


module.exports = {
  createReminder,
  getReminders,
  updateReminder,
  deleteReminder
};