const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const studentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  parentsNumber: {
    type: String,
    trim: true,
  },
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  branchID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ["Male", "Female"],
  },
  photo: {
    type: String,
    default: null, // URL or path to photo
  },
  studentNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  status: {
    type: mongoose.Schema.Types.Mixed, // Object to store status for each subject
    default: {},
  },
  firstPayment: {
    type: Boolean,
    default: false,
  },
  firstPaymentDate: {
    type: Date,
    default: null,
  },
  secondPayment: {
    type: Boolean,
    default: false,
  },
  secondPaymentDate: {
    type: Date,
    default: null,
  },
  ratings: [
    {
      subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
      season: String,
      date: Date,
      rating: String, // e.g., "Excellent", "Good", "Fair", "Poor"
      ratedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  homeworks: [
    {
      subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
      date: Date,
      description: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
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

// Hash password before saving (if it was modified and is not already hashed)
studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update the updatedAt field before saving
studentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
studentSchema.index({ class: 1 });
studentSchema.index({ branchID: 1 });
studentSchema.index({ fullName: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ username: 1 });

module.exports = mongoose.model("Student", studentSchema);
