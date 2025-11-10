const express = require("express");
const router = express.Router();
const Class = require("../models/Class");
const {
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  requireAdmin,
  optionalAuth,
} = require("../middleware/auth");

// GET all classes (Public - for initial loading)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { lang = "en" } = req.query;
    const classes = await Class.find().sort({ createdAt: -1 });

    // Add virtual name field based on language
    const classesWithLanguage = classes.map((classData) => ({
      ...classData.toObject(),
      name: classData.name[lang] || classData.name.en,
      nameMultilingual: classData.name, // Keep original multilingual structure for admin use
      branches: classData.branches.map((branch) => ({
        ...branch.toObject(),
        name: branch.name[lang] || branch.name.en,
        nameMultilingual: branch.name, // Keep original multilingual structure for admin use
      })),
    }));

    res.json(classesWithLanguage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single class by ID (Public)
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const { lang = "en" } = req.query;
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Add virtual name field based on language
    const classWithLanguage = {
      ...classData.toObject(),
      name: classData.name[lang] || classData.name.en,
      nameMultilingual: classData.name, // Keep original multilingual structure for admin use
      branches: classData.branches.map((branch) => ({
        ...branch.toObject(),
        name: branch.name[lang] || branch.name.en,
        nameMultilingual: branch.name, // Keep original multilingual structure for admin use
      })),
    };

    res.json(classWithLanguage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET classes with active branches only (Public)
router.get("/active/branches", optionalAuth, async (req, res) => {
  try {
    const { lang = "en" } = req.query;
    const classes = await Class.find({
      isActive: true,
      "branches.isActive": true,
    }).sort({ createdAt: -1 });

    // Add virtual name field based on language
    const classesWithLanguage = classes.map((classData) => ({
      ...classData.toObject(),
      name: classData.name[lang] || classData.name.en,
      nameMultilingual: classData.name, // Keep original multilingual structure for admin use
      branches: classData.branches.map((branch) => ({
        ...branch.toObject(),
        name: branch.name[lang] || branch.name.en,
        nameMultilingual: branch.name, // Keep original multilingual structure for admin use
      })),
    }));

    res.json(classesWithLanguage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new class (Admin only)
router.post(
  "/",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const classData = new Class(req.body);
      const savedClass = await classData.save();
      res.status(201).json(savedClass);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// PUT update class (Admin only)
router.put(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      console.log("Updating class with ID:", req.params.id);
      console.log("Request body:", JSON.stringify(req.body, null, 2));

      const classData = await Class.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }
      res.json(classData);
    } catch (error) {
      console.error("Error updating class:", error);
      res.status(400).json({ message: error.message });
    }
  }
);

// PATCH update class branches (Admin only)
router.patch(
  "/:id/branches",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const { branches } = req.body;
      const classData = await Class.findById(req.params.id);

      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      classData.branches = branches;
      await classData.save();

      res.json(classData);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// DELETE class (Admins only)
router.delete(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const classData = await Class.findByIdAndDelete(req.params.id);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }
      res.json({ message: "Class deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
