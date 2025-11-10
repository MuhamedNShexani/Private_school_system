const mongoose = require("mongoose");

const evaluationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject", // Updated to reference Subject model
    required: true,
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Season", // Updated to reference Season model
    required: true,
  },
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chapter", // Updated to reference Chapter model
    required: true,
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Part", // Updated to reference Part model
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
  },
  maxScore: {
    type: Number,
    required: true,
    min: 1,
  },
  evaluationType: {
    type: String,
    enum: ["Quiz", "Assignment", "Exam", "Project", "Participation", "Other"],
    default: "Quiz",
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  evaluationDate: {
    type: Date,
    default: Date.now,
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
evaluationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
evaluationSchema.index({ student: 1 });
evaluationSchema.index({ course: 1 });
evaluationSchema.index({ semester: 1 });
evaluationSchema.index({ unit: 1 });
evaluationSchema.index({ topic: 1 });
evaluationSchema.index({ teacher: 1 });
evaluationSchema.index({ evaluationDate: -1 });
evaluationSchema.index({ student: 1, course: 1 });
evaluationSchema.index({ student: 1, topic: 1 });
evaluationSchema.index({ topic: 1, evaluationDate: -1 });

// Virtual for percentage score
evaluationSchema.virtual("percentage").get(function () {
  return Math.round((this.score / this.maxScore) * 100);
});

// Ensure virtual fields are serialized
evaluationSchema.set("toJSON", {
  virtuals: true,
});

module.exports = mongoose.model("Evaluation", evaluationSchema);
