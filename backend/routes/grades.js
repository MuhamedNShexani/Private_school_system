const express = require("express");
const router = express.Router();
const Grade = require("../models/Grade");
const {
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  requireAdmin,
  optionalAuth,
} = require("../middleware/auth");

// GET all grades (Public - for initial loading)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const grades = await Grade.find({ isActive: true }).sort({ level: 1 });
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

// GET single grade by ID (Public)
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);
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

// POST create new grade (Teachers and Admins only)
router.post(
  "/",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const grade = new Grade(req.body);
      const savedGrade = await grade.save();
      res.status(201).json({
        success: true,
        message: "Grade created successfully",
        data: savedGrade,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// PUT update grade (Teachers and Admins only)
router.put(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const grade = await Grade.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!grade) {
        return res.status(404).json({
          success: false,
          message: "Grade not found",
        });
      }
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

// PATCH update grade status (Teachers and Admins only)
router.patch(
  "/:id/status",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const { isActive } = req.body;
      const grade = await Grade.findByIdAndUpdate(
        req.params.id,
        { isActive },
        { new: true }
      );

      if (!grade) {
        return res.status(404).json({
          success: false,
          message: "Grade not found",
        });
      }
      res.json({
        success: true,
        message: `Grade ${isActive ? "activated" : "deactivated"} successfully`,
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

// DELETE grade (Admins only)
router.delete(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const grade = await Grade.findByIdAndDelete(req.params.id);
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
