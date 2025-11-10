const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please enter a valid email",
    ],
  },
  username: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["Admin", "Teacher", "Student"],
    default: "Student",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  profilePicture: {
    type: String,
    default: null,
  },
  // Additional fields based on role
  studentProfile: {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
    branchID: {
      type: mongoose.Schema.Types.ObjectId,
    },
    studentNumber: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    parentsNumber: {
      type: String,
      trim: true,
    },
  },
  teacherProfile: {
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
    employeeNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  adminProfile: {
    permissions: [
      {
        type: String,
        enum: [
          "manage_users",
          "manage_classes",
          "manage_subjects",
          "manage_seasons",
          "manage_chapters",
          "view_analytics",
        ],
      },
    ],
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

// Hash password before saving
userSchema.pre("save", async function (next) {
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
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  },
});

// Indexes for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ "studentProfile.studentNumber": 1 });
userSchema.index({ "teacherProfile.employeeNumber": 1 });

module.exports = mongoose.model("User", userSchema);
