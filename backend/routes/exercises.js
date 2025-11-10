const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Exercise = require("../models/Exercise");
const Part = require("../models/Part");
const Chapter = require("../models/Chapter");
const {
  verifyToken,
  getCurrentUser,
  requireAdmin,
  optionalAuth,
} = require("../middleware/auth");

// Helper function to get total points for a season
const getSeasonTotalPoints = async (seasonName) => {
  try {
    // Find all chapters in this season
    const chapters = await Chapter.find({ season: seasonName });
    const chapterIds = chapters.map(ch => ch._id);
    
    // Find all parts in these chapters
    const parts = await Part.find({ chapter: { $in: chapterIds } });
    const partIds = parts.map(p => p._id);
    
    // Calculate total points from all exercises in these parts
    const result = await Exercise.aggregate([
      {
        $match: {
          part: { $in: partIds },
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: "$degree" }
        }
      }
    ]);
    
    return result.length > 0 ? result[0].totalPoints : 0;
  } catch (error) {
    console.error("Error calculating season total points:", error);
    return 0;
  }
};

// GET all exercises (Public - for initial loading)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { part, isActive } = req.query;
    const filter = {};

    if (part) filter.part = part;
    if (isActive !== undefined && isActive !== "all") {
      filter.isActive = isActive === "true";
    } else if (isActive === undefined) {
      // Default to active exercises only when no isActive parameter is provided
      filter.isActive = true;
    }

    const exercises = await Exercise.find(filter)
      .populate("part", "title description")
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: exercises,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET exercises by part
router.get("/part/:partId", optionalAuth, async (req, res) => {
  try {
    const exercises = await Exercise.find({
      part: req.params.partId,
      isActive: true,
    })
      .populate("part", "title description")
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: exercises,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET single exercise by ID (Public)
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id).populate(
      "part",
      "title description"
    );

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Exercise not found",
      });
    }

    res.json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST create new exercise (Admin only)
router.post(
  "/",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      console.log("Creating exercise with data:", req.body);
      
      // Get the part and find its chapter to get the season
      const part = await Part.findById(req.body.part);
      if (!part) {
        return res.status(404).json({
          success: false,
          message: "Part not found",
        });
      }
      
      // Get the season from the chapter
      const chapter = await Chapter.findById(part.chapter);
      if (!chapter) {
        return res.status(404).json({
          success: false,
          message: "Chapter not found",
        });
      }
      
      // Calculate current total points for this season
      const currentTotal = await getSeasonTotalPoints(chapter.season);
      const newPoints = req.body.degree || 10;
      
      // Check if adding this exercise would exceed the limit
      if (currentTotal + newPoints > 10) {
        return res.status(400).json({
          success: false,
          message: `Cannot create exercise. Total points for season would exceed 10. Current total: ${currentTotal}, Adding: ${newPoints}`,
        });
      }
      
      const exercise = new Exercise(req.body);
      const savedExercise = await exercise.save();
      await savedExercise.populate("part", "title description");

      res.status(201).json({
        success: true,
        message: "Exercise created successfully",
        data: savedExercise,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// PUT update exercise (Admin only)
router.put(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      console.log("Updating exercise with ID:", req.params.id);
      console.log("Update data:", req.body);
      
      // Get the existing exercise to check its current degree and part
      const existingExercise = await Exercise.findById(req.params.id);
      if (!existingExercise) {
        return res.status(404).json({
          success: false,
          message: "Exercise not found",
        });
      }
      
      // Get the part and find its chapter to get the season
      const part = await Part.findById(existingExercise.part);
      if (!part) {
        return res.status(404).json({
          success: false,
          message: "Part not found",
        });
      }
      
      // Get the season from the chapter
      const chapter = await Chapter.findById(part.chapter);
      if (!chapter) {
        return res.status(404).json({
          success: false,
          message: "Chapter not found",
        });
      }
      
      // If degree is being updated, validate the total
      if (req.body.degree !== undefined) {
        // Calculate current total points for this season
        const currentTotal = await getSeasonTotalPoints(chapter.season);
        const oldPoints = existingExercise.degree || 0;
        const newPoints = req.body.degree || 0;
        
        // Check if updating this exercise would exceed the limit
        const updatedTotal = currentTotal - oldPoints + newPoints;
        if (updatedTotal > 10) {
          return res.status(400).json({
            success: false,
            message: `Cannot update exercise. Total points for season would exceed 10. Current total: ${currentTotal}, Old points: ${oldPoints}, New points: ${newPoints}, Result: ${updatedTotal}`,
          });
        }
      }
      
      const exercise = await Exercise.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).populate("part", "title description");

      res.json({
        success: true,
        message: "Exercise updated successfully",
        data: exercise,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// PATCH update exercise status (Admin only)
router.patch(
  "/:id/status",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const { isActive } = req.body;
      const exercise = await Exercise.findByIdAndUpdate(
        req.params.id,
        { isActive },
        { new: true }
      ).populate("part", "title description");

      if (!exercise) {
        return res.status(404).json({
          success: false,
          message: "Exercise not found",
        });
      }

      res.json({
        success: true,
        message: `Exercise ${isActive ? "activated" : "deactivated"} successfully`,
        data: exercise,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// DELETE exercise (Admin only)
router.delete(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const exercise = await Exercise.findByIdAndDelete(req.params.id);
      if (!exercise) {
        return res.status(404).json({
          success: false,
          message: "Exercise not found",
        });
      }

      res.json({
        success: true,
        message: "Exercise deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// GET total points for a season (Public)
router.get("/season/:seasonName/total-points", optionalAuth, async (req, res) => {
  try {
    const { seasonName } = req.params;
    const totalPoints = await getSeasonTotalPoints(seasonName);
    
    res.json({
      success: true,
      data: {
        season: seasonName,
        totalPoints,
        remainingPoints: 10 - totalPoints,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;

