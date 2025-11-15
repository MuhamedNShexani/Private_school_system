const mongoose = require("mongoose");
const Evaluation = require("../models/Evaluation");
const Student = require("../models/Student");
const Class = require("../models/Class");
const StudentGrade = require("../models/StudentGrade");
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

// Function to check performance data
async function checkPerformanceData() {
  try {
    console.log("=== Checking Performance Data ===\n");

    // Check evaluations
    const evaluationCount = await Evaluation.countDocuments();
    console.log(`1. Total Evaluations: ${evaluationCount}`);

    if (evaluationCount === 0) {
      console.log("⚠️ No evaluations found in database!");
      console.log("   Checking for StudentGrade data as alternative...");
      
      const studentGradeCount = await StudentGrade.countDocuments();
      console.log(`   StudentGrade records: ${studentGradeCount}`);
      
      if (studentGradeCount === 0) {
        console.log("❌ No StudentGrade data found either!");
        console.log("   This is why the performance by class is empty.");
        console.log("   You need to create evaluations or student grades first.");
        return;
      } else {
        console.log("✅ Found StudentGrade data - analytics will use this as fallback.");
      }
    }

    // Check students
    const studentCount = await Student.countDocuments();
    console.log(`2. Total Students: ${studentCount}`);

    // Check students with classes
    const studentsWithClasses = await Student.countDocuments({ class: { $exists: true, $ne: null } });
    console.log(`3. Students with class assigned: ${studentsWithClasses}`);

    // Check classes
    const classCount = await Class.countDocuments();
    console.log(`4. Total Classes: ${classCount}`);

    // Sample evaluation
    const sampleEvaluation = await Evaluation.findOne().populate("student");
    if (sampleEvaluation) {
      console.log("\n5. Sample Evaluation:");
      console.log("   - Student ID:", sampleEvaluation.student?._id);
      console.log("   - Student:", sampleEvaluation.student?.fullName);
      console.log("   - Score:", sampleEvaluation.score, "/", sampleEvaluation.maxScore);
      
      if (sampleEvaluation.student) {
        const student = await Student.findById(sampleEvaluation.student._id).populate("class");
        console.log("   - Student Class ID:", student?.class?._id);
        console.log("   - Student Class Name:", student?.class?.name?.en || "N/A");
      }
    }

    // Sample StudentGrade
    const sampleGrade = await StudentGrade.findOne().populate("student");
    if (sampleGrade) {
      console.log("\n5b. Sample StudentGrade:");
      console.log("   - Student ID:", sampleGrade.student?._id);
      console.log("   - Student:", sampleGrade.student?.fullName);
      console.log("   - Total Score:", sampleGrade.total);
      
      if (sampleGrade.student) {
        const student = await Student.findById(sampleGrade.student._id).populate("class");
        console.log("   - Student Class ID:", student?.class?._id);
        console.log("   - Student Class Name:", student?.class?.name?.en || "N/A");
        console.log("   - Student Class Type:", typeof student?.class);
      }
    }

    // Test the aggregation query with StudentGrade
    console.log("\n6. Testing Performance by Class Aggregation (using StudentGrade)...");
    const performanceByClass = await StudentGrade.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "studentInfo",
        },
      },
      {
        $unwind: {
          path: "$studentInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "classes",
          localField: "studentInfo.class",
          foreignField: "_id",
          as: "classInfo",
        },
      },
      {
        $unwind: {
          path: "$classInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "classInfo._id": { $exists: true, $ne: null },
        },
      },
        {
          $group: {
            _id: "$studentInfo.class",
            className: { $first: "$classInfo.name.en" },
            avgScore: { $avg: "$total" },
            totalEvaluations: { $sum: 1 },
            uniqueStudents: { $addToSet: "$student" },
          },
        },
        {
          $project: {
            _id: 1,
            className: 1,
            avgScore: { $round: ["$avgScore", 2] },
            totalEvaluations: 1,
            studentCount: { $size: "$uniqueStudents" },
          },
        },
        {
          $sort: { avgScore: -1 },
        },
    ]);

    console.log(`   Found ${performanceByClass.length} classes with performance data:`);
    performanceByClass.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.className || "Unknown"}: ${item.avgScore}% (${item.studentCount} students, ${item.totalEvaluations} evaluations)`);
    });

    if (performanceByClass.length === 0) {
      console.log("\n⚠️ No performance data found. Possible issues:");
      console.log("   - Students don't have class assignments");
      console.log("   - Evaluations reference students that don't exist");
      console.log("   - Class references in students are invalid");
      
      // Check evaluations without student class
      const evalsWithoutClass = await Evaluation.aggregate([
        {
          $lookup: {
            from: "students",
            localField: "student",
            foreignField: "_id",
            as: "studentInfo",
          },
        },
        {
          $unwind: {
            path: "$studentInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $or: [
              { "studentInfo.class": { $exists: false } },
              { "studentInfo.class": null },
            ],
          },
        },
        {
          $count: "count",
        },
      ]);
      
      if (evalsWithoutClass.length > 0) {
        console.log(`\n   Found ${evalsWithoutClass[0].count} evaluations for students without class assignments.`);
      }
    }

  } catch (error) {
    console.error("Error checking performance data:", error);
  } finally {
    mongoose.connection.close();
    console.log("\nDatabase connection closed");
  }
}

// Run the check function
checkPerformanceData();

