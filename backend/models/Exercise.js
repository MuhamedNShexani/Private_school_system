const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  part: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Part",
    required: true,
  },
  degree: {
    type: Number,
    required: true,
    default: 10,
    min: 0,
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
exerciseSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
exerciseSchema.index({ part: 1 });
exerciseSchema.index({ isActive: 1 });

module.exports = mongoose.model("Exercise", exerciseSchema);

