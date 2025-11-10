const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  photo: {
    type: String,
    default: null, // URL or path to photo
  },
  specializations: [
    {
      type: String,
      trim: true,
    },
  ],
  subjects: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
  ],
  classes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
  ],
  branches: [
    {
      type: String, // Store branch IDs as strings since they're embedded in Class
    },
  ],
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  experience: {
    type: Number,
    default: 0,
    min: 0,
  },
  employeeNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ["Male", "Female", "Other"],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  joinedDate: {
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
teacherSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
teacherSchema.index({ name: 1 });
teacherSchema.index({ employeeNumber: 1 });
teacherSchema.index({ email: 1 });
teacherSchema.index({ username: 1 });
teacherSchema.index({ isActive: 1 });
teacherSchema.index({ specializations: 1 });
teacherSchema.index({ classes: 1 });
teacherSchema.index({ branches: 1 });

module.exports = mongoose.model("Teacher", teacherSchema);
