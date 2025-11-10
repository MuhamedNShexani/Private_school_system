const express = require("express");
const router = express.Router();
const User = require("../models/User");
const {
  generateToken,
  verifyToken,
  getCurrentUser,
  requireAdmin,
  requireTeacherOrAdmin,
} = require("../middleware/auth");

// Register new user
router.post("/register", async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      studentNumber,
      employeeNumber,
      classId,
      branchID,
      subjects,
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide email, password, firstName, lastName, and role.",
      });
    }

    // Validate role
    if (!["Admin", "Teacher", "Student"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be Admin, Teacher, or Student.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    // Create user object
    const userData = {
      email,
      password,
      firstName,
      lastName,
      role,
    };

    // Add role-specific data
    if (role === "Student") {
      userData.studentProfile = {
        studentNumber,
        class: classId,
        branchID,
      };
    } else if (role === "Teacher") {
      userData.teacherProfile = {
        employeeNumber,
        subjects: subjects || [],
      };
    } else if (role === "Admin") {
      userData.adminProfile = {
        permissions: [
          "manage_users",
          "manage_classes",
          "manage_subjects",
          "manage_seasons",
          "manage_chapters",
          "view_analytics",
        ],
      };
    }

    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data (password excluded by model toJSON transform)
    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Error registering user.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: email }, { username: email }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password.",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact administrator.",
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful.",
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Error during login.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get current user profile
router.get("/me", verifyToken, getCurrentUser, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

// Update user profile
router.put("/me", verifyToken, getCurrentUser, async (req, res) => {
  try {
    const { firstName, lastName, profilePicture } = req.body;
    const allowedUpdates = { firstName, lastName, profilePicture };

    // Remove undefined values
    Object.keys(allowedUpdates).forEach((key) => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.userId, allowedUpdates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Change password
router.put(
  "/change-password",
  verifyToken,
  getCurrentUser,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Please provide current password and new password.",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long.",
        });
      }

      const user = await User.findById(req.userId);
      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );

      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect.",
        });
      }

      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: "Password changed successfully.",
      });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({
        success: false,
        message: "Error changing password.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Logout (client-side token removal)
router.post("/logout", verifyToken, (req, res) => {
  // Since we're using JWT, logout is handled client-side by removing the token
  // We could implement a token blacklist here for more security if needed
  res.json({
    success: true,
    message: "Logged out successfully.",
  });
});

// Admin routes for user management
router.get(
  "/users",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const { role, isActive, page = 1, limit = 10 } = req.query;
      const filter = {};

      if (role) filter.role = role;
      if (isActive !== undefined) filter.isActive = isActive === "true";

      const users = await User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await User.countDocuments(filter);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching users.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Activate/Deactivate user (Admin only)
router.put(
  "/users/:userId/status",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be a boolean value.",
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { isActive },
        { new: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      res.json({
        success: true,
        message: `User ${isActive ? "activated" : "deactivated"} successfully.`,
        data: {
          user,
        },
      });
    } catch (error) {
      console.error("User status update error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating user status.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

module.exports = router;
