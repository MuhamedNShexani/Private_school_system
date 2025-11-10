const mongoose = require("mongoose");

const partSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chapter",
    required: true,
  },
  order: {
    type: Number,
    required: true,
    min: 1,
  },
  learningObjectives: [
    {
      type: String,
      trim: true,
    },
  ],
  resources: [
    {
      title: String,
      url: String,
      type: {
        type: String,
        enum: ["Video", "Document", "Link", "Exercise"],
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
});

// Update the updatedAt field before saving
partSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
partSchema.index({ chapter: 1, order: 1 });
partSchema.index({ title: 1 });
partSchema.index({ isActive: 1 });

module.exports = mongoose.model("Part", partSchema);
