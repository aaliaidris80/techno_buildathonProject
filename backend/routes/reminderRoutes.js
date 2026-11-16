const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createReminder,
  getReminders,
  updateReminder,
  deleteReminder
} = require("../controllers/reminderController");

router.post("/", authMiddleware, createReminder);
router.get("/", authMiddleware, getReminders);
router.put("/:id", authMiddleware, updateReminder);
router.delete("/:id", authMiddleware, deleteReminder);

module.exports = router;