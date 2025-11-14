const express = require("express");
const router = express.Router();
const Homework = require("../models/Homework");
const Student = require("../models/Student");
const {
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
} = require("../middleware/auth");

// Standardized response format with translation support
const sendResponse = (res, statusCode, success, messageKey, data = null) => {
  // messageKey can be either a translation key or a direct message
  // If it contains a dot, it's a translation key; otherwise, it's a direct message
  const isTranslationKey = messageKey.includes(".");

  res.status(statusCode).json({
    success,
    message: messageKey,
    messageKey: isTranslationKey ? messageKey : null,
    ...(data && { data }),
  });
};

// Helper function to normalize date (ignore time)
const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// CREATE homework and assign to all students in class/branch
router.post(
  "/",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const { subjectId, date, description, classId, branchId } = req.body;

      if (!subjectId || !date || !description || !classId || !branchId) {
        return sendResponse(
          res,
          400,
          false,
          "Missing required fields: subjectId, date, description, classId, branchId"
        );
      }

      const homeworkDate = new Date(date);
      const normalizedDate = normalizeDate(homeworkDate);

      // Find all students in the specified class and branch
      const students = await Student.find({
        class: classId,
        branchID: branchId,
      });

      if (students.length === 0) {
        return sendResponse(
          res,
          404,
          false,
          "No students found in the specified class and branch"
        );
      }

      const studentIds = students.map((s) => s._id);

      // Check if homework with same subject, date, class, and branch already exists
      const existingHomework = await Homework.findOne({
        subjectId,
        classId,
        branchId,
        date: {
          $gte: normalizedDate,
          $lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
        },
      });

      let homework;
      let isUpdate = false;

      if (existingHomework) {
        // Update existing homework
        existingHomework.description = description;
        existingHomework.assignedStudents = studentIds;
        existingHomework.updatedAt = new Date();
        homework = await existingHomework.save();
        isUpdate = true;
      } else {
        // Create new homework
        homework = new Homework({
          subjectId,
          date: homeworkDate,
          description,
          classId,
          branchId,
          assignedStudents: studentIds,
        });
        homework = await homework.save();
      }

      // Populate subject and class for response
      await homework.populate("subjectId", "titles");
      await homework.populate("classId", "name");

      sendResponse(
        res,
        isUpdate ? 200 : 201,
        true,
        isUpdate
          ? "Homework updated successfully"
          : "Homework created and assigned successfully",
        {
          homework,
          assignedCount: studentIds.length,
          isUpdate,
        }
      );
    } catch (error) {
      console.error("Error creating/updating homework:", error);
      sendResponse(
        res,
        500,
        false,
        "Error creating/updating homework",
        null,
        error.message
      );
    }
  }
);

// GET all homeworks with optional filters
router.get(
  "/",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const { classId, branchId, subjectId, date } = req.query;

      const query = {};

      if (classId) query.classId = classId;
      if (branchId) query.branchId = branchId;
      if (subjectId) query.subjectId = subjectId;
      if (date) {
        const normalizedDate = normalizeDate(new Date(date));
        query.date = {
          $gte: normalizedDate,
          $lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
        };
      }

      const homeworks = await Homework.find(query)
        .populate("subjectId", "titles")
        .populate("classId", "name")
        .populate("assignedStudents", "fullName username")
        .sort({ date: -1, createdAt: -1 });

      sendResponse(res, 200, true, "Homeworks retrieved successfully", {
        homeworks,
      });
    } catch (error) {
      console.error("Error fetching homeworks:", error);
      sendResponse(
        res,
        500,
        false,
        "Error fetching homeworks",
        null,
        error.message
      );
    }
  }
);

// GET homework by ID
router.get(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const homework = await Homework.findById(req.params.id)
        .populate("subjectId", "titles")
        .populate("classId", "name")
        .populate("assignedStudents", "fullName username");

      if (!homework) {
        return sendResponse(res, 404, false, "Homework not found");
      }

      sendResponse(res, 200, true, "Homework retrieved successfully", {
        homework,
      });
    } catch (error) {
      console.error("Error fetching homework:", error);
      sendResponse(
        res,
        500,
        false,
        "Error fetching homework",
        null,
        error.message
      );
    }
  }
);

// DELETE homework (removes from all assigned students)
router.delete(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const homework = await Homework.findById(req.params.id);

      if (!homework) {
        return sendResponse(res, 404, false, "Homework not found");
      }

      const assignedCount = homework.assignedStudents.length;

      // Delete the homework document
      await Homework.findByIdAndDelete(req.params.id);

      sendResponse(res, 200, true, "Homework deleted successfully", {
        deletedHomeworkId: req.params.id,
        removedFromStudents: assignedCount,
      });
    } catch (error) {
      console.error("Error deleting homework:", error);
      sendResponse(
        res,
        500,
        false,
        "Error deleting homework",
        null,
        error.message
      );
    }
  }
);

// GET homeworks for a specific student
router.get(
  "/student/:studentId",
  verifyToken,
  getCurrentUser,
  async (req, res) => {
    try {
      const { studentId } = req.params;

      // Check if user is the student themselves, or admin/teacher
      const user = req.user;
      if (
        user.role === "Student" &&
        user.studentProfile?._id?.toString() !== studentId
      ) {
        return sendResponse(res, 403, false, "Access denied");
      }

      const homeworks = await Homework.find({
        assignedStudents: studentId,
      })
        .populate("subjectId", "titles")
        .sort({ date: -1, createdAt: -1 });

      sendResponse(res, 200, true, "Student homeworks retrieved successfully", {
        homeworks,
      });
    } catch (error) {
      console.error("Error fetching student homeworks:", error);
      sendResponse(
        res,
        500,
        false,
        "Error fetching student homeworks",
        null,
        error.message
      );
    }
  }
);

module.exports = router;
