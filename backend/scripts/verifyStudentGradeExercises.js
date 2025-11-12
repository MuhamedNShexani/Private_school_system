const mongoose = require("mongoose");
require("dotenv").config();

// Load all models
const StudentGrade = require("../models/StudentGrade");
const Subject = require("../models/Subject");
const Season = require("../models/Season");
const Student = require("../models/Student");

async function verifyStudentGradeExercises() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/student-platform");
    console.log("✓ Connected to MongoDB\n");

    // Get all StudentGrade records with subject and season populated
    const allGrades = await StudentGrade.find({})
      .populate("student", "fullName username")
      .populate("subject", "title")
      .lean();

    console.log("========== STUDENT GRADES VERIFICATION ==========\n");
    console.log(`Total StudentGrade records: ${allGrades.length}\n`);

    // Group by student
    const byStudent = {};
    allGrades.forEach((grade) => {
      const studentName = grade.student?.fullName || grade.student?.username || "Unknown";
      if (!byStudent[studentName]) {
        byStudent[studentName] = [];
      }
      byStudent[studentName].push(grade);
    });

    // Display data grouped by student
    Object.entries(byStudent).forEach(([studentName, grades]) => {
      console.log(`\nStudent: ${studentName}`);
      console.log("─".repeat(80));
      
      grades.forEach((grade) => {
        const subjectName = grade.subject?.title || "Unknown Subject";
        console.log(`  Subject: ${subjectName} | Season: ${grade.season}`);
        console.log(`    Exercises: ${grade.exercises} | Monthly Exam: [${grade.monthly_exam.join(", ")}] | Attendance: ${grade.attendance} | Behaviour: ${grade.behaviour} | Season Exam: ${grade.season_exam} | Total: ${grade.total}`);
      });
    });

    console.log("\n================================================");
    console.log("✓ Verification completed\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Fatal error during verification:", error);
    process.exit(1);
  }
}

verifyStudentGradeExercises();

