const express = require("express");
const router = express.Router();
const StudentGrade = require("../models/StudentGrade");
const {
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  requireAdmin,
  optionalAuth,
} = require("../middleware/auth");

// GET all student grades (Teachers and Admins only)
router.get(
  "/",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const { studentId, subjectId, season } = req.query;
      const filter = {};

      if (studentId) filter.student = studentId;
      if (subjectId) filter.subject = subjectId;
      if (season) filter.season = season;

      const grades = await StudentGrade.find(filter)
        .populate("student", "fullName username studentNumber")
        .populate("subject", "title")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: grades,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// GET grades by student ID
router.get("/student/:studentId", optionalAuth, async (req, res) => {
  try {
    const grades = await StudentGrade.find({ student: req.params.studentId })
      .populate("subject", "title")
      .sort({ season: 1, createdAt: -1 });

    res.json({
      success: true,
      data: grades,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET single grade by ID
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const grade = await StudentGrade.findById(req.params.id)
      .populate("student", "fullName username studentNumber")
      .populate("subject", "title");

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: "Grade not found",
      });
    }

    res.json({
      success: true,
      data: grade,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST create or update student grade (Teachers and Admins only)
router.post(
  "/",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const { student, subject, season, season_exam, exercises, attendance, behaviour, monthly_exam, notes } = req.body;

      // Validate required fields
      if (!student || !subject || !season) {
        return res.status(400).json({
          success: false,
          message: "Student, subject, and season are required",
        });
      }

      // Check if grade already exists for this student-subject-season combination
      let grade = await StudentGrade.findOne({
        student,
        subject,
        season,
      });

      if (grade) {
        // Update existing grade
        grade.season_exam = season_exam !== undefined ? season_exam : grade.season_exam;
        grade.exercises = exercises !== undefined ? exercises : grade.exercises;
        grade.attendance = attendance !== undefined ? attendance : grade.attendance;
        grade.behaviour = behaviour !== undefined ? behaviour : grade.behaviour;
        if (monthly_exam !== undefined) {
          grade.monthly_exam = Array.isArray(monthly_exam) ? monthly_exam : [monthly_exam];
        }
        if (notes !== undefined) {
          grade.notes = notes;
        }
        await grade.save();
      } else {
        // Create new grade
        grade = new StudentGrade({
          student,
          subject,
          season,
          season_exam: season_exam || 0,
          exercises: exercises || 0,
          attendance: attendance || 0,
          behaviour: behaviour || 0,
          monthly_exam: Array.isArray(monthly_exam) ? monthly_exam : monthly_exam ? [monthly_exam] : [],
          notes: notes || "",
        });
        await grade.save();
      }

      await grade.populate("student", "fullName username studentNumber");
      await grade.populate("subject", "title");

      res.status(grade.isNew ? 201 : 200).json({
        success: true,
        message: grade.isNew ? "Grade created successfully" : "Grade updated successfully",
        data: grade,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// PUT update student grade (Teachers and Admins only)
router.put(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const { season_exam, exercises, attendance, behaviour, monthly_exam, notes } = req.body;

      const grade = await StudentGrade.findById(req.params.id);

      if (!grade) {
        return res.status(404).json({
          success: false,
          message: "Grade not found",
        });
      }

      if (season_exam !== undefined) grade.season_exam = season_exam;
      if (exercises !== undefined) grade.exercises = exercises;
      if (attendance !== undefined) grade.attendance = attendance;
      if (behaviour !== undefined) grade.behaviour = behaviour;
      if (monthly_exam !== undefined) {
        grade.monthly_exam = Array.isArray(monthly_exam) ? monthly_exam : [monthly_exam];
      }
      if (notes !== undefined) grade.notes = notes;

      await grade.save();

      await grade.populate("student", "fullName username studentNumber");
      await grade.populate("subject", "title");

      res.json({
        success: true,
        message: "Grade updated successfully",
        data: grade,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// DELETE grade (Teachers and Admins only)
router.delete(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const grade = await StudentGrade.findByIdAndDelete(req.params.id);

      if (!grade) {
        return res.status(404).json({
          success: false,
          message: "Grade not found",
        });
      }

      res.json({
        success: true,
        message: "Grade deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;

