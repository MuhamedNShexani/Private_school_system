const mongoose = require("mongoose");

const translationSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  translations: {
    en: {
      type: String,
      required: true,
      trim: true,
    },
    ar: {
      type: String,
      required: true,
      trim: true,
    },
    ku: {
      type: String,
      required: true,
      trim: true,
    },
  },
  category: {
    type: String,
    default: "general",
    enum: [
      "general",
      "navigation",
      "forms",
      "buttons",
      "messages",
      "labels",
      "programs",
      "admin",
      "modal",
      "common",
      "studentProfile",
      "status",
    ],
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
translationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
translationSchema.index({ key: 1 });
translationSchema.index({ category: 1 });
translationSchema.index({ isActive: 1 });

module.exports = mongoose.model("Translation", translationSchema);
