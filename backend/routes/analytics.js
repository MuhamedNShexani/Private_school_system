const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Evaluation = require("../models/Evaluation");
const Subject = require("../models/Subject");
const Teacher = require("../models/Teacher");
const Grade = require("../models/Grade");
const {
  verifyToken,
  getCurrentUser,
  requireAdmin,
  requireTeacherOrAdmin,
} = require("../middleware/auth");

// GET comprehensive dashboard analytics (Admin only)
router.get(
  "/dashboard",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      // Student count with gender breakdown
      const studentStats = await Student.aggregate([
        {
          $group: {
            _id: "$gender",
            count: { $sum: 1 },
          },
        },
      ]);

      const totalStudents = studentStats.reduce(
        (sum, stat) => sum + stat.count,
        0
      );
      const genderBreakdown = {
        male: studentStats.find((s) => s._id === "Male")?.count || 0,
        female: studentStats.find((s) => s._id === "Female")?.count || 0,
        other: studentStats.find((s) => s._id === "Other")?.count || 0,
        total: totalStudents,
      };

      // Student progress by time period (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const progressByMonth = await Evaluation.aggregate([
        {
          $match: {
            evaluationDate: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$evaluationDate" },
              month: { $month: "$evaluationDate" },
            },
            avgScore: {
              $avg: { $multiply: [{ $divide: ["$score", "$maxScore"] }, 100] },
            },
            totalEvaluations: { $sum: 1 },
            uniqueStudents: { $addToSet: "$student" },
          },
        },
        {
          $project: {
            _id: 1,
            avgScore: { $round: ["$avgScore", 2] },
            totalEvaluations: 1,
            uniqueStudents: { $size: "$uniqueStudents" },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 },
        },
      ]);

      // Graduation rate by grade
      const graduationByGrade = await Evaluation.aggregate([
        {
          $lookup: {
            from: "subjects",
            localField: "course",
            foreignField: "_id",
            as: "courseInfo",
          },
        },
        {
          $unwind: "$courseInfo",
        },
        {
          $lookup: {
            from: "grades",
            localField: "courseInfo.grade",
            foreignField: "_id",
            as: "gradeInfo",
          },
        },
        {
          $unwind: "$gradeInfo",
        },
        {
          $group: {
            _id: "$gradeInfo.name",
            totalEvaluations: { $sum: 1 },
            avgScore: {
              $avg: { $multiply: [{ $divide: ["$score", "$maxScore"] }, 100] },
            },
            passCount: {
              $sum: {
                $cond: [
                  {
                    $gte: [
                      {
                        $multiply: [{ $divide: ["$score", "$maxScore"] }, 100],
                      },
                      60,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            totalEvaluations: 1,
            avgScore: { $round: ["$avgScore", 2] },
            passCount: 1,
            failCount: { $subtract: ["$totalEvaluations", "$passCount"] },
            passRate: {
              $round: [
                {
                  $multiply: [
                    { $divide: ["$passCount", "$totalEvaluations"] },
                    100,
                  ],
                },
                2,
              ],
            },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      // Top performing courses
      const topSubjects = await Evaluation.aggregate([
        {
          $lookup: {
            from: "subjects",
            localField: "course",
            foreignField: "_id",
            as: "courseInfo",
          },
        },
        {
          $unwind: "$courseInfo",
        },
        {
          $group: {
            _id: "$courseInfo.name",
            avgScore: {
              $avg: { $multiply: [{ $divide: ["$score", "$maxScore"] }, 100] },
            },
            totalEvaluations: { $sum: 1 },
            uniqueStudents: { $addToSet: "$student" },
          },
        },
        {
          $project: {
            _id: 1,
            avgScore: { $round: ["$avgScore", 2] },
            totalEvaluations: 1,
            studentCount: { $size: "$uniqueStudents" },
          },
        },
        {
          $sort: { avgScore: -1 },
        },
        {
          $limit: 5,
        },
      ]);

      // Recent activity (last 30 evaluations)
      const recentActivity = await Evaluation.find({})
        .populate("student", "name studentNumber")
        .populate("course", "name code")
        .populate("topic", "name code")
        .populate("teacher", "name employeeNumber")
        .sort({ evaluationDate: -1 })
        .limit(30);

      // Teacher performance
      const teacherPerformance = await Evaluation.aggregate([
        {
          $lookup: {
            from: "teachers",
            localField: "teacher",
            foreignField: "_id",
            as: "teacherInfo",
          },
        },
        {
          $unwind: "$teacherInfo",
        },
        {
          $group: {
            _id: "$teacherInfo.name",
            avgScore: {
              $avg: { $multiply: [{ $divide: ["$score", "$maxScore"] }, 100] },
            },
            totalEvaluations: { $sum: 1 },
            uniqueStudents: { $addToSet: "$student" },
          },
        },
        {
          $project: {
            _id: 1,
            avgScore: { $round: ["$avgScore", 2] },
            totalEvaluations: 1,
            studentCount: { $size: "$uniqueStudents" },
          },
        },
        {
          $sort: { avgScore: -1 },
        },
      ]);

      res.json({
        success: true,
        data: {
          genderBreakdown,
          progressByMonth,
          graduationByGrade,
          topSubjects,
          recentActivity,
          teacherPerformance,
          summary: {
            totalStudents,
            totalTeachers: await Teacher.countDocuments({ isActive: true }),
            totalSubjects: await Subject.countDocuments({ isActive: true }),
            totalGrades: await Grade.countDocuments({ isActive: true }),
            totalEvaluations: await Evaluation.countDocuments(),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard analytics:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// GET student progress analytics (Teachers and Admins)
router.get(
  "/student-progress/:studentId",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const { timeRange = "6months" } = req.query;

      let dateFilter = {};
      const now = new Date();

      switch (timeRange) {
        case "1month":
          dateFilter = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
          break;
        case "3months":
          dateFilter = { $gte: new Date(now.setMonth(now.getMonth() - 3)) };
          break;
        case "6months":
          dateFilter = { $gte: new Date(now.setMonth(now.getMonth() - 6)) };
          break;
        case "1year":
          dateFilter = {
            $gte: new Date(now.setFullYear(now.getFullYear() - 1)),
          };
          break;
        default:
          dateFilter = { $gte: new Date(now.setMonth(now.getMonth() - 6)) };
      }

      // Student progress over time
      const progressOverTime = await Evaluation.aggregate([
        {
          $match: {
            student: new mongoose.Types.ObjectId(studentId),
            evaluationDate: dateFilter,
          },
        },
        {
          $lookup: {
            from: "topics",
            localField: "topic",
            foreignField: "_id",
            as: "topicInfo",
          },
        },
        {
          $unwind: "$topicInfo",
        },
        {
          $lookup: {
            from: "units",
            localField: "topicInfo.unit",
            foreignField: "_id",
            as: "unitInfo",
          },
        },
        {
          $unwind: "$unitInfo",
        },
        {
          $lookup: {
            from: "subjects",
            localField: "course",
            foreignField: "_id",
            as: "courseInfo",
          },
        },
        {
          $unwind: "$courseInfo",
        },
        {
          $group: {
            _id: {
              year: { $year: "$evaluationDate" },
              month: { $month: "$evaluationDate" },
              week: { $week: "$evaluationDate" },
            },
            avgScore: {
              $avg: { $multiply: [{ $divide: ["$score", "$maxScore"] }, 100] },
            },
            evaluations: { $sum: 1 },
            courses: { $addToSet: "$courseInfo.name" },
            topics: { $addToSet: "$topicInfo.name" },
          },
        },
        {
          $project: {
            _id: 1,
            avgScore: { $round: ["$avgScore", 2] },
            evaluations: 1,
            courseCount: { $size: "$courses" },
            topicCount: { $size: "$topics" },
            date: {
              $dateFromParts: {
                year: "$_id.year",
                month: "$_id.month",
                day: 1,
              },
            },
          },
        },
        {
          $sort: { date: 1 },
        },
      ]);

      // Performance by course
      const performanceBySubject = await Evaluation.aggregate([
        {
          $match: {
            student: new mongoose.Types.ObjectId(studentId),
            evaluationDate: dateFilter,
          },
        },
        {
          $lookup: {
            from: "subjects",
            localField: "course",
            foreignField: "_id",
            as: "courseInfo",
          },
        },
        {
          $unwind: "$courseInfo",
        },
        {
          $group: {
            _id: "$courseInfo.name",
            avgScore: {
              $avg: { $multiply: [{ $divide: ["$score", "$maxScore"] }, 100] },
            },
            totalEvaluations: { $sum: 1 },
            lastEvaluation: { $max: "$evaluationDate" },
            scores: {
              $push: { $multiply: [{ $divide: ["$score", "$maxScore"] }, 100] },
            },
          },
        },
        {
          $project: {
            _id: 1,
            avgScore: { $round: ["$avgScore", 2] },
            totalEvaluations: 1,
            lastEvaluation: 1,
            minScore: { $round: [{ $min: "$scores" }, 2] },
            maxScore: { $round: [{ $max: "$scores" }, 2] },
            improvement: {
              $round: [
                {
                  $subtract: [
                    { $arrayElemAt: ["$scores", -1] },
                    { $arrayElemAt: ["$scores", 0] },
                  ],
                },
                2,
              ],
            },
          },
        },
        {
          $sort: { avgScore: -1 },
        },
      ]);

      // Performance by topic difficulty
      const performanceByDifficulty = await Evaluation.aggregate([
        {
          $match: {
            student: new mongoose.Types.ObjectId(studentId),
            evaluationDate: dateFilter,
          },
        },
        {
          $lookup: {
            from: "topics",
            localField: "topic",
            foreignField: "_id",
            as: "topicInfo",
          },
        },
        {
          $unwind: "$topicInfo",
        },
        {
          $group: {
            _id: "$topicInfo.difficulty",
            avgScore: {
              $avg: { $multiply: [{ $divide: ["$score", "$maxScore"] }, 100] },
            },
            totalEvaluations: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 1,
            avgScore: { $round: ["$avgScore", 2] },
            totalEvaluations: 1,
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      res.json({
        success: true,
        data: {
          progressOverTime,
          performanceBySubject,
          performanceByDifficulty,
          timeRange,
        },
      });
    } catch (error) {
      console.error("Error fetching student progress:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;
