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
  const message = messageKey.includes(".") ? messageKey : messageKey;

  res.status(statusCode).json({
    success,
    message,
    messageKey: messageKey.includes(".") ? messageKey : null,
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
      sendResponse(
        res,
        200,
        true,
        "api.student.retrievedSuccessfully",
        students
      );
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
      sendResponse(
        res,
        200,
        true,
        "api.student.retrievedSuccessfully",
        students
      );
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

      sendResponse(
        res,
        201,
        true,
        "api.student.createdSuccessfully",
        savedStudent
      );
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

      const student = await Student.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      ).populate("class", "name branches");

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

      sendResponse(
        res,
        200,
        true,
        "api.student.statusUpdatedSuccessfully",
        student
      );
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

// GET students by branch for rating (Teachers and Admins only)
router.get(
  "/rating/branch/:branchId",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const students = await Student.find({ branchID: req.params.branchId })
        .populate("class", "name branches")
        .sort({ fullName: 1 });

      sendResponse(
        res,
        200,
        true,
        "api.student.retrievedSuccessfully",
        students
      );
    } catch (error) {
      console.error("Error fetching students for rating:", error);
      sendResponse(res, 500, false, "api.student.failedRetrieve");
    }
  }
);

// POST save student ratings to separate collection (Teachers and Admins only)
router.post(
  "/:id/rating",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const { subjectId, season, date, rating } = req.body;

      if (!subjectId || !season || !date || !rating) {
        return sendResponse(res, 400, false, "api.rating.missingFields");
      }

      const student = await Student.findById(req.params.id);
      if (!student) {
        return sendResponse(res, 404, false, "api.student.notFound");
      }

      // Save to separate ratings collection
      const db = require("mongoose").connection.db;
      const ratingsCollection = db.collection("ratings");

      const ratingData = {
        studentId: student._id,
        subjectId,
        season,
        date: new Date(date),
        rating,
        ratedAt: new Date(),
      };

      // Check if rating already exists for this subject on this exact date
      const existingRating = await ratingsCollection.findOne({
        studentId: student._id,
        subjectId: subjectId,
        season: season,
        date: new Date(date),
      });

      if (existingRating) {
        // Update existing rating (same date)
        await ratingsCollection.updateOne(
          { _id: existingRating._id },
          { $set: ratingData }
        );
        console.log("✅ Rating updated");
      } else {
        // Insert new rating (different date = new record)
        await ratingsCollection.insertOne(ratingData);
        console.log("✅ Rating inserted - Multiple records by date allowed");
      }

      await student.populate("class", "name branches");

      sendResponse(res, 200, true, "api.rating.savedSuccessfully", {
        student,
        rating: ratingData,
      });
    } catch (error) {
      console.error("Error saving student rating:", error);
      sendResponse(res, 400, false, error.message);
    }
  }
);

// GET student ratings from separate collection (Teachers and Admins only)
router.get("/:id/ratings", verifyToken, getCurrentUser, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      "class",
      "name branches"
    );

    if (!student) {
      return sendResponse(res, 404, false, "api.student.notFound");
    }

    // Check authorization: allow if user is teacher/admin OR if student viewing their own ratings
    // Compare by username since Student._id is different from User._id
    const isOwnRatings = req.user.username === student.username;
    const isTeacherOrAdmin =
      req.user.role === "Teacher" || req.user.role === "Admin";

    if (!isOwnRatings && !isTeacherOrAdmin) {
      return sendResponse(res, 403, false, "api.error.unauthorized");
    }

    // Fetch ratings from separate ratings collection
    const db = require("mongoose").connection.db;
    const ratingsCollection = db.collection("ratings");

    const ratings = await ratingsCollection
      .find({ studentId: student._id })
      .toArray();

    sendResponse(res, 200, true, "api.rating.retrievedSuccessfully", {
      student,
      ratings: ratings || [],
    });
  } catch (error) {
    console.error("Error fetching student ratings:", error);
    sendResponse(res, 500, false, "api.rating.failedRetrieve");
  }
});

// GET ratings by date and season for bulk rating (to show existing data)
router.get(
  "/bulk/byDateSeason/:classId/:branchId",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const { classId, branchId } = req.params;
      const { date, season } = req.query;

      if (!date || !season) {
        return sendResponse(res, 400, false, "Date and season are required");
      }

      // Get all students in this class/branch
      const students = await Student.find({
        class: classId,
        branchID: branchId,
      });

      const studentIds = students.map((s) => s._id);

      // Fetch ratings for this date/season
      const db = require("mongoose").connection.db;
      const ratingsCollection = db.collection("ratings");

      const ratings = await ratingsCollection
        .find({
          studentId: { $in: studentIds },
          date: new Date(date),
          season: season,
        })
        .toArray();

      // Group by student and subject
      const groupedRatings = {};
      ratings.forEach((rating) => {
        const key = `${rating.studentId}-${rating.subjectId}`;
        groupedRatings[key] = rating.rating;
      });

      sendResponse(res, 200, true, "Ratings retrieved", {
        ratings: groupedRatings,
        totalFound: ratings.length,
      });
    } catch (error) {
      console.error("Error fetching ratings by date/season:", error);
      sendResponse(res, 500, false, "Failed to fetch existing ratings");
    }
  }
);

// GET all ratings with student info (Admin only)
router.get(
  "/admin/allRatings",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const db = require("mongoose").connection.db;
      const ratingsCollection = db.collection("ratings");

      // Get all ratings with populated student info
      const ratings = await ratingsCollection.find({}).toArray();

      // Populate student names
      const enrichedRatings = await Promise.all(
        ratings.map(async (rating) => {
          const student = await Student.findById(rating.studentId).select(
            "fullName username email"
          );
          return {
            ...rating,
            studentName: student?.fullName || "Unknown",
            studentUsername: student?.username || "N/A",
          };
        })
      );

      sendResponse(res, 200, true, "All ratings retrieved", {
        ratings: enrichedRatings,
        total: enrichedRatings.length,
      });
    } catch (error) {
      console.error("Error fetching all ratings:", error);
      sendResponse(res, 500, false, "Failed to fetch ratings");
    }
  }
);

// DELETE rating by ID (Admin only)
router.delete(
  "/admin/rating/:ratingId",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const db = require("mongoose").connection.db;
      const ratingsCollection = db.collection("ratings");
      const mongoose = require("mongoose");

      const result = await ratingsCollection.deleteOne({
        _id: new mongoose.Types.ObjectId(req.params.ratingId),
      });

      if (result.deletedCount === 0) {
        return sendResponse(res, 404, false, "Rating not found");
      }

      sendResponse(res, 200, true, "Rating deleted successfully");
    } catch (error) {
      console.error("Error deleting rating:", error);
      sendResponse(res, 400, false, error.message);
    }
  }
);

// UPDATE rating by ID (Admin only)
router.put(
  "/admin/rating/:ratingId",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const { subjectId, season, date, rating } = req.body;

      if (!subjectId || !season || !date || !rating) {
        return sendResponse(res, 400, false, "All fields are required");
      }

      const db = require("mongoose").connection.db;
      const ratingsCollection = db.collection("ratings");
      const mongoose = require("mongoose");

      const updateData = {
        subjectId,
        season,
        date: new Date(date),
        rating,
        ratedAt: new Date(),
      };

      const result = await ratingsCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(req.params.ratingId) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return sendResponse(res, 404, false, "Rating not found");
      }

      sendResponse(res, 200, true, "Rating updated successfully", updateData);
    } catch (error) {
      console.error("Error updating rating:", error);
      sendResponse(res, 400, false, error.message);
    }
  }
);

module.exports = router;
