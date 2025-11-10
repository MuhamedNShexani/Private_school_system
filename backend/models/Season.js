const mongoose = require("mongoose");

const seasonSchema = new mongoose.Schema({
  name: {
    en: {
      type: String,
      required: true,
      trim: true,
    },
    ar: {
      type: String,
      trim: true,
    },
    ku: {
      type: String,
      trim: true,
    },
  },
  description: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    required: true,
    unique: true,
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
seasonSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
seasonSchema.index({ "name.en": 1 }, { unique: true });
seasonSchema.index({ order: 1 }, { unique: true });

module.exports = mongoose.model("Season", seasonSchema);
