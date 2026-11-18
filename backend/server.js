require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();


// Middleware
app.use(cors());
app.use(express.json());


// Authentication Routes
app.use("/api/auth", authRoutes);


// Document Routes
app.use("/api/documents", documentRoutes);
app.use("/api/reminders", reminderRoutes);

// Home Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "DocuPing backend is running!"
  });
});


// Health Check Route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    message: "Backend is healthy"
  });
});


// Protected Route
app.get("/api/protected", authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Access granted! You are authenticated.",
    user: req.user
  });
});


// Server Configuration
const PORT = process.env.PORT || 5000;


// Start Server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`DocuPing server running on port ${PORT}`);
    });

  } catch (error) {
    console.log("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();