const express = require("express");
const router = express.Router();
const Translation = require("../models/Translation");
const {
  verifyToken,
  getCurrentUser,
  requireAdmin,
  optionalAuth,
} = require("../middleware/auth");

// GET all translations (Public - for frontend)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { category, language } = req.query;
    const filter = { isActive: true };
    
    if (category && category !== "all") {
      filter.category = category;
    }

    const translations = await Translation.find(filter).sort({ key: 1 });
    
    // If language is specified, return only that language's translations
    if (language && ["en", "ar", "ku"].includes(language)) {
      const languageTranslations = {};
      translations.forEach(translation => {
        languageTranslations[translation.key] = translation.translations[language];
      });
      return res.json({
        success: true,
        data: languageTranslations,
      });
    }

    res.json({
      success: true,
      data: translations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET translations by category (Public)
router.get("/category/:category", optionalAuth, async (req, res) => {
  try {
    const { category } = req.params;
    const { language } = req.query;
    
    const translations = await Translation.find({ 
      category, 
      isActive: true 
    }).sort({ key: 1 });
    
    if (language && ["en", "ar", "ku"].includes(language)) {
      const languageTranslations = {};
      translations.forEach(translation => {
        languageTranslations[translation.key] = translation.translations[language];
      });
      return res.json({
        success: true,
        data: languageTranslations,
      });
    }

    res.json({
      success: true,
      data: translations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET single translation by key (Public)
router.get("/key/:key", optionalAuth, async (req, res) => {
  try {
    const { key } = req.params;
    const translation = await Translation.findOne({ key, isActive: true });
    
    if (!translation) {
      return res.status(404).json({
        success: false,
        message: "Translation not found",
      });
    }

    res.json({
      success: true,
      data: translation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET all translations for admin management (Admin only)
router.get("/admin/all", verifyToken, getCurrentUser, requireAdmin, async (req, res) => {
  try {
    const { category, page = 1, limit = 50, search } = req.query;
    const filter = {};
    
    if (category && category !== "all") {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { key: { $regex: search, $options: "i" } },
        { "translations.en": { $regex: search, $options: "i" } },
        { "translations.ar": { $regex: search, $options: "i" } },
        { "translations.ku": { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    
    const translations = await Translation.find(filter)
      .sort({ category: 1, key: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Translation.countDocuments(filter);

    res.json({
      success: true,
      data: translations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST create new translation (Admin only)
router.post("/", verifyToken, getCurrentUser, requireAdmin, async (req, res) => {
  try {
    const translation = new Translation(req.body);
    const savedTranslation = await translation.save();
    
    res.status(201).json({
      success: true,
      data: savedTranslation,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// PUT update translation (Admin only)
router.put("/:id", verifyToken, getCurrentUser, requireAdmin, async (req, res) => {
  try {
    const translation = await Translation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!translation) {
      return res.status(404).json({
        success: false,
        message: "Translation not found",
      });
    }

    res.json({
      success: true,
      data: translation,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// PUT update translation by key (Admin only)
router.put("/key/:key", verifyToken, getCurrentUser, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const translation = await Translation.findOneAndUpdate(
      { key },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!translation) {
      return res.status(404).json({
        success: false,
        message: "Translation not found",
      });
    }

    res.json({
      success: true,
      data: translation,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// PATCH update translation status (Admin only)
router.patch("/:id/status", verifyToken, getCurrentUser, requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const translation = await Translation.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );
    
    if (!translation) {
      return res.status(404).json({
        success: false,
        message: "Translation not found",
      });
    }

    res.json({
      success: true,
      data: translation,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// DELETE translation (Admin only)
router.delete("/:id", verifyToken, getCurrentUser, requireAdmin, async (req, res) => {
  try {
    const translation = await Translation.findByIdAndDelete(req.params.id);
    
    if (!translation) {
      return res.status(404).json({
        success: false,
        message: "Translation not found",
      });
    }

    res.json({
      success: true,
      message: "Translation deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET translation categories (Admin only)
router.get("/admin/categories", verifyToken, getCurrentUser, requireAdmin, async (req, res) => {
  try {
    const categories = await Translation.distinct("category");
    
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
