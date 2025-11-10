const express = require("express");
const router = express.Router();
const Season = require("../models/Season");
const {
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  requireAdmin,
  optionalAuth,
} = require("../middleware/auth");

// GET all seasons (Public - for initial loading)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { lang = "en" } = req.query;
    const seasons = await Season.find().sort({ order: 1 });

    // Transform seasons to include multilingual support
    const seasonsWithLanguage = seasons.map((season) => ({
      ...season.toObject(),
      name: season.name[lang] || season.name.en,
      nameMultilingual: season.name, // Keep original multilingual structure for admin use
    }));

    res.json(seasonsWithLanguage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single season by ID (Public)
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const { lang = "en" } = req.query;
    const season = await Season.findById(req.params.id);
    if (!season) {
      return res.status(404).json({ message: "Season not found" });
    }

    // Transform season to include multilingual support
    const seasonWithLanguage = {
      ...season.toObject(),
      name: season.name[lang] || season.name.en,
      nameMultilingual: season.name, // Keep original multilingual structure for admin use
    };

    res.json(seasonWithLanguage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new season (Teachers and Admins only)
router.post(
  "/",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const season = new Season(req.body);
      const savedSeason = await season.save();
      res.status(201).json(savedSeason);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// PUT update season (Teachers and Admins only)
router.put(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const season = await Season.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!season) {
        return res.status(404).json({ message: "Season not found" });
      }
      res.json(season);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// DELETE season (Admins only)
router.delete(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const season = await Season.findByIdAndDelete(req.params.id);
      if (!season) {
        return res.status(404).json({ message: "Season not found" });
      }
      res.json({ message: "Season deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
