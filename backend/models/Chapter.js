const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  season: {
    type: String,
    required: true,
    enum: [
      // English
      "Season 1",
      "Season 2",
      "Season 3",
      "Season 4",
      // Arabic
      "الموسم الأول",
      "الموسم الثاني",
      "الموسم الثالث",
      "الموسم الرابع",
      // Kurdish
      "وەرزی یەکەم",
      "وەرزی دووەم",
      "وەرزی سێیەم",
      "وەرزی چوارەم",
    ],
    default: "Season 1",
  },
  order: {
    type: Number,
    required: true,
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
chapterSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
chapterSchema.index({ subject: 1, order: 1 });
chapterSchema.index({ subject: 1, season: 1 });

module.exports = mongoose.model("Chapter", chapterSchema);
