const express = require("express");
const router = express.Router();
const Evaluation = require("../models/Evaluation");
const {
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  requireAdmin,
  optionalAuth,
} = require("../middleware/auth");

// GET all evaluations (Teachers and Admins only)
router.get(
  "/",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const { student, course, teacher, page = 1, limit = 10 } = req.query;
      const filter = {};

      if (student) filter.student = student;
      if (course) filter.course = course;
      if (teacher) filter.teacher = teacher;

      const evaluations = await Evaluation.find(filter)
        .populate("student", "fullName studentNumber")
        .populate("course", "title description")
        .populate("semester", "name description")
        .populate("unit", "title description")
        .populate("topic", "title description")
        .populate("teacher", "name")
        .sort({ evaluationDate: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Evaluation.countDocuments(filter);

      res.json({
        success: true,
        data: {
          evaluations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// GET evaluations by student (for student profile)
router.get(
  "/student/:studentId",
  verifyToken,
  getCurrentUser,
  async (req, res) => {
    try {
      const { studentId } = req.params;

      // Check if user is the student, teacher, or admin
      const isStudent =
        req.user.role === "Student" && req.user._id.toString() === studentId;
      const isTeacherOrAdmin = ["Teacher", "Admin"].includes(req.user.role);

      if (!isStudent && !isTeacherOrAdmin) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const evaluations = await Evaluation.find({ student: studentId })
        .populate("course", "title description")
        .populate("semester", "name description")
        .populate("unit", "title description")
        .populate("topic", "title description")
        .populate("teacher", "name")
        .sort({ evaluationDate: -1 });

      res.json({
        success: true,
        data: evaluations,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// GET evaluations by course
router.get(
  "/course/:courseId",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const evaluations = await Evaluation.find({ course: req.params.courseId })
        .populate("student", "fullName studentNumber")
        .populate("teacher", "name")
        .sort({ evaluationDate: -1 });

      res.json({
        success: true,
        data: evaluations,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// GET single evaluation by ID
router.get(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const evaluation = await Evaluation.findById(req.params.id)
        .populate("student", "fullName studentNumber")
        .populate("course", "title description")
        .populate("teacher", "name");

      if (!evaluation) {
        return res.status(404).json({
          success: false,
          message: "Evaluation not found",
        });
      }

      res.json({
        success: true,
        data: evaluation,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// POST create new evaluation (Teachers and Admins only)
router.post(
  "/",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      console.log("Creating evaluation with data:", req.body);
      // Set the teacher to the current user if not specified
      const evaluationData = {
        ...req.body,
        teacher: req.body.teacher || req.user._id,
      };
      console.log("Processed evaluation data:", evaluationData);

      const evaluation = new Evaluation(evaluationData);
      const savedEvaluation = await evaluation.save();

      await savedEvaluation.populate("student", "fullName studentNumber");
      await savedEvaluation.populate("course", "title description");
      await savedEvaluation.populate("semester", "name description");
      await savedEvaluation.populate("unit", "title description");
      await savedEvaluation.populate("topic", "title description");
      await savedEvaluation.populate("teacher", "name");

      res.status(201).json({
        success: true,
        message: "Evaluation created successfully",
        data: savedEvaluation,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// PUT update evaluation (Teachers and Admins only)
router.put(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      console.log("Updating evaluation with ID:", req.params.id);
      console.log("Update data:", req.body);
      const evaluation = await Evaluation.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate("student", "fullName studentNumber")
        .populate("course", "title description")
        .populate("semester", "name description")
        .populate("unit", "title description")
        .populate("topic", "title description")
        .populate("teacher", "name");

      if (!evaluation) {
        return res.status(404).json({
          success: false,
          message: "Evaluation not found",
        });
      }

      res.json({
        success: true,
        message: "Evaluation updated successfully",
        data: evaluation,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// DELETE evaluation (Admins only)
router.delete(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const evaluation = await Evaluation.findByIdAndDelete(req.params.id);
      if (!evaluation) {
        return res.status(404).json({
          success: false,
          message: "Evaluation not found",
        });
      }
      res.json({
        success: true,
        message: "Evaluation deleted successfully",
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
