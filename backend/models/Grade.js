const mongoose = require("mongoose");

const gradeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  level: {
    type: Number,
    required: true,
    unique: true,
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
gradeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
gradeSchema.index({ name: 1 });
gradeSchema.index({ level: 1 });
gradeSchema.index({ isActive: 1 });

module.exports = mongoose.model("Grade", gradeSchema);
