const express = require("express");
const router = express.Router();
const Teacher = require("../models/Teacher");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const {
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  requireAdmin,
  optionalAuth,
} = require("../middleware/auth");

// GET all teachers (Public - for initial loading)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const teachers = await Teacher.find({ isActive: true })
      .populate("subjects", "title")
      .populate("classes", "name branches")
      .sort({ name: 1 });

    // Process teachers to include branch names
    const processedTeachers = teachers.map((teacher) => {
      const teacherObj = teacher.toObject();
      if (teacherObj.classes && teacherObj.branches) {
        teacherObj.branches = teacherObj.branches.map((branchId) => {
          // Find the branch in the classes
          for (const cls of teacherObj.classes) {
            if (cls.branches) {
              const branch = cls.branches.find(
                (b) => b._id.toString() === branchId
              );
              if (branch) {
                return {
                  _id: branch._id,
                  name: branch.name,
                };
              }
            }
          }
          return { _id: branchId, name: "Unknown Branch" };
        });
      }
      return teacherObj;
    });

    res.json({
      success: true,
      data: processedTeachers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET single teacher by ID (Public)
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate("subjects", "title")
      .populate("classes", "name branches");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Process teacher to include branch names
    const teacherObj = teacher.toObject();
    if (teacherObj.classes && teacherObj.branches) {
      teacherObj.branches = teacherObj.branches.map((branchId) => {
        // Find the branch in the classes
        for (const cls of teacherObj.classes) {
          if (cls.branches) {
            const branch = cls.branches.find(
              (b) => b._id.toString() === branchId
            );
            if (branch) {
              return {
                _id: branch._id,
                name: branch.name,
              };
            }
          }
        }
        return { _id: branchId, name: "Unknown Branch" };
      });
    }

    res.json({
      success: true,
      data: teacherObj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST create new teacher (Teachers and Admins only)
router.post(
  "/",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      console.log("Creating teacher with data:", req.body);

      // Extract password and hash it
      const { password, ...teacherData } = req.body;
      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Password is required for teacher creation",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      // Create teacher with hashed password
      const teacher = new Teacher({
        ...teacherData,
        password: hashedPassword,
      });

      console.log("Teacher object created:", teacher);
      const savedTeacher = await teacher.save();
      console.log("Teacher saved successfully:", savedTeacher);

      // Create corresponding User account
      const nameParts = savedTeacher.name.split(" ");
      const firstName = nameParts[0] || savedTeacher.name;
      const lastName = nameParts.slice(1).join(" ") || "Teacher"; // Default to "Teacher" if no last name

      const user = new User({
        firstName: firstName,
        lastName: lastName,
        email: savedTeacher.email,
        username: savedTeacher.username,
        password: password, // Use plain password, let User model hash it
        role: "Teacher",
        teacherProfile: {
          subjects: savedTeacher.subjects,
          classes: savedTeacher.classes,
          branches: savedTeacher.branches,
          employeeNumber: savedTeacher.employeeNumber,
        },
      });

      const savedUser = await user.save();
      console.log("User account created successfully:", savedUser);

      // Populate teacher data
      await savedTeacher.populate([
        { path: "subjects", select: "title" },
        { path: "classes", select: "name branches" },
      ]);

      // Process teacher to include branch names
      const teacherObj = savedTeacher.toObject();
      if (teacherObj.classes && teacherObj.branches) {
        teacherObj.branches = teacherObj.branches.map((branchId) => {
          // Find the branch in the classes
          for (const cls of teacherObj.classes) {
            if (cls.branches) {
              const branch = cls.branches.find(
                (b) => b._id.toString() === branchId
              );
              if (branch) {
                return {
                  _id: branch._id,
                  name: branch.name,
                };
              }
            }
          }
          return { _id: branchId, name: "Unknown Branch" };
        });
      }

      res.status(201).json({
        success: true,
        message: "Teacher and User account created successfully",
        data: teacherObj,
      });
    } catch (error) {
      console.error("Error creating teacher:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// PUT update teacher (Teachers and Admins only)
router.put(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const existingTeacher = await Teacher.findById(req.params.id);

      if (!existingTeacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found",
        });
      }

      const originalUsername = existingTeacher.username;

      // Extract password from request body
      const { password, ...updateData } = req.body;
      let plainPassword = null;

      // If password is provided, hash it
      if (password && password.trim() !== "") {
        const hashedPassword = await bcrypt.hash(password, 12);
        updateData.password = hashedPassword;
        plainPassword = password;
      }
      // If password is empty or not provided, don't include it in the update

      const teacher = await Teacher.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      ).populate([
        { path: "subjects", select: "title" },
        { path: "classes", select: "name branches" },
      ]);

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found",
        });
      }

      // Process teacher to include branch names
      const teacherObj = teacher.toObject();
      if (teacherObj.classes && teacherObj.branches) {
        teacherObj.branches = teacherObj.branches.map((branchId) => {
          // Find the branch in the classes
          for (const cls of teacherObj.classes) {
            if (cls.branches) {
              const branch = cls.branches.find(
                (b) => b._id.toString() === branchId
              );
              if (branch) {
                return {
                  _id: branch._id,
                  name: branch.name,
                };
              }
            }
          }
          return { _id: branchId, name: "Unknown Branch" };
        });
      }

      res.json({
        success: true,
        message: "Teacher updated successfully",
        data: teacherObj,
      });

      // Sync related user account after successful update (run without blocking response)
      try {
        const userMatchQuery = {
          $or: [
            { username: originalUsername },
            { username: teacher.username },
            { email: teacher.email },
            {
              "teacherProfile.employeeNumber":
                teacher.employeeNumber || existingTeacher.employeeNumber,
            },
          ].filter(Boolean),
        };

        const user = await User.findOne(userMatchQuery);

        if (user) {
          // Update core identity fields
          if (teacher.email) {
            user.email = teacher.email;
          }
          if (teacher.username) {
            user.username = teacher.username;
          }

          const nameParts = (teacher.name || "").split(" ").filter(Boolean);
          const firstName = nameParts[0] || teacher.name || user.firstName;
          const lastName =
            nameParts.slice(1).join(" ") ||
            (nameParts.length === 0 ? "Teacher" : user.lastName);

          user.firstName = firstName;
          user.lastName = lastName;

          // Update teacher profile permissions
          const normalizeArray = (arr = []) =>
            arr.map((item) =>
              item && item._id ? item._id : item
            );

          user.teacherProfile = {
            subjects: Array.isArray(teacher.subjects)
              ? normalizeArray(teacher.subjects)
              : user.teacherProfile?.subjects || [],
            classes: Array.isArray(teacher.classes)
              ? normalizeArray(teacher.classes)
              : user.teacherProfile?.classes || [],
            branches: Array.isArray(teacher.branches)
              ? normalizeArray(teacher.branches)
              : user.teacherProfile?.branches || [],
            employeeNumber:
              teacher.employeeNumber || user.teacherProfile?.employeeNumber,
          };

          // Update password if it was provided
          if (plainPassword) {
            user.password = plainPassword;
          }

          await user.save();
        }
      } catch (syncError) {
        console.error(
          "Failed to sync teacher changes to user account:",
          syncError
        );
      }
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// PATCH update teacher status (Teachers and Admins only)
router.patch(
  "/:id/status",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const { isActive } = req.body;
      const teacher = await Teacher.findByIdAndUpdate(
        req.params.id,
        { isActive },
        { new: true }
      ).populate("subjects", "title");

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found",
        });
      }
      res.json({
        success: true,
        message: `Teacher ${
          isActive ? "activated" : "deactivated"
        } successfully`,
        data: teacher,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// DELETE teacher (Admins only)
router.delete(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const teacher = await Teacher.findByIdAndDelete(req.params.id);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found",
        });
      }
      res.json({
        success: true,
        message: "Teacher deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;
