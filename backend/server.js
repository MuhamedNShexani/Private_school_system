const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

// Middleware to handle multipart/form-data
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const mongoUri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/student_exercises";

mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/seasons", require("./routes/seasons"));
app.use("/api/chapters", require("./routes/chapters"));
app.use("/api/subjects", require("./routes/subjects"));
app.use("/api/students", require("./routes/students"));
app.use("/api/classes", require("./routes/classes"));
app.use("/api/teachers", require("./routes/teachers"));
app.use("/api/grades", require("./routes/grades"));
app.use("/api/studentGrades", require("./routes/studentGrades"));
// Old routes removed - using new terminology:
// courses -> subjects, semesters -> seasons, units -> chapters, topics -> parts
app.use("/api/parts", require("./routes/parts"));
app.use("/api/exercises", require("./routes/exercises"));
app.use("/api/quizzes", require("./routes/quizzes"));
app.use("/api/evaluations", require("./routes/evaluations"));
app.use("/api/grading", require("./routes/grading"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/translations", require("./routes/translations"));
app.use("/api/homeworks", require("./routes/homeworks"));

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Student Exercise Platform API is running!" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export upload middleware for use in routes
module.exports = { app, upload };
