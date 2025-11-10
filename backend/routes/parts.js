const express = require("express");
const router = express.Router();
const Part = require("../models/Part");
const {
  verifyToken,
  getCurrentUser,
  requireAdmin,
  optionalAuth,
} = require("../middleware/auth");

// GET all parts (Public - for initial loading)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { chapter, isActive } = req.query;
    const filter = {};

    if (chapter) filter.chapter = chapter;
    if (isActive !== undefined && isActive !== "all") {
      filter.isActive = isActive === "true";
    } else if (isActive === undefined) {
      // Default to active parts only when no isActive parameter is provided
      filter.isActive = true;
    }

    const parts = await Part.find(filter)
      .populate("chapter", "title description season")
      .sort({ order: 1 });

    res.json({
      success: true,
      data: parts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET parts by chapter
router.get("/chapter/:chapterId", optionalAuth, async (req, res) => {
  try {
    const parts = await Part.find({
      chapter: req.params.chapterId,
      isActive: true,
    })
      .populate("chapter", "title description season")
      .sort({ order: 1 });

    res.json({
      success: true,
      data: parts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET single part by ID (Public)
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const part = await Part.findById(req.params.id).populate(
      "chapter",
      "title description season"
    );

    if (!part) {
      return res.status(404).json({
        success: false,
        message: "Part not found",
      });
    }

    res.json({
      success: true,
      data: part,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST create new part (Admin only)
router.post(
  "/",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      console.log("Creating part with data:", req.body);
      const part = new Part(req.body);
      const savedPart = await part.save();
      await savedPart.populate("chapter", "title description season");

      res.status(201).json({
        success: true,
        message: "Part created successfully",
        data: savedPart,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// PUT update part (Admin only)
router.put(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      console.log("Updating part with ID:", req.params.id);
      console.log("Update data:", req.body);
      const part = await Part.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).populate("chapter", "title description season");

      if (!part) {
        return res.status(404).json({
          success: false,
          message: "Part not found",
        });
      }

      res.json({
        success: true,
        message: "Part updated successfully",
        data: part,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// PATCH update part status (Admin only)
router.patch(
  "/:id/status",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const { isActive } = req.body;
      const part = await Part.findByIdAndUpdate(
        req.params.id,
        { isActive },
        { new: true }
      ).populate("chapter", "title description season");

      if (!part) {
        return res.status(404).json({
          success: false,
          message: "Part not found",
        });
      }

      res.json({
        success: true,
        message: `Part ${isActive ? "activated" : "deactivated"} successfully`,
        data: part,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// DELETE part (Admin only)
router.delete(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const part = await Part.findByIdAndDelete(req.params.id);
      if (!part) {
        return res.status(404).json({
          success: false,
          message: "Part not found",
        });
      }

      res.json({
        success: true,
        message: "Part deleted successfully",
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
