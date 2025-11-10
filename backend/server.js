const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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
