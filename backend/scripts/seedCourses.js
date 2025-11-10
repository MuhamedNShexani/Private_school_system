const mongoose = require("mongoose");
const Subject = require("../models/Subject");
const Grade = require("../models/Grade");
const Teacher = require("../models/Teacher");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/student-exercises",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Seed courses
const seedCourses = async () => {
  try {
    // Get existing grades and teachers
    const grades = await Grade.find({ isActive: true });
    const teachers = await Teacher.find({ isActive: true });

    if (grades.length === 0 || teachers.length === 0) {
      console.log("Please run seedGradesAndTeachers.js first!");
      return;
    }

    // Clear existing courses (optional - remove this in production)
    await Subject.deleteMany({});
    console.log("Cleared existing courses");

    // Create courses
    const courses = [
      {
        name: "Arabic Language",
        code: "ARB-101",
        description: "Arabic Language and Literature",
        grade: grades[0]._id, // Grade 10
        teacher: teachers[0]._id, // Dr. Sarah Johnson
        maxScore: 100,
      },
      {
        name: "English Language",
        code: "ENG-101",
        description: "English Language and Literature",
        grade: grades[0]._id, // Grade 10
        teacher: teachers[1]._id, // Prof. Michael Chen
        maxScore: 100,
      },
      {
        name: "Mathematics",
        code: "MATH-101",
        description: "Basic Mathematics",
        grade: grades[0]._id, // Grade 10
        teacher: teachers[0]._id, // Dr. Sarah Johnson
        maxScore: 100,
      },
      {
        name: "Physics",
        code: "PHY-101",
        description: "Basic Physics",
        grade: grades[0]._id, // Grade 10
        teacher: teachers[2]._id, // Dr. Emily Rodriguez
        maxScore: 100,
      },
      {
        name: "Biology",
        code: "BIO-101",
        description: "Basic Biology",
        grade: grades[0]._id, // Grade 10
        teacher: teachers[2]._id, // Dr. Emily Rodriguez
        maxScore: 100,
      },
      {
        name: "History",
        code: "HIS-101",
        description: "World History",
        grade: grades[0]._id, // Grade 10
        teacher: teachers[3]._id, // Mr. David Thompson
        maxScore: 100,
      },
      // Grade 11 courses
      {
        name: "Advanced Arabic",
        code: "ARB-201",
        description: "Advanced Arabic Language and Literature",
        grade: grades[1]._id, // Grade 11
        teacher: teachers[0]._id,
        maxScore: 100,
      },
      {
        name: "Advanced English",
        code: "ENG-201",
        description: "Advanced English Language and Literature",
        grade: grades[1]._id, // Grade 11
        teacher: teachers[1]._id,
        maxScore: 100,
      },
      {
        name: "Advanced Mathematics",
        code: "MATH-201",
        description: "Advanced Mathematics",
        grade: grades[1]._id, // Grade 11
        teacher: teachers[0]._id,
        maxScore: 100,
      },
      {
        name: "Chemistry",
        code: "CHEM-201",
        description: "General Chemistry",
        grade: grades[1]._id, // Grade 11
        teacher: teachers[2]._id,
        maxScore: 100,
      },
      // Grade 12 courses
      {
        name: "Literature and Composition",
        code: "LIT-301",
        description: "Arabic Literature and Composition",
        grade: grades[2]._id, // Grade 12
        teacher: teachers[0]._id,
        maxScore: 100,
      },
      {
        name: "Calculus",
        code: "CALC-301",
        description: "Calculus and Advanced Mathematics",
        grade: grades[2]._id, // Grade 12
        teacher: teachers[0]._id,
        maxScore: 100,
      },
      {
        name: "Advanced Physics",
        code: "PHY-301",
        description: "Advanced Physics",
        grade: grades[2]._id, // Grade 12
        teacher: teachers[2]._id,
        maxScore: 100,
      },
      {
        name: "Geography",
        code: "GEO-301",
        description: "World Geography",
        grade: grades[2]._id, // Grade 12
        teacher: teachers[3]._id,
        maxScore: 100,
      },
    ];

    const createdSubjects = await Subject.insertMany(courses);
    console.log(
      "✅ Created courses:",
      createdSubjects.map((c) => `${c.name} (${c.code})`).join(", ")
    );

    console.log("\n🎉 Courses seeding completed successfully!");
    console.log(
      `\nCreated ${createdSubjects.length} subjects across ${grades.length} grades`
    );
  } catch (error) {
    console.error("Error seeding courses:", error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeding function
seedCourses();
