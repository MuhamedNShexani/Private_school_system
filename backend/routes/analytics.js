const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Evaluation = require("../models/Evaluation");
const Subject = require("../models/Subject");
const Teacher = require("../models/Teacher");
const Grade = require("../models/Grade");
const StudentGrade = require("../models/StudentGrade");
const Class = require("../models/Class");
const Season = require("../models/Season");
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
      const studentGenderBreakdown = {
        male: studentStats.find((s) => s._id === "Male")?.count || 0,
        female: studentStats.find((s) => s._id === "Female")?.count || 0,
        other: studentStats.find((s) => s._id === "Other")?.count || 0,
        total: totalStudents,
      };

      // Teacher count with gender breakdown
      const teacherStats = await Teacher.aggregate([
        {
          $match: { isActive: true },
        },
        {
          $group: {
            _id: "$gender",
            count: { $sum: 1 },
          },
        },
      ]);

      const totalTeachers = teacherStats.reduce(
        (sum, stat) => sum + stat.count,
        0
      );
      const teacherGenderBreakdown = {
        male:
          teacherStats.find((s) => s._id === "Male" || s._id === "male")
            ?.count || 0,
        female:
          teacherStats.find((s) => s._id === "Female" || s._id === "female")
            ?.count || 0,
        other:
          teacherStats.find((s) => s._id === "Other" || s._id === "other")
            ?.count || 0,
        total: totalTeachers,
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

      // Student performance by class
      // First try to get data from Evaluations
      let performanceByClass = await Evaluation.aggregate([
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
            preserveNullAndEmptyArrays: false,
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
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $addFields: {
            branchInfo: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$classInfo.branches",
                    as: "branch",
                    cond: { $eq: ["$$branch._id", "$studentInfo.branchID"] },
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              class: "$studentInfo.class",
              branch: "$studentInfo.branchID",
            },
            className: { $first: "$classInfo.name.en" },
            branchName: { $first: "$branchInfo.name.en" },
            branchId: { $first: "$studentInfo.branchID" },
            avgScore: {
              $avg: { $multiply: [{ $divide: ["$score", "$maxScore"] }, 100] },
            },
            totalEvaluations: { $sum: 1 },
            uniqueStudents: { $addToSet: "$student" },
            minScore: {
              $min: { $multiply: [{ $divide: ["$score", "$maxScore"] }, 100] },
            },
            maxScore: {
              $max: { $multiply: [{ $divide: ["$score", "$maxScore"] }, 100] },
            },
          },
        },
        {
          $project: {
            _id: 1,
            className: 1,
            branchName: 1,
            branchId: 1,
            avgScore: { $round: ["$avgScore", 2] },
            minScore: { $round: ["$minScore", 2] },
            maxScore: { $round: ["$maxScore", 2] },
            totalEvaluations: 1,
            studentCount: { $size: "$uniqueStudents" },
          },
        },
        {
          $sort: { avgScore: -1 },
        },
      ]);

      // If no evaluation data, try to use StudentGrade data as fallback
      if (performanceByClass.length === 0) {
        performanceByClass = await StudentGrade.aggregate([
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
              preserveNullAndEmptyArrays: false,
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
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $addFields: {
              branchInfo: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$classInfo.branches",
                      as: "branch",
                      cond: { $eq: ["$$branch._id", "$studentInfo.branchID"] },
                    },
                  },
                  0,
                ],
              },
            },
          },
          {
            $group: {
              _id: {
                class: "$studentInfo.class",
                branch: "$studentInfo.branchID",
              },
              className: { $first: "$classInfo.name.en" },
              branchName: { $first: "$branchInfo.name.en" },
              branchId: { $first: "$studentInfo.branchID" },
              avgScore: { $avg: "$total" },
              totalEvaluations: { $sum: 1 },
              uniqueStudents: { $addToSet: "$student" },
              minScore: { $min: "$total" },
              maxScore: { $max: "$total" },
            },
          },
          {
            $project: {
              _id: 1,
              className: 1,
              branchName: 1,
              branchId: 1,
              avgScore: { $round: ["$avgScore", 2] },
              minScore: { $round: ["$minScore", 2] },
              maxScore: { $round: ["$maxScore", 2] },
              totalEvaluations: 1,
              studentCount: { $size: "$uniqueStudents" },
            },
          },
          {
            $sort: { avgScore: -1 },
          },
        ]);
      }

      // Find best and worst performing classes (by branch)
      const bestPerformingClass =
        performanceByClass.length > 0 ? performanceByClass[0] : null;
      const worstPerformingClass =
        performanceByClass.length > 0
          ? performanceByClass[performanceByClass.length - 1]
          : null;

      // Payment statistics
      const paymentStats = await Student.aggregate([
        {
          $group: {
            _id: null,
            totalStudents: { $sum: 1 },
            firstPaymentPaid: {
              $sum: { $cond: ["$firstPayment", 1, 0] },
            },
            secondPaymentPaid: {
              $sum: { $cond: ["$secondPayment", 1, 0] },
            },
            bothPaymentsPaid: {
              $sum: {
                $cond: [{ $and: ["$firstPayment", "$secondPayment"] }, 1, 0],
              },
            },
          },
        },
      ]);

      const paymentBreakdown = paymentStats[0] || {
        totalStudents: 0,
        firstPaymentPaid: 0,
        secondPaymentPaid: 0,
        bothPaymentsPaid: 0,
      };

      res.json({
        success: true,
        data: {
          genderBreakdown: studentGenderBreakdown,
          teacherGenderBreakdown,
          progressByMonth,
          graduationByGrade,
          topSubjects,
          recentActivity,
          teacherPerformance,
          performanceByClass,
          bestPerformingClass,
          worstPerformingClass,
          paymentBreakdown,
          summary: {
            totalStudents,
            totalTeachers: await Teacher.countDocuments({ isActive: true }),
            totalSubjects: await Subject.countDocuments({ isActive: true }),
            totalGrades: await Grade.countDocuments({ isActive: true }),
            totalEvaluations: await Evaluation.countDocuments(),
            totalBranches: await Class.aggregate([
              {
                $match: { isActive: true },
              },
              {
                $project: {
                  branchCount: {
                    $size: {
                      $filter: {
                        input: "$branches",
                        as: "branch",
                        cond: { $eq: ["$$branch.isActive", true] },
                      },
                    },
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: "$branchCount" },
                },
              },
            ]).then((result) => result[0]?.total || 0),
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

// GET available dates for rate changes (dates that have ratings)
router.get(
  "/rate-changes/dates",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const { classId } = req.query;

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: "Please provide classId.",
        });
      }

      // Get ratings collection
      const ratingsCollection = mongoose.connection.db.collection("ratings");

      // Get all students in the class
      const students = await Student.find({ class: classId });
      const studentIds = students.map((s) => s._id);

      if (studentIds.length === 0) {
        return res.json({
          success: true,
          data: {
            dates: [],
          },
        });
      }

      // Get all unique dates from ratings for this class
      const ratings = await ratingsCollection
        .find({
          studentId: { $in: studentIds },
        })
        .toArray();

      // Extract unique dates and normalize them (remove time component)
      const uniqueDates = new Set();
      ratings.forEach((rating) => {
        let dateStr;
        if (rating.date instanceof Date) {
          // If it's already a Date object
          dateStr = rating.date.toISOString().split("T")[0];
        } else if (typeof rating.date === "string") {
          // If it's a string, extract just the date part (YYYY-MM-DD)
          dateStr = rating.date.split("T")[0];
        } else {
          // Fallback: convert to Date and extract
          const date = new Date(rating.date);
          dateStr = date.toISOString().split("T")[0];
        }
        uniqueDates.add(dateStr);
      });

      // Sort dates descending (newest first)
      const sortedDates = Array.from(uniqueDates)
        .sort((a, b) => new Date(b) - new Date(a))
        .map((dateStr) => ({
          date: dateStr,
          display: new Date(dateStr).toLocaleDateString("default", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        }));

      res.json({
        success: true,
        data: {
          dates: sortedDates,
        },
      });
    } catch (error) {
      console.error("Error fetching available dates:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// GET evaluation rate changes by date and class
router.get(
  "/rate-changes",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const { classId, date } = req.query;

      if (!classId || !date) {
        return res.status(400).json({
          success: false,
          message: "Please provide classId and date (YYYY-MM-DD format).",
        });
      }

      // Get ratings collection
      const ratingsCollection = mongoose.connection.db.collection("ratings");

      // Parse selected date (YYYY-MM-DD format) - use the date string directly to avoid timezone issues
      // The date parameter is already in YYYY-MM-DD format from the frontend
      const selectedDateStr = date; // Use the original date string directly (YYYY-MM-DD)
      const [year, month, day] = selectedDateStr.split("-").map(Number);
      const selectedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

      // Rating value mapping for comparison
      const ratingValues = {
        Excellent: 4,
        Good: 3,
        Fair: 2,
        Poor: 1,
      };

      // Get all students in the class
      const students = await Student.find({ class: classId });
      const studentIds = students.map((s) => s._id);

      if (studentIds.length === 0) {
        return res.json({
          success: true,
          data: {
            classId,
            month: parseInt(month),
            year: parseInt(year),
            monthName: selectedDate.toLocaleString("default", {
              month: "long",
            }),
            rateChanges: [],
          },
        });
      }

      // Get ALL ratings for students in this class
      // Note: Some ratings might not have studentClass set, so we filter by studentId
      const allRatings = await ratingsCollection
        .find({
          studentId: { $in: studentIds },
        })
        .sort({ date: 1 }) // Sort by date ascending
        .toArray();

      // Get all unique dates from ratings (normalized to dates only)
      const uniqueDates = new Set();
      allRatings.forEach((rating) => {
        let dateStr;
        if (rating.date instanceof Date) {
          // If it's already a Date object
          dateStr = rating.date.toISOString().split("T")[0];
        } else if (typeof rating.date === "string") {
          // If it's a string, extract just the date part (YYYY-MM-DD)
          dateStr = rating.date.split("T")[0];
        } else {
          // Fallback: convert to Date and extract
          const date = new Date(rating.date);
          dateStr = date.toISOString().split("T")[0];
        }
        uniqueDates.add(dateStr);
      });

      // Use the date string directly (already in YYYY-MM-DD format)
      // Don't convert to Date and back to avoid timezone issues
      const selectedDateObj = new Date(
        Date.UTC(
          parseInt(selectedDateStr.split("-")[0]),
          parseInt(selectedDateStr.split("-")[1]) - 1,
          parseInt(selectedDateStr.split("-")[2])
        )
      );

      // Find the most recent date before selected date (for display purposes)
      const sortedDates = Array.from(uniqueDates)
        .map((d) => new Date(d))
        .sort((a, b) => a - b); // Sort ascending
      const previousDateForDisplay = sortedDates
        .filter((d) => d < selectedDateObj)
        .pop(); // Get the last date before selected date

      // Get all unique subjects from ratings
      const allSubjectIds = new Set();
      allRatings.forEach((r) => {
        if (r.subjectId) {
          const subjectId =
            r.subjectId instanceof mongoose.Types.ObjectId
              ? r.subjectId
              : new mongoose.Types.ObjectId(r.subjectId);
          allSubjectIds.add(subjectId.toString());
        }
      });

      // Get subject details
      const subjects = await Subject.find({
        _id: {
          $in: Array.from(allSubjectIds).map(
            (id) => new mongoose.Types.ObjectId(id)
          ),
        },
      });

      // Calculate changes per subject
      const rateChanges = [];

      for (const subject of subjects) {
        let increased = 0;
        let same = 0;
        let decreased = 0;
        let totalComparisons = 0;
        let skippedNoSelectedDate = 0;
        let skippedNoPreviousDate = 0;

        // Check each student in the class
        for (const studentId of studentIds) {
          // Convert studentId to string for comparison
          const studentIdStr = studentId.toString();
          const subjectIdStr = subject._id.toString();

          // Get all ratings for this student-subject combination
          const studentSubjectRatings = allRatings.filter((r) => {
            const rStudentId =
              r.studentId instanceof mongoose.Types.ObjectId
                ? r.studentId.toString()
                : new mongoose.Types.ObjectId(r.studentId).toString();
            const rSubjectId =
              r.subjectId instanceof mongoose.Types.ObjectId
                ? r.subjectId.toString()
                : new mongoose.Types.ObjectId(r.subjectId).toString();
            return rStudentId === studentIdStr && rSubjectId === subjectIdStr;
          });

          if (studentSubjectRatings.length === 0) continue;

          // Debug: Log all dates for this student-subject
          const allDatesForStudent = studentSubjectRatings.map((r) => {
            let ratingDateStr;
            if (r.date instanceof Date) {
              ratingDateStr = r.date.toISOString().split("T")[0];
            } else if (typeof r.date === "string") {
              ratingDateStr = r.date.split("T")[0];
            } else {
              const date = new Date(r.date);
              ratingDateStr = date.toISOString().split("T")[0];
            }
            return ratingDateStr;
          });

          // Find rating on the selected date
          const ratingOnSelectedDate = studentSubjectRatings.find((r) => {
            let ratingDateStr;
            if (r.date instanceof Date) {
              ratingDateStr = r.date.toISOString().split("T")[0];
            } else if (typeof r.date === "string") {
              ratingDateStr = r.date.split("T")[0];
            } else {
              const date = new Date(r.date);
              ratingDateStr = date.toISOString().split("T")[0];
            }
            return ratingDateStr === selectedDateStr;
          });

          if (!ratingOnSelectedDate) {
            skippedNoSelectedDate++;
            continue; // Skip if no rating on selected date
          }

          // Find rating on the previous date from the collection (specific date, not most recent)
          let ratingOnPreviousDate = null;
          if (previousDateForDisplay) {
            const previousDateStr = previousDateForDisplay
              .toISOString()
              .split("T")[0];
            ratingOnPreviousDate = studentSubjectRatings.find((r) => {
              let ratingDateStr;
              if (r.date instanceof Date) {
                ratingDateStr = r.date.toISOString().split("T")[0];
              } else if (typeof r.date === "string") {
                ratingDateStr = r.date.split("T")[0];
              } else {
                const date = new Date(r.date);
                ratingDateStr = date.toISOString().split("T")[0];
              }
              return ratingDateStr === previousDateStr;
            });

            if (!ratingOnPreviousDate) {
              skippedNoPreviousDate++;
            }
          } else {
            skippedNoPreviousDate++;
          }

          // Compare ratings on the two specific dates from the collection
          if (ratingOnPreviousDate && ratingOnSelectedDate) {
            const previousValue =
              ratingValues[ratingOnPreviousDate.rating] || 0;
            const selectedValue =
              ratingValues[ratingOnSelectedDate.rating] || 0;

            const previousDateStr = previousDateForDisplay
              .toISOString()
              .split("T")[0];

            // If rating on selected date is BETTER than rating on previous date → student improved → increased
            // If rating on selected date is WORSE than rating on previous date → student got worse → decreased
            // If rating on selected date is SAME as rating on previous date → same
            totalComparisons++;
            if (selectedValue > previousValue) {
              increased++;
            } else if (selectedValue === previousValue) {
              same++;
            } else if (selectedValue < previousValue) {
              decreased++;
            }
          }
          // If no rating on previous date or selected date, skip (can't compare)
        }

        // Always add subject, even if counts are 0
        rateChanges.push({
          subjectId: subject._id,
          subjectName: subject.title?.en || subject.title || "Unknown",
          increased,
          same,
          decreased,
          total: increased + same + decreased,
        });
      }

      // Sort by subject name
      rateChanges.sort((a, b) => a.subjectName.localeCompare(b.subjectName));

      res.json({
        success: true,
        data: {
          classId,
          date: date,
          dateDisplay: selectedDate.toLocaleDateString("default", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          previousDate: previousDateForDisplay
            ? previousDateForDisplay.toISOString().split("T")[0]
            : null,
          previousDateDisplay: previousDateForDisplay
            ? previousDateForDisplay.toLocaleDateString("default", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : null,
          rateChanges,
        },
      });
    } catch (error) {
      console.error("Error fetching rate changes:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// GET top performing students
router.get(
  "/top-students",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      // Get all student grades with student information
      const studentGrades = await StudentGrade.find()
        .populate({
          path: "student",
          select: "fullName email class branchID",
          populate: [
            {
              path: "class",
              select: "name",
            },
          ],
        })
        .populate("subject", "title")
        .sort({ createdAt: -1 });

      // Group by student and calculate averages
      const studentStats = {};

      studentGrades.forEach((grade) => {
        const studentId = grade.student?._id?.toString();
        if (!studentId || !grade.student) return;

        if (!studentStats[studentId]) {
          // Store both the class reference and branchID
          const studentClass = grade.student.class;
          const studentBranchId = grade.student.branchID;

          studentStats[studentId] = {
            studentId,
            studentName: grade.student.fullName,
            studentEmail: grade.student.email,
            studentClass: studentClass,
            studentBranchId: studentBranchId,
            grades: [],
          };
        }

        studentStats[studentId].grades.push({
          total: grade.total || 0,
          createdAt: grade.createdAt,
          subject:
            grade.subject?.title?.en || grade.subject?.title || "Unknown",
        });
      });

      // Get all classes to find branch names
      const allClasses = await Class.find().lean();

      // Calculate averages for each student
      const topStudents = Object.values(studentStats)
        .map((stats) => {
          // Calculate overall average
          const overallAvg =
            stats.grades.length > 0
              ? stats.grades.reduce((sum, g) => sum + g.total, 0) /
                stats.grades.length
              : 0;

          // Get class name and branch name
          let className = "Unknown";
          let branchName = "Unknown";

          // Find the class object
          let classObj = null;
          if (stats.studentClass) {
            let classIdToFind = null;
            if (
              typeof stats.studentClass === "object" &&
              stats.studentClass._id
            ) {
              // Already populated
              classIdToFind = stats.studentClass._id.toString();
            } else {
              // Need to extract ID
              classIdToFind = (
                stats.studentClass?._id || stats.studentClass
              )?.toString();
            }

            if (classIdToFind) {
              classObj = allClasses.find(
                (c) => c._id.toString() === classIdToFind
              );
            }
          }

          if (classObj) {
            // Get class name
            className = classObj.name?.en || classObj.name || "Unknown Class";

            // Get branch name
            if (
              stats.studentBranchId &&
              classObj.branches &&
              classObj.branches.length > 0
            ) {
              // Convert branchID to string for comparison
              const branchIdStr =
                stats.studentBranchId?.toString() ||
                (stats.studentBranchId?._id
                  ? stats.studentBranchId._id.toString()
                  : null);

              if (branchIdStr) {
                const branch = classObj.branches.find((b) => {
                  // Handle both ObjectId and string formats
                  const bId =
                    b._id?.toString() ||
                    (b._id?._id ? b._id._id.toString() : null);
                  return bId === branchIdStr;
                });

                if (branch) {
                  branchName =
                    branch.name?.en || branch.name || "Unknown Branch";
                }
              }
            }
          }

          return {
            studentId: stats.studentId,
            studentName: stats.studentName,
            studentEmail: stats.studentEmail,
            className,
            branchName,
            averageScore: Math.round(overallAvg * 100) / 100,
            totalGrades: stats.grades.length,
          };
        })
        .filter((student) => student.totalGrades > 0) // Only students with grades
        .sort((a, b) => b.averageScore - a.averageScore) // Sort by average score descending
        .slice(0, 10); // Top 10

      res.json({
        success: true,
        data: {
          topStudents,
        },
      });
    } catch (error) {
      console.error("Error fetching top students:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// GET worst performing students
router.get(
  "/worst-students",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      // Get all student grades with student information
      const studentGrades = await StudentGrade.find()
        .populate({
          path: "student",
          select: "fullName email class branchID",
          populate: [
            {
              path: "class",
              select: "name",
            },
          ],
        })
        .populate("subject", "title")
        .sort({ createdAt: -1 });

      // Group by student and calculate averages
      const studentStats = {};

      studentGrades.forEach((grade) => {
        const studentId = grade.student?._id?.toString();
        if (!studentId || !grade.student) return;

        if (!studentStats[studentId]) {
          // Store both the class reference and branchID
          const studentClass = grade.student.class;
          const studentBranchId = grade.student.branchID;

          studentStats[studentId] = {
            studentId,
            studentName: grade.student.fullName,
            studentEmail: grade.student.email,
            studentClass: studentClass,
            studentBranchId: studentBranchId,
            grades: [],
          };
        }

        studentStats[studentId].grades.push({
          total: grade.total || 0,
          createdAt: grade.createdAt,
          subject:
            grade.subject?.title?.en || grade.subject?.title || "Unknown",
        });
      });

      // Get all classes to find branch names (with branches populated)
      const allClasses = await Class.find().lean();

      // Calculate averages for each student
      const worstStudents = Object.values(studentStats)
        .map((stats) => {
          // Calculate overall average
          const overallAvg =
            stats.grades.length > 0
              ? stats.grades.reduce((sum, g) => sum + g.total, 0) /
                stats.grades.length
              : 0;

          // Get class name and branch name
          let className = "Unknown";
          let branchName = "Unknown";

          // Find the class object
          let classObj = null;
          if (stats.studentClass) {
            let classIdToFind = null;
            if (
              typeof stats.studentClass === "object" &&
              stats.studentClass._id
            ) {
              // Already populated
              classIdToFind = stats.studentClass._id.toString();
            } else {
              // Need to extract ID
              classIdToFind = (
                stats.studentClass?._id || stats.studentClass
              )?.toString();
            }

            if (classIdToFind) {
              classObj = allClasses.find(
                (c) => c._id.toString() === classIdToFind
              );
            }
          }

          if (classObj) {
            // Get class name
            className = classObj.name?.en || classObj.name || "Unknown Class";

            // Get branch name
            if (
              stats.studentBranchId &&
              classObj.branches &&
              classObj.branches.length > 0
            ) {
              // Convert branchID to string for comparison
              const branchIdStr =
                stats.studentBranchId?.toString() ||
                (stats.studentBranchId?._id
                  ? stats.studentBranchId._id.toString()
                  : null);

              if (branchIdStr) {
                const branch = classObj.branches.find((b) => {
                  // Handle both ObjectId and string formats
                  const bId =
                    b._id?.toString() ||
                    (b._id?._id ? b._id._id.toString() : null);
                  return bId === branchIdStr;
                });

                if (branch) {
                  branchName =
                    branch.name?.en || branch.name || "Unknown Branch";
                }
              }
            }
          }

          return {
            studentId: stats.studentId,
            studentName: stats.studentName,
            studentEmail: stats.studentEmail,
            className,
            branchName,
            averageScore: Math.round(overallAvg * 100) / 100,
            totalGrades: stats.grades.length,
          };
        })
        .filter((student) => student.totalGrades > 0) // Only students with grades
        .sort((a, b) => a.averageScore - b.averageScore) // Sort by average score ascending (worst first)
        .slice(0, 10); // Bottom 10

      res.json({
        success: true,
        data: {
          worstStudents,
        },
      });
    } catch (error) {
      console.error("Error fetching worst students:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Helper function to get all season name variants by order
async function getSeasonVariantsByOrder(order) {
  const season = await Season.findOne({ order: parseInt(order) });
  if (!season) return [];

  const variants = [];
  if (season.name?.en) variants.push(season.name.en);
  if (season.name?.ar) variants.push(season.name.ar);
  if (season.name?.ku) variants.push(season.name.ku);

  // Also include the hardcoded variants from StudentGrade enum
  const hardcodedVariants = {
    1: ["Season 1", "الموسم الأول", "وەرزی یەکەم"],
    2: ["Season 2", "الموسم الثاني", "وەرزی دووەم"],
    3: ["Season 3", "الموسم الثالث", "وەرزی سێیەم"],
    4: ["Season 4", "الموسم الرابع", "وەرزی چوارەم"],
  };

  if (hardcodedVariants[order]) {
    variants.push(...hardcodedVariants[order]);
  }

  return [...new Set(variants)]; // Remove duplicates
}

// Helper function to normalize season input (can be order number or any language variant)
async function normalizeSeason(seasonInput) {
  // If it's a number, treat it as order
  if (!isNaN(seasonInput)) {
    return await getSeasonVariantsByOrder(parseInt(seasonInput));
  }

  // Otherwise, find the season by matching any language variant
  const season = await Season.findOne({
    $or: [
      { "name.en": seasonInput },
      { "name.ar": seasonInput },
      { "name.ku": seasonInput },
    ],
  });

  if (season) {
    return await getSeasonVariantsByOrder(season.order);
  }

  // Fallback: return the input as-is (might be a hardcoded string)
  return [seasonInput];
}

// GET pass rate by subject (filtered by class and season)
router.get(
  "/pass-rate",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const { classId, season } = req.query;

      if (!classId || !season) {
        return res.status(400).json({
          success: false,
          message: "Class ID and season are required",
        });
      }

      // Normalize season to get all language variants
      const seasonVariants = await normalizeSeason(season);

      // Build match criteria - match any variant of the season
      const matchCriteria = { season: { $in: seasonVariants } };

      // If classId is provided, filter students by class
      if (classId) {
        // Get all students in the specified class
        const studentsInClass = await Student.find({
          class: new mongoose.Types.ObjectId(classId),
        }).select("_id");

        const studentIds = studentsInClass.map((s) => s._id);

        matchCriteria.student = { $in: studentIds };
      }

      // Get all grades matching the criteria
      const grades = await StudentGrade.find(matchCriteria)
        .populate("subject", "title")
        .populate({
          path: "student",
          select: "class",
          populate: {
            path: "class",
            select: "name",
          },
        });

      // Group by subject and calculate pass rate
      const subjectStats = {};

      grades.forEach((grade) => {
        const subjectId = grade.subject?._id?.toString();
        if (!subjectId || !grade.subject) return;

        const subjectName =
          grade.subject.title?.en || grade.subject.title || "Unknown Subject";

        if (!subjectStats[subjectId]) {
          subjectStats[subjectId] = {
            subjectId,
            subjectName,
            totalStudents: 0,
            passedStudents: 0,
            passRate: 0,
          };
        }

        subjectStats[subjectId].totalStudents++;
        // Pass threshold: >= 50
        if (grade.total >= 50) {
          subjectStats[subjectId].passedStudents++;
        }
      });

      // Calculate pass rate for each subject
      const passRateData = Object.values(subjectStats).map((stats) => ({
        subjectName: stats.subjectName,
        passRate:
          stats.totalStudents > 0
            ? Math.round((stats.passedStudents / stats.totalStudents) * 100)
            : 0,
        totalStudents: stats.totalStudents,
        passedStudents: stats.passedStudents,
      }));

      // Sort by pass rate descending
      passRateData.sort((a, b) => b.passRate - a.passRate);

      res.json({
        success: true,
        data: {
          passRateData,
        },
      });
    } catch (error) {
      console.error("Error fetching pass rate:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// GET pass rate by grade/class (filtered by season)
router.get(
  "/pass-rate-by-grade",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const { season } = req.query;

      if (!season) {
        return res.status(400).json({
          success: false,
          message: "Season is required",
        });
      }

      // Normalize season to get all language variants
      const seasonVariants = await normalizeSeason(season);

      // Get all grades matching the season
      const grades = await StudentGrade.find({
        season: { $in: seasonVariants },
      })
        .populate("subject", "title")
        .populate({
          path: "student",
          select: "class",
          populate: {
            path: "class",
            select: "name",
          },
        });

      // Group by class and calculate pass rate
      // A student passes if ALL their subjects have total >= 50
      const classStats = {};

      // First, group grades by student
      const studentGradesByClass = {};

      grades.forEach((grade) => {
        const studentId = grade.student?._id?.toString();
        const classId = grade.student?.class?._id?.toString();

        if (!studentId || !classId || !grade.student?.class) return;

        if (!studentGradesByClass[classId]) {
          studentGradesByClass[classId] = {};
        }

        if (!studentGradesByClass[classId][studentId]) {
          studentGradesByClass[classId][studentId] = {
            studentId,
            className:
              grade.student.class.name?.en ||
              grade.student.class.name ||
              "Unknown Class",
            grades: [],
          };
        }

        studentGradesByClass[classId][studentId].grades.push({
          total: grade.total || 0,
        });
      });

      // Calculate pass rate for each class
      Object.keys(studentGradesByClass).forEach((classId) => {
        const students = Object.values(studentGradesByClass[classId]);
        let totalStudents = 0;
        let passedStudents = 0;

        students.forEach((student) => {
          if (student.grades.length === 0) return;

          totalStudents++;

          // Student passes if ALL subjects have total >= 50
          const allPassed = student.grades.every((g) => g.total >= 50);

          if (allPassed) {
            passedStudents++;
          }
        });

        if (totalStudents > 0) {
          const className = students[0]?.className || "Unknown Class";
          classStats[classId] = {
            classId,
            className,
            totalStudents,
            passedStudents,
            passRate: Math.round((passedStudents / totalStudents) * 100),
          };
        }
      });

      // Convert to array and sort by class name
      const passRateByGrade = Object.values(classStats).sort((a, b) => {
        // Sort by class name (extract number if possible)
        const aNum = parseInt(a.className.match(/\d+/)?.[0] || "0");
        const bNum = parseInt(b.className.match(/\d+/)?.[0] || "0");
        return aNum - bNum;
      });

      res.json({
        success: true,
        data: {
          passRateByGrade,
        },
      });
    } catch (error) {
      console.error("Error fetching pass rate by grade:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;
