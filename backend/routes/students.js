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
const multer = require("multer");
const path = require("path");

// Standardized response format with translation support
const sendResponse = (res, statusCode, success, messageKey, data = null) => {
  // messageKey can be either a translation key or a direct message
  // If it contains a dot, it's a translation key; otherwise, it's a direct message
  const message = messageKey.includes('.') ? messageKey : messageKey;
  
  res.status(statusCode).json({
    success,
    message,
    messageKey: messageKey.includes('.') ? messageKey : null,
    ...(data && { data }),
  });
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("INVALID_FILE_TYPE"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

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
      sendResponse(res, 200, true, "api.student.retrievedSuccessfully", students);
    } catch (error) {
      console.error("Error fetching students:", error);
      sendResponse(res, 500, false, "api.student.failedRetrieve");
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
      sendResponse(res, 200, true, "api.student.retrievedSuccessfully", students);
    } catch (error) {
      console.error("Error fetching students by class:", error);
      sendResponse(res, 500, false, "api.student.failedRetrieve");
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
      return sendResponse(res, 404, false, "api.student.notFound");
    }
    sendResponse(res, 200, true, "api.student.retrievedSuccessfully", student);
  } catch (error) {
    console.error("Error fetching student by username:", error);
    sendResponse(res, 500, false, "api.student.failedRetrieve");
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
      return sendResponse(res, 404, false, "api.student.notFound");
    }
    sendResponse(res, 200, true, "api.student.retrievedSuccessfully", student);
  } catch (error) {
    console.error("Error fetching student by ID:", error);
    sendResponse(res, 500, false, "api.student.failedRetrieve");
  }
});

// POST create new student (Teachers and Admins only)
router.post(
  "/",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      console.log("Creating student with data:", req.body);
      console.log("File:", req.file);
      console.log("Class field:", req.body.class);
      console.log("BranchID field:", req.body.branchID);

      // Extract password and hash it
      const { password, ...studentData } = req.body;
      if (!password) {
        return sendResponse(res, 400, false, "api.student.passwordRequired");
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      // Add image path if file was uploaded
      if (req.file) {
        studentData.photo = `/uploads/${req.file.filename}`;
      }

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

      sendResponse(res, 201, true, "api.student.createdSuccessfully", savedStudent);
    } catch (error) {
      console.error("Error creating student:", error);
      sendResponse(res, 400, false, error.message);
    }
  }
);

// PUT update student (Teachers and Admins only)
router.put(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      console.log("Updating student with ID:", req.params.id);
      console.log("Update data:", req.body);
      console.log("File:", req.file);
      console.log("Class field:", req.body.class);
      console.log("BranchID field:", req.body.branchID);

      // Prepare update data
      const updateData = { ...req.body };

      // If a new image was uploaded, save the image path
      if (req.file) {
        updateData.photo = `/uploads/${req.file.filename}`;
      }

      const student = await Student.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      }).populate("class", "name branches");

      if (!student) {
        return sendResponse(res, 404, false, "api.student.notFound");
      }

      console.log("Updated student:", student);
      sendResponse(res, 200, true, "api.student.updatedSuccessfully", student);
    } catch (error) {
      console.error("Error updating student:", error);
      sendResponse(res, 400, false, error.message);
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
        return sendResponse(res, 404, false, "api.student.notFound");
      }

      // Update the status for the specific subject
      student.status[subjectId] = status;
      await student.save();
      await student.populate("class", "name branches");

      sendResponse(res, 200, true, "api.student.statusUpdatedSuccessfully", student);
    } catch (error) {
      console.error("Error updating student status:", error);
      sendResponse(res, 400, false, error.message);
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
        return sendResponse(res, 404, false, "api.student.notFound");
      }
      sendResponse(res, 200, true, "api.student.deletedSuccessfully");
    } catch (error) {
      console.error("Error deleting student:", error);
      sendResponse(res, 500, false, "api.student.failedDelete");
    }
  }
);

module.exports = router;
