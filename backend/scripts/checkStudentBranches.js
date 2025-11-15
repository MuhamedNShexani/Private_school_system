const mongoose = require("mongoose");
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

const Student = require("../models/Student");
const Class = require("../models/Class");
const StudentGrade = require("../models/StudentGrade");

async function checkStudentBranches() {
  try {
    // Get a sample student grade
    const grade = await StudentGrade.findOne()
      .populate({
        path: "student",
        select: "fullName class branchID",
        populate: {
          path: "class",
          select: "name branches",
        },
      })
      .lean();

    if (grade && grade.student) {
      console.log("\n=== Student Data ===");
      console.log("Student:", grade.student.fullName);
      console.log("Student Class ID:", grade.student.class?._id || grade.student.class);
      console.log("Student Branch ID:", grade.student.branchID);

      // Get the class with branches
      const classId = grade.student.class?._id || grade.student.class;
      const classObj = await Class.findById(classId).lean();

      if (classObj) {
        console.log("\n=== Class Data ===");
        console.log("Class Name:", classObj.name?.en || classObj.name);
        console.log("Number of branches:", classObj.branches?.length || 0);
        console.log("\n=== Branches ===");
        if (classObj.branches && classObj.branches.length > 0) {
          classObj.branches.forEach((branch, index) => {
            console.log(
              `Branch ${index + 1}:`,
              branch.name?.en || branch.name,
              "ID:",
              branch._id?.toString()
            );
          });

          // Try to find matching branch
          const branchId = grade.student.branchID?.toString();
          const matchingBranch = classObj.branches.find(
            (b) => b._id?.toString() === branchId
          );

          console.log("\n=== Branch Match ===");
          console.log("Looking for branch ID:", branchId);
          console.log("Match found:", matchingBranch ? "YES" : "NO");
          if (matchingBranch) {
            console.log("Branch name:", matchingBranch.name?.en || matchingBranch.name);
          }
        } else {
          console.log("No branches found in class");
        }
      } else {
        console.log("Class not found");
      }
    } else {
      console.log("No student grades found");
    }
  } catch (error) {
    console.error("Error checking student branches:", error);
  } finally {
    mongoose.connection.close();
    console.log("\nDatabase connection closed");
  }
}

checkStudentBranches();

