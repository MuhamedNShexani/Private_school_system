const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
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
  branches: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
      },
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
        trim: true,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    },
  ],
  sort: {
    type: Number,
    default: 0,
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
classSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
classSchema.index({ "name.en": 1 });
classSchema.index({ "branches.name.en": 1 });

module.exports = mongoose.model("Class", classSchema);
