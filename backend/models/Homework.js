const mongoose = require("mongoose");

const homeworkSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  assignedStudents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
  ],
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
homeworkSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for efficient queries
homeworkSchema.index({ classId: 1, branchId: 1 });
homeworkSchema.index({ subjectId: 1 });
homeworkSchema.index({ date: 1 });
homeworkSchema.index({ assignedStudents: 1 });

module.exports = mongoose.model("Homework", homeworkSchema);

