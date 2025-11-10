const express = require("express");
const router = express.Router();
const Subject = require("../models/Subject");
const {
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  requireAdmin,
  optionalAuth,
} = require("../middleware/auth");

// GET all subjects (Public - for initial loading)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { lang = "en" } = req.query;
    const subjects = await Subject.find()
      .populate("class", "name branches")
      .sort({ order: 1 });

    // Transform subjects to include multilingual support
    const subjectsWithLanguage = subjects.map((subject) => ({
      ...subject.toObject(),
      title: subject.title[lang] || subject.title.en,
      titleMultilingual: subject.title, // Keep original multilingual structure for admin use
      class: subject.class
        ? {
            ...subject.class.toObject(),
            name: subject.class.name[lang] || subject.class.name.en,
            nameMultilingual: subject.class.name,
            branches:
              subject.class.branches?.map((branch) => ({
                ...branch.toObject(),
                name: branch.name[lang] || branch.name.en,
                nameMultilingual: branch.name,
              })) || [],
          }
        : subject.class,
    }));

    res.json(subjectsWithLanguage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET subjects by class ID (Public)
router.get("/class/:classId", optionalAuth, async (req, res) => {
  try {
    const { lang = "en" } = req.query;
    const subjects = await Subject.find({ class: req.params.classId })
      .populate("class", "name branches")
      .sort({ order: 1 });

    // Transform subjects to include multilingual support
    const subjectsWithLanguage = subjects.map((subject) => ({
      ...subject.toObject(),
      title: subject.title[lang] || subject.title.en,
      titleMultilingual: subject.title, // Keep original multilingual structure for admin use
      class: subject.class
        ? {
            ...subject.class.toObject(),
            name: subject.class.name[lang] || subject.class.name.en,
            nameMultilingual: subject.class.name,
            branches:
              subject.class.branches?.map((branch) => ({
                ...branch.toObject(),
                name: branch.name[lang] || branch.name.en,
                nameMultilingual: branch.name,
              })) || [],
          }
        : subject.class,
    }));

    res.json(subjectsWithLanguage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET subjects by chapter (Public) - This route is no longer needed since subjects don't link to chapters
router.get("/chapter/:chapterId", optionalAuth, async (req, res) => {
  try {
    res.json([]); // Return empty array since subjects no longer link to chapters
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single subject by ID (Public)
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const { lang = "en" } = req.query;
    const subject = await Subject.findById(req.params.id).populate(
      "class",
      "name branches"
    );
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Transform subject to include multilingual support
    const subjectWithLanguage = {
      ...subject.toObject(),
      title: subject.title[lang] || subject.title.en,
      titleMultilingual: subject.title, // Keep original multilingual structure for admin use
      class: subject.class
        ? {
            ...subject.class.toObject(),
            name: subject.class.name[lang] || subject.class.name.en,
            nameMultilingual: subject.class.name,
            branches:
              subject.class.branches?.map((branch) => ({
                ...branch.toObject(),
                name: branch.name[lang] || branch.name.en,
                nameMultilingual: branch.name,
              })) || [],
          }
        : subject.class,
    };

    res.json(subjectWithLanguage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new subject (Teachers and Admins only)
router.post(
  "/",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const subject = new Subject(req.body);
      const savedSubject = await subject.save();
      await savedSubject.populate("class", "name branches");
      res.status(201).json(savedSubject);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// PUT update subject (Teachers and Admins only)
router.put(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).populate("class", "name branches");

      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// DELETE subject (Admins only)
router.delete(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const subject = await Subject.findByIdAndDelete(req.params.id);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json({ message: "Subject deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
