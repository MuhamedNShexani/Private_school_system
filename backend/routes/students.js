const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const {
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  requireAdmin,
} = require("../middleware/auth");

// GET all students (Teachers and Admins only)
router.get(
  "/",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const students = await Student.find()
        .populate("class", "name branches")
        .sort({ createdAt: -1 });
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// GET students by class ID (Teachers and Admins only)
router.get(
  "/class/:classId",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const students = await Student.find({ class: req.params.classId })
        .populate("class", "name branches")
        .sort({ name: 1 });
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// GET student by username
router.get("/username/:username", async (req, res) => {
  try {
    const student = await Student.findOne({
      username: req.params.username,
    }).populate("class", "name branches");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single student by ID
router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      "class",
      "name branches"
    );
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new student (Teachers and Admins only)
router.post(
  "/",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      console.log("Creating student with data:", req.body);
      console.log("Class field:", req.body.class);
      console.log("BranchID field:", req.body.branchID);

      // Extract password and hash it
      const { password, ...studentData } = req.body;
      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Password is required for student creation",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      // Create student with hashed password
      const student = new Student({
        ...studentData,
        password: hashedPassword,
      });

      console.log("Student object created:", student);
      const savedStudent = await student.save();
      console.log("Student saved successfully:", savedStudent);

      // Create corresponding User account
      const nameParts = savedStudent.fullName.split(" ");
      const firstName = nameParts[0] || savedStudent.fullName;
      const lastName = nameParts.slice(1).join(" ") || "Student"; // Default to "Student" if no last name

      const user = new User({
        firstName: firstName,
        lastName: lastName,
        email: savedStudent.email,
        username: savedStudent.username,
        password: password, // Use plain password, let User model hash it
        role: "Student",
        studentProfile: {
          class: savedStudent.class,
          branchID: savedStudent.branchID,
          studentNumber: savedStudent.studentNumber,
          parentsNumber: savedStudent.parentsNumber,
        },
      });

      const savedUser = await user.save();
      console.log("User account created successfully:", savedUser);

      // Populate student data
      await savedStudent.populate("class", "name branches");

      res.status(201).json({
        success: true,
        message: "Student and User account created successfully",
        data: savedStudent,
      });
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// PUT update student (Teachers and Admins only)
router.put(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      console.log("Updating student with ID:", req.params.id);
      console.log("Update data:", req.body);
      console.log("Class field:", req.body.class);
      console.log("BranchID field:", req.body.branchID);

      const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).populate("class", "name branches");

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      console.log("Updated student:", student);
      res.json(student);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(400).json({ message: error.message });
    }
  }
);

// PATCH update student status for a specific subject (Teachers and Admins only)
router.patch(
  "/:id/status/:subjectId",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const { subjectId } = req.params;
      const { status } = req.body;

      const student = await Student.findById(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Update the status for the specific subject
      student.status[subjectId] = status;
      await student.save();
      await student.populate("class", "name branches");

      res.json(student);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// DELETE student (Admins only)
router.delete(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const student = await Student.findByIdAndDelete(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
