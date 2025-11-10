const mongoose = require("mongoose");
const Grade = require("../models/Grade");
const Teacher = require("../models/Teacher");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/student_exercises",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Seed grades and teachers
const seedGradesAndTeachers = async () => {
  try {
    // Clear existing data (optional - remove this in production)
    await Grade.deleteMany({});
    await Teacher.deleteMany({});
    console.log("Cleared existing grades and teachers");

    // Create grades
    const grades = [
      { name: "Grade 10", level: 10, description: "Tenth Grade" },
      { name: "Grade 11", level: 11, description: "Eleventh Grade" },
      { name: "Grade 12", level: 12, description: "Twelfth Grade" },
    ];

    const createdGrades = await Grade.insertMany(grades);
    console.log(
      "✅ Created grades:",
      createdGrades.map((g) => g.name).join(", ")
    );

    // Create sample teachers
    const teachers = [
      {
        name: "Dr. Sarah Johnson",
        employeeNumber: "T001",
        email: "sarah.johnson@school.com",
        specializations: ["Mathematics", "Physics"],
        phone: "+1-555-0101",
      },
      {
        name: "Prof. Michael Chen",
        employeeNumber: "T002",
        email: "michael.chen@school.com",
        specializations: ["English Literature", "Creative Writing"],
        phone: "+1-555-0102",
      },
      {
        name: "Dr. Emily Rodriguez",
        employeeNumber: "T003",
        email: "emily.rodriguez@school.com",
        specializations: ["Biology", "Chemistry"],
        phone: "+1-555-0103",
      },
      {
        name: "Mr. David Thompson",
        employeeNumber: "T004",
        email: "david.thompson@school.com",
        specializations: ["History", "Geography"],
        phone: "+1-555-0104",
      },
    ];

    const createdTeachers = await Teacher.insertMany(teachers);
    console.log(
      "✅ Created teachers:",
      createdTeachers.map((t) => t.name).join(", ")
    );

    console.log("\n🎉 Grades and Teachers seeding completed successfully!");
    console.log(
      `\nCreated ${createdGrades.length} grades and ${createdTeachers.length} teachers`
    );
  } catch (error) {
    console.error("Error seeding grades and teachers:", error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeding function
seedGradesAndTeachers();
