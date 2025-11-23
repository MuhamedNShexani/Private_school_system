const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    title: {
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
    },
    content: {
      type: String,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    estimatedTime: {
      type: Number, // in minutes
      default: 30,
    },
    exercises: [
      {
        question: {
          type: String,
          required: true,
        },
        options: [String],
        correctAnswer: {
          type: String,
          required: true,
        },
        explanation: String,
        points: {
          type: Number,
          default: 10,
        },
      },
    ],
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
  },
  { strict: false }
);

// Update the updatedAt field before saving
subjectSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
subjectSchema.index({ class: 1 });
subjectSchema.index({ order: 1 });
subjectSchema.index({ "title.en": 1 });

module.exports = mongoose.model("Subject", subjectSchema);
