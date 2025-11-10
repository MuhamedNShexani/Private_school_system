const express = require("express");
const router = express.Router();
const Chapter = require("../models/Chapter");
const {
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  requireAdmin,
  optionalAuth,
} = require("../middleware/auth");

// GET all chapters (Public - for initial loading)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const chapters = await Chapter.find()
      .populate("subject", "title description")
      .sort({ order: 1 });
    res.json(chapters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET chapters by season (Public)
router.get("/season/:seasonName", optionalAuth, async (req, res) => {
  try {
    const chapters = await Chapter.find({ season: req.params.seasonName })
      .populate("subject", "title description")
      .sort({ order: 1 });
    res.json(chapters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single chapter by ID (Public)
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id).populate(
      "subject",
      "title description"
    );
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }
    res.json(chapter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new chapter (Teachers and Admins only)
router.post(
  "/",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const chapter = new Chapter(req.body);
      const savedChapter = await chapter.save();
      await savedChapter.populate("subject", "title description");
      res.status(201).json(savedChapter);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// PUT update chapter (Teachers and Admins only)
router.put(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).populate("subject", "title description");

      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      res.json(chapter);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// DELETE chapter (Admins only)
router.delete(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const chapter = await Chapter.findByIdAndDelete(req.params.id);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      res.json({ message: "Chapter deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
