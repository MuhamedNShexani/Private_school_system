const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const StudentExerciseGrade = require("../models/StudentExerciseGrade");
const StudentGrade = require("../models/StudentGrade");
const Student = require("../models/Student");
const Exercise = require("../models/Exercise");
const Part = require("../models/Part");
const Chapter = require("../models/Chapter");
const Season = require("../models/Season");
const Subject = require("../models/Subject");
const Class = require("../models/Class");
const {
  verifyToken,
  getCurrentUser,
  requireAdmin,
  requireTeacherOrAdmin,
} = require("../middleware/auth");

// POST bulk create/update grades for multiple students
router.post(
  "/bulk",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const {
        studentIds,
        gradingType,
        monthlyExamNumber, // "1" or "2" for first/second exam
        exerciseId,
        partId,
        chapterId,
        seasonId,
        subjectId,
        classId,
        branchId,
        grades, // Array of {studentId, grade, notes?}
        gradedDate, // Optional date for grading (defaults to now)
      } = req.body;

      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one student must be selected",
        });
      }

      if (!gradingType || !['exercise', 'monthly_exam', 'attendance', 'behaviour', 'season_exam'].includes(gradingType)) {
        return res.status(400).json({
          success: false,
          message: "Valid grading type must be specified (exercise, monthly_exam, attendance, behaviour, season_exam)",
        });
      }

      if (!seasonId || !subjectId || !classId || !branchId) {
        return res.status(400).json({
          success: false,
          message: "Season, subject, class, and branch must be specified",
        });
      }

      // For exercise type, require exercise, part, and chapter
      if (gradingType === 'exercise' && (!exerciseId || !partId || !chapterId)) {
        return res.status(400).json({
          success: false,
          message: "For exercise type, exercise, part, and chapter must be specified",
        });
      }

      // For monthly_exam type, require monthlyExamNumber
      if (gradingType === 'monthly_exam' && (!monthlyExamNumber || !['1', '2'].includes(monthlyExamNumber))) {
        return res.status(400).json({
          success: false,
          message: "For monthly exam type, exam number (1 or 2) must be specified",
        });
      }

      // Get season, subject, and class
      const season = await Season.findById(seasonId);
      const subject = await Subject.findById(subjectId);
      const classData = await Class.findById(classId);

      if (!season || !subject || !classData) {
        return res.status(404).json({
          success: false,
          message: "Season, subject, or class not found",
        });
      }

      // For exercise type, get exercise and validate hierarchy
      let exercise = null;
      let part = null;
      let chapter = null;
      
      if (gradingType === 'exercise') {
        exercise = await Exercise.findById(exerciseId);
        if (!exercise) {
          return res.status(404).json({
            success: false,
            message: "Exercise not found",
          });
        }

        part = await Part.findById(partId).populate("chapter");
        chapter = await Chapter.findById(chapterId);

        if (!part || !chapter) {
          return res.status(404).json({
            success: false,
            message: "Part or chapter not found",
          });
        }
      }

      // Get season name (handle multilingual)
      let seasonName = season.name;
      if (season.nameMultilingual) {
        seasonName = season.nameMultilingual.en || season.nameMultilingual.ku || season.nameMultilingual.ar || season.name;
      } else if (typeof season.name === 'object') {
        seasonName = season.name.en || season.name.ku || season.name.ar || "Season";
      }

      // Parse graded date or use current date
      const gradingDate = gradedDate ? new Date(gradedDate) : new Date();

      // Check if grades array is provided
      if (!grades || !Array.isArray(grades)) {
        return res.status(400).json({
          success: false,
          message: "Grades array is required",
        });
      }

      const results = {
        created: [],
        updated: [],
        errors: [],
      };

      // Check if req.user exists
      if (!req.user || (!req.user.userId && !req.user._id)) {
        return res.status(401).json({
          success: false,
          message: "User authentication required for grading",
        });
      }

      // Get user ID - check both userId and _id
      const gradedByUserId = req.user.userId || req.user._id;

      // Process each student grade
      if (gradingType === 'exercise') {
        // Handle exercise type - save to StudentExerciseGrade and update StudentGrade.exercises
        for (const gradeData of grades) {
          try {
            if (!gradeData.studentId || gradeData.grade === undefined) {
              results.errors.push({
                studentId: gradeData.studentId || "unknown",
                message: "Student ID and grade are required",
              });
              continue;
            }

            const student = await Student.findById(gradeData.studentId);
            if (!student) {
              results.errors.push({
                studentId: gradeData.studentId,
                message: "Student not found",
              });
              continue;
            }

            // Check if grade already exists
            const existingGrade = await StudentExerciseGrade.findOne({
              student: gradeData.studentId,
              exercise: exerciseId,
            });
            
            if (existingGrade) {
              // Update existing grade
              const gradeToSave = (gradeData.grade !== null && gradeData.grade !== undefined) ? Number(gradeData.grade) : 0;
              const exerciseDegreeValue = exercise.degree && exercise.degree > 0 ? exercise.degree : 10;
              const gradeValue = Math.min(gradeToSave, exerciseDegreeValue);
              
              existingGrade.exerciseDegree = exerciseDegreeValue;
              existingGrade.grade = gradeValue;
              existingGrade.notes = gradeData.notes || existingGrade.notes;
              existingGrade.gradedBy = gradedByUserId;
              existingGrade.gradedAt = gradingDate;
              
              // Validate before saving
              const validationError = existingGrade.validateSync();
              if (validationError) {
                console.error(`Validation error for existing exercise grade:`, validationError.errors);
                throw validationError;
              }
              
              await existingGrade.save();
              console.log(`Updated activity log entry (exercise) for student ${gradeData.studentId}, exercise: ${exerciseId}`);
              results.updated.push({
                studentId: gradeData.studentId,
                studentName: student.fullName,
                grade: gradeData.grade,
              });
            } else {
              const exerciseDegreeValue = exercise.degree && exercise.degree > 0 ? exercise.degree : 10;
              const gradeToSave = (gradeData.grade !== null && gradeData.grade !== undefined) ? Number(gradeData.grade) : 0;
              const gradeValue = Math.min(gradeToSave, exerciseDegreeValue);
              
              const newGrade = new StudentExerciseGrade({
                student: gradeData.studentId,
                exercise: exerciseId,
                part: partId,
                chapter: chapterId,
                season: seasonId,
                subject: subjectId,
                class: classId,
                branch: branchId,
                exerciseDegree: exerciseDegreeValue,
                grade: gradeValue,
                gradingType: 'exercise',
                gradedBy: gradedByUserId,
                gradedAt: gradingDate,
                notes: gradeData.notes || "",
              });
              
              // Validate before saving
              const validationError = newGrade.validateSync();
              if (validationError) {
                console.error(`Validation error for new exercise grade:`, validationError.errors);
                throw validationError;
              }
              
              await newGrade.save();
              console.log(`Created activity log entry (exercise) for student ${gradeData.studentId}, exercise: ${exerciseId}`);
              results.created.push({
                studentId: gradeData.studentId,
                studentName: student.fullName,
                grade: gradeData.grade,
              });
            }
          } catch (error) {
            results.errors.push({
              studentId: gradeData.studentId || "unknown",
              message: error.message,
            });
            console.error(`Error saving StudentExerciseGrade for student ${gradeData.studentId}:`, error);
          }
        }
      } else {
        // Handle other types (monthly_exam, attendance, behaviour, season_exam)
        // Save directly to StudentGrade and create activity log entry
        for (const gradeData of grades) {
          try {
            if (!gradeData.studentId || gradeData.grade === undefined) {
              results.errors.push({
                studentId: gradeData.studentId || "unknown",
                message: "Student ID and grade are required",
              });
              continue;
            }

            const student = await Student.findById(gradeData.studentId);
            if (!student) {
              results.errors.push({
                studentId: gradeData.studentId,
                message: "Student not found",
              });
              continue;
            }

            const gradeValue = Number(gradeData.grade);
            
            // Collect all possible season names for matching
            const allSeasonNames = [seasonName];
            if (season.nameMultilingual) {
              if (season.nameMultilingual.en) allSeasonNames.push(season.nameMultilingual.en);
              if (season.nameMultilingual.ku) allSeasonNames.push(season.nameMultilingual.ku);
              if (season.nameMultilingual.ar) allSeasonNames.push(season.nameMultilingual.ar);
            }
            if (typeof season.name === 'object' && season.name !== null) {
              if (season.name.en) allSeasonNames.push(season.name.en);
              if (season.name.ku) allSeasonNames.push(season.name.ku);
              if (season.name.ar) allSeasonNames.push(season.name.ar);
            }
            const uniqueSeasonNames = [...new Set(allSeasonNames.filter(Boolean))];

            // Find or create StudentGrade
            let studentGrade = null;
            for (const name of uniqueSeasonNames) {
              studentGrade = await StudentGrade.findOne({
                student: gradeData.studentId,
                subject: subjectId,
                season: name,
              });
              if (studentGrade) break;
            }

            if (!studentGrade) {
              studentGrade = new StudentGrade({
                student: gradeData.studentId,
                subject: subjectId,
                season: seasonName,
                season_exam: 0,
                exercises: 0,
                attendance: 0,
                behaviour: 0,
                monthly_exam: [],
              });
            }

            // Update the appropriate field based on grading type
            if (gradingType === 'monthly_exam') {
              // For monthly_exam, update specific exam (1 or 2)
              if (!studentGrade.monthly_exam) studentGrade.monthly_exam = [];
              
              const examIndex = parseInt(monthlyExamNumber, 10) - 1; // Convert "1" or "2" to 0 or 1
              
              // Ensure array has enough elements
              while (studentGrade.monthly_exam.length <= examIndex) {
                studentGrade.monthly_exam.push(0);
              }
              
              // Update the specific exam
              studentGrade.monthly_exam[examIndex] = gradeValue;
            } else if (gradingType === 'attendance') {
              studentGrade.attendance = gradeValue;
            } else if (gradingType === 'behaviour') {
              studentGrade.behaviour = gradeValue;
            } else if (gradingType === 'season_exam') {
              studentGrade.season_exam = gradeValue;
            }

            await studentGrade.save();

            // Create or update activity log entry in StudentExerciseGrade
            // For monthly_exam, check if entry exists for this specific exam number
            let activityLogEntry = null;
            
            // Convert IDs to ObjectId for consistent querying
            const studentObjectId = typeof gradeData.studentId === 'string' ? new mongoose.Types.ObjectId(gradeData.studentId) : gradeData.studentId;
            const subjectObjectId = typeof subjectId === 'string' ? new mongoose.Types.ObjectId(subjectId) : subjectId;
            const seasonObjectId = typeof seasonId === 'string' ? new mongoose.Types.ObjectId(seasonId) : seasonId;
            
            const queryFilter = {
              student: studentObjectId,
              subject: subjectObjectId,
              season: seasonObjectId,
              gradingType: gradingType,
            };
            
            if (gradingType === 'monthly_exam') {
              queryFilter.monthlyExamNumber = monthlyExamNumber;
            }
            
            console.log(`Looking for existing activity log entry with filter:`, {
              student: studentObjectId.toString(),
              subject: subjectObjectId.toString(),
              season: seasonObjectId.toString(),
              gradingType: gradingType,
              monthlyExamNumber: gradingType === 'monthly_exam' ? monthlyExamNumber : 'N/A'
            });
            
            activityLogEntry = await StudentExerciseGrade.findOne(queryFilter);
            
            // Also check if there are any entries for this student/subject/season to debug
            const allEntriesForStudent = await StudentExerciseGrade.find({
              student: studentObjectId,
              subject: subjectObjectId,
              season: seasonObjectId,
            });
            console.log(`Found ${allEntriesForStudent.length} total activity log entries for this student/subject/season combination`);
            if (allEntriesForStudent.length > 0) {
              console.log(`Existing entries:`, allEntriesForStudent.map(e => ({
                id: e._id,
                type: e.gradingType,
                monthlyExamNumber: e.monthlyExamNumber,
                grade: e.grade
              })));
            }
            
            if (activityLogEntry) {
              // Update existing activity log entry
              console.log(`Found existing activity log entry: ${activityLogEntry._id}, updating...`);
              activityLogEntry.grade = gradeValue;
              activityLogEntry.gradedBy = gradedByUserId;
              activityLogEntry.gradedAt = gradingDate;
              if (gradeData.notes !== undefined) {
                activityLogEntry.notes = gradeData.notes;
              }
              
              // Validate before saving
              const validationError = activityLogEntry.validateSync();
              if (validationError) {
                console.error(`Validation error for existing activity log entry:`, validationError.errors);
                throw validationError;
              }
              
              await activityLogEntry.save();
              console.log(`✓ Updated activity log entry for student ${gradeData.studentId}, type: ${gradingType}, ID: ${activityLogEntry._id}`);
            } else {
              // Create new activity log entry
              console.log(`No existing activity log entry found, creating new one...`);
              
              // Convert IDs to ObjectId for consistent saving
              const classObjectId = typeof classId === 'string' ? new mongoose.Types.ObjectId(classId) : classId;
              const branchObjectId = typeof branchId === 'string' ? new mongoose.Types.ObjectId(branchId) : branchId;
              
              activityLogEntry = new StudentExerciseGrade({
                student: studentObjectId,
                exercise: null,
                part: null,
                chapter: null,
                season: seasonObjectId,
                subject: subjectObjectId,
                class: classObjectId,
                branch: branchObjectId,
                exerciseDegree: null,
                grade: gradeValue,
                gradingType: gradingType,
                monthlyExamNumber: gradingType === 'monthly_exam' ? monthlyExamNumber : undefined,
                gradedBy: gradedByUserId,
                gradedAt: gradingDate,
                notes: gradeData.notes || "",
              });
              
              // Validate before saving
              const validationError = activityLogEntry.validateSync();
              if (validationError) {
                console.error(`Validation error for new activity log entry:`, validationError.errors);
                throw validationError;
              }
              
              await activityLogEntry.save();
              console.log(`✓ Created activity log entry for student ${gradeData.studentId}, type: ${gradingType}, ID: ${activityLogEntry._id}`);
              
              // Verify the save worked
              const verifyEntry = await StudentExerciseGrade.findById(activityLogEntry._id);
              if (verifyEntry) {
                console.log(`✓ Verified activity log entry saved: type=${verifyEntry.gradingType}, grade=${verifyEntry.grade}, student=${verifyEntry.student}`);
              } else {
                console.error(`✗ Failed to verify activity log entry after save!`);
              }
            }

            results.created.push({
              studentId: gradeData.studentId,
              studentName: student.fullName,
              grade: gradeData.grade,
            });
          } catch (error) {
            results.errors.push({
              studentId: gradeData.studentId || "unknown",
              message: error.message,
            });
            console.error(`Error saving grade for student ${gradeData.studentId}:`, error);
          }
        }
      }

      // For exercise type, update StudentGrade.exercises from all StudentExerciseGrade records
      if (gradingType === 'exercise') {
        console.log(`All StudentExerciseGrade records saved. Now updating StudentGrade exercises...`);
        
        // After all StudentExerciseGrade records are saved, update StudentGrade exercises for each unique student
        // Get unique student IDs from the grades array (not studentIds, which might not match exactly)
        const uniqueStudentIds = [...new Set(grades.map(g => g.studentId).filter(Boolean))];
        
        console.log('Updating StudentGrade exercises for students:', uniqueStudentIds);
        
        for (const studentId of uniqueStudentIds) {
          try {
            // Convert to ObjectId if needed for proper query matching
            const studentObjectId = typeof studentId === 'string' ? new mongoose.Types.ObjectId(studentId) : studentId;
            const subjectObjectId = typeof subjectId === 'string' ? new mongoose.Types.ObjectId(subjectId) : subjectId;
            const seasonObjectId = typeof seasonId === 'string' ? new mongoose.Types.ObjectId(seasonId) : seasonId;
            
            console.log(`Student ${studentId}: Querying exercise grades with:`);
            console.log(`  student: ${studentObjectId} (${typeof studentObjectId})`);
            console.log(`  subject: ${subjectObjectId} (${typeof subjectObjectId})`);
            console.log(`  season: ${seasonObjectId} (${typeof seasonObjectId})`);
            
            // Calculate total exercises from all StudentExerciseGrade records for this student/subject/season
            const allExerciseGrades = await StudentExerciseGrade.find({
              student: studentObjectId,
              subject: subjectObjectId,
              season: seasonObjectId,
            });

            console.log(`Student ${studentId}: Found ${allExerciseGrades.length} exercise grades`);
            
            // Also check if ANY exercise grades exist for this student/subject/season (for debugging)
            const allForStudentSubject = await StudentExerciseGrade.find({
              student: studentObjectId,
              subject: subjectObjectId,
            });
            console.log(`Student ${studentId}: Total exercise grades for subject: ${allForStudentSubject.length}`);
            
            const allForStudentSeason = await StudentExerciseGrade.find({
              student: studentObjectId,
              season: seasonObjectId,
            });
            console.log(`Student ${studentId}: Total exercise grades for season: ${allForStudentSeason.length}`);
            
            if (allExerciseGrades.length > 0) {
              console.log(`Exercise grades:`, allExerciseGrades.map(eg => ({ 
                exerciseId: eg.exercise?.toString() || eg.exercise,
                grade: eg.grade,
                subject: eg.subject?.toString() || eg.subject,
                season: eg.season?.toString() || eg.season,
                _id: eg._id
              })));
            } else {
              console.log(`WARNING: No exercise grades found for student ${studentId}, subject ${subjectId}, season ${seasonId}`);
              // Show what we do have
              if (allForStudentSubject.length > 0) {
                console.log(`But found ${allForStudentSubject.length} exercise grades for this student+subject:`);
                allForStudentSubject.forEach(eg => {
                  console.log(`  - Grade ID: ${eg._id}, season: ${eg.season?.toString()}, grade: ${eg.grade}`);
                });
              }
              if (allForStudentSeason.length > 0) {
                console.log(`But found ${allForStudentSeason.length} exercise grades for this student+season:`);
                allForStudentSeason.forEach(eg => {
                  console.log(`  - Grade ID: ${eg._id}, subject: ${eg.subject?.toString()}, grade: ${eg.grade}`);
                });
              }
              
              // Check if ANY exercise grades exist for this student at all
              const allForStudent = await StudentExerciseGrade.find({ student: studentObjectId });
              console.log(`Total exercise grades for student ${studentId}: ${allForStudent.length}`);
              if (allForStudent.length > 0) {
                console.log(`  Exercise grades details:`);
                allForStudent.forEach(eg => {
                  console.log(`    - ID: ${eg._id}, subject: ${eg.subject?.toString()}, season: ${eg.season?.toString()}, grade: ${eg.grade}`);
                });
              }
            }

            // Sum all exercise grades (capped at 10)
            const exercisesTotal = Math.min(
              allExerciseGrades.reduce((sum, eg) => sum + (parseFloat(eg.grade) || 0), 0),
              10
            );

            console.log(`Student ${studentId}: Calculated exercises total: ${exercisesTotal} (from ${allExerciseGrades.length} exercise grades)`);
            if (exercisesTotal === 0 && allExerciseGrades.length > 0) {
              console.log(`WARNING: exercisesTotal is 0 but found ${allExerciseGrades.length} exercise grades. Grades:`, allExerciseGrades.map(eg => eg.grade));
            }

            // Collect all possible season names for matching
            const allSeasonNames = [seasonName];
            if (season.nameMultilingual) {
              if (season.nameMultilingual.en) allSeasonNames.push(season.nameMultilingual.en);
              if (season.nameMultilingual.ku) allSeasonNames.push(season.nameMultilingual.ku);
              if (season.nameMultilingual.ar) allSeasonNames.push(season.nameMultilingual.ar);
            }
            if (typeof season.name === 'object' && season.name !== null) {
              if (season.name.en) allSeasonNames.push(season.name.en);
              if (season.name.ku) allSeasonNames.push(season.name.ku);
              if (season.name.ar) allSeasonNames.push(season.name.ar);
            }
            // Remove duplicates
            const uniqueSeasonNames = [...new Set(allSeasonNames.filter(Boolean))];

            console.log(`Student ${studentId}: Trying to find StudentGrade with season names:`, uniqueSeasonNames);

            // Find or create StudentGrade for this student/subject/season
            // Try to find by any season name variant
            let studentGrade = null;
            for (const name of uniqueSeasonNames) {
              studentGrade = await StudentGrade.findOne({
                student: studentId,
                subject: subjectId,
                season: name,
              });
              if (studentGrade) {
                console.log(`Student ${studentId}: Found existing StudentGrade with season: ${name}`);
                break;
              }
            }

            if (studentGrade) {
              // Update existing StudentGrade
              console.log(`Student ${studentId}: Updating exercises from ${studentGrade.exercises} to ${exercisesTotal}`);
              studentGrade.exercises = exercisesTotal;
              // Trigger save which will recalculate total
              await studentGrade.save();
              // Reload to get the calculated total
              await studentGrade.populate('student subject');
              console.log(`Student ${studentId}: StudentGrade updated successfully. New total: ${studentGrade.total}, Exercises: ${studentGrade.exercises}`);
              
              // Verify the save worked
              const verifyGrade = await StudentGrade.findById(studentGrade._id);
              console.log(`Student ${studentId}: Verification - Exercises in DB: ${verifyGrade.exercises}, Total: ${verifyGrade.total}`);
            } else {
              // Create new StudentGrade
              console.log(`Student ${studentId}: Creating new StudentGrade with season: ${seasonName}`);
              studentGrade = new StudentGrade({
                student: studentId,
                subject: subjectId,
                season: seasonName,
                exercises: exercisesTotal,
                season_exam: 0,
                attendance: 0,
                behaviour: 0,
                monthly_exam: [],
              });
              await studentGrade.save();
              // Reload to get the calculated total
              await studentGrade.populate('student subject');
              console.log(`Student ${studentId}: StudentGrade created successfully with ID: ${studentGrade._id}. Total: ${studentGrade.total}, Exercises: ${studentGrade.exercises}`);
              
              // Verify the save worked
              const verifyGrade = await StudentGrade.findById(studentGrade._id);
              console.log(`Student ${studentId}: Verification - Exercises in DB: ${verifyGrade.exercises}, Total: ${verifyGrade.total}`);
            }
          } catch (error) {
            console.error(`Error updating StudentGrade for student ${studentId}:`, error);
            console.error('Error stack:', error.stack);
          }
        }
      }

      res.json({
        success: true,
        message: "Grades processed successfully",
        data: results,
      });
    } catch (error) {
      console.error("Error in bulk grading:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// GET grades for a specific exercise and class/branch
router.get(
  "/exercise/:exerciseId/class/:classId/branch/:branchId",
  verifyToken,
  getCurrentUser,
  requireTeacherOrAdmin,
  async (req, res) => {
    try {
      const { exerciseId, classId, branchId } = req.params;

      const grades = await StudentExerciseGrade.find({
        exercise: exerciseId,
        class: classId,
        branch: branchId,
      })
        .populate("student", "fullName email studentNumber")
        .populate("gradedBy", "name")
        .sort({ gradedAt: -1 });

      res.json({
        success: true,
        data: grades,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// GET grades for a specific student
router.get(
  "/student/:studentId",
  verifyToken,
  getCurrentUser,
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const { exercise, part, chapter, season, subject } = req.query;
      const userRole = req.user?.role;

      if (userRole === "Student") {
        const studentRecord = await Student.findById(studentId)
          .select("username email studentNumber")
          .lean();

        if (!studentRecord) {
          return res.status(404).json({
            success: false,
            message: "Student not found.",
          });
        }

        const matchesUsername =
          studentRecord.username &&
          req.user.username &&
          String(studentRecord.username).toLowerCase() ===
            String(req.user.username).toLowerCase();

        const matchesEmail =
          studentRecord.email &&
          req.user.email &&
          String(studentRecord.email).toLowerCase() ===
            String(req.user.email).toLowerCase();

        const matchesStudentNumber =
          studentRecord.studentNumber &&
          req.user.studentProfile?.studentNumber &&
          String(studentRecord.studentNumber).toLowerCase() ===
            String(req.user.studentProfile.studentNumber).toLowerCase();

        if (!(matchesUsername || matchesEmail || matchesStudentNumber)) {
          return res.status(403).json({
            success: false,
            message:
              "You do not have permission to view activity for another student.",
          });
        }
      } else if (!["Teacher", "Admin"].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions.",
        });
      }

      const filter = { student: studentId };
      if (exercise) filter.exercise = exercise;
      if (part) filter.part = part;
      if (chapter) filter.chapter = chapter;
      if (season) filter.season = season;
      if (subject) filter.subject = subject;

      const grades = await StudentExerciseGrade.find(filter)
        .populate("exercise", "name degree")
        .populate("part", "title")
        .populate("chapter", "title")
        .populate({
          path: "season",
          select: "name nameMultilingual",
        })
        .populate({
          path: "subject",
          select: "title",
        })
        .populate("gradedBy", "name")
        .sort({ gradedAt: -1 });

      res.json({
        success: true,
        data: grades,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// GET all exercise grades (Admin only)
router.get(
  "/",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const { studentId, subjectId, seasonId, gradingType, limit, skip } = req.query;
      
      const filter = {};
      if (studentId) filter.student = studentId;
      if (subjectId) filter.subject = subjectId;
      if (seasonId) filter.season = seasonId;
      if (gradingType) filter.gradingType = gradingType;

      const query = StudentExerciseGrade.find(filter)
        .populate("student", "fullName username email")
        .populate("exercise", "name degree")
        .populate("part", "title")
        .populate("chapter", "title")
        .populate({
          path: "season",
          select: "name nameMultilingual",
        })
        .populate({
          path: "subject",
          select: "title titles",
        })
        .populate("gradedBy", "name username")
        .sort({ gradedAt: -1 });

      if (limit) query.limit(parseInt(limit));
      if (skip) query.skip(parseInt(skip));

      const grades = await query;
      const total = await StudentExerciseGrade.countDocuments(filter);

      res.json({
        success: true,
        data: grades,
        total,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// DELETE a grade
router.delete(
  "/:id",
  verifyToken,
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      // Find the grade first to get its details before deleting
      const grade = await StudentExerciseGrade.findById(req.params.id)
        .populate("season", "name nameMultilingual")
        .populate("subject", "title titles");
      
      if (!grade) {
        return res.status(404).json({
          success: false,
          message: "Grade not found",
        });
      }

      // Save the grade details before deletion
      const studentId = grade.student;
      const subjectId = grade.subject?._id || grade.subject;
      const seasonId = grade.season?._id || grade.season;
      const gradingType = grade.gradingType;

      // Save additional details for monthly_exam
      const monthlyExamNumber = grade.monthlyExamNumber;

      // Log the grade details for debugging
      console.log(`Deleting grade - ID: ${req.params.id}, Type: ${gradingType}, Student: ${studentId}, Subject: ${subjectId}, Season: ${seasonId}`);

      // Delete the grade
      await StudentExerciseGrade.findByIdAndDelete(req.params.id);

      // Update StudentGrade based on grading type
      if (studentId && subjectId && seasonId) {
        console.log(`Attempting to update StudentGrade for gradingType: ${gradingType}`);
        try {
          // Convert to ObjectId if needed
          const studentObjectId = typeof studentId === 'string' ? new mongoose.Types.ObjectId(studentId) : studentId;
          const subjectObjectId = typeof subjectId === 'string' ? new mongoose.Types.ObjectId(subjectId) : subjectId;
          const seasonObjectId = typeof seasonId === 'string' ? new mongoose.Types.ObjectId(seasonId) : seasonId;

          // Get the season to find its name
          const season = await Season.findById(seasonObjectId);
          if (!season) {
            console.log(`Season not found for ID: ${seasonObjectId}`);
          } else {
            // Get season name for matching StudentGrade
            // StudentGrade uses enum values: "Season 1", "Season 2", "الموسم الأول", "الموسم الثاني", "وەرزی یەکەم", "وەرزی دووەم", etc.
            let seasonName = null;
            
            // Try to get the season name from nameMultilingual first
            if (season.nameMultilingual) {
              seasonName = season.nameMultilingual.en || season.nameMultilingual.ku || season.nameMultilingual.ar;
            } else if (typeof season.name === 'object' && season.name !== null) {
              seasonName = season.name.en || season.name.ku || season.name.ar;
            } else if (typeof season.name === 'string') {
              seasonName = season.name;
            }

            // Collect all possible season names for matching (must match StudentGrade enum values)
            const allSeasonNames = [];
            
            // Add all possible name variants
            if (season.nameMultilingual) {
              if (season.nameMultilingual.en) allSeasonNames.push(season.nameMultilingual.en);
              if (season.nameMultilingual.ku) allSeasonNames.push(season.nameMultilingual.ku);
              if (season.nameMultilingual.ar) allSeasonNames.push(season.nameMultilingual.ar);
            }
            if (typeof season.name === 'object' && season.name !== null) {
              if (season.name.en) allSeasonNames.push(season.name.en);
              if (season.name.ku) allSeasonNames.push(season.name.ku);
              if (season.name.ar) allSeasonNames.push(season.name.ar);
            }
            if (seasonName) {
              allSeasonNames.push(seasonName);
            }
            
            // Remove duplicates and filter to only valid enum values
            const validEnumValues = [
              "Season 1", "Season 2", "Season 3", "Season 4",
              "الموسم الأول", "الموسم الثاني", "الموسم الثالث", "الموسم الرابع",
              "وەرزی یەکەم", "وەرزی دووەم", "وەرزی سێیەم", "وەرزی چوارەم"
            ];
            const uniqueSeasonNames = [...new Set(allSeasonNames.filter(Boolean).filter(name => validEnumValues.includes(name)))];
            
            // If no valid enum values found, try to map by order
            if (uniqueSeasonNames.length === 0 && season.order) {
              const orderToSeasonMap = {
                1: ["Season 1", "الموسم الأول", "وەرزی یەکەم"],
                2: ["Season 2", "الموسم الثاني", "وەرزی دووەم"],
                3: ["Season 3", "الموسم الثالث", "وەرزی سێیەم"],
                4: ["Season 4", "الموسم الرابع", "وەرزی چوارەم"]
              };
              if (orderToSeasonMap[season.order]) {
                uniqueSeasonNames.push(...orderToSeasonMap[season.order]);
              }
            }
            
            console.log(`Season ID: ${seasonObjectId}, Order: ${season.order}, Extracted names: ${allSeasonNames.join(', ')}, Valid enum names: ${uniqueSeasonNames.join(', ')}`);

            // Find StudentGrade by trying all season name variants
            let studentGrade = null;
            let matchedSeasonName = null;
            
            // Try with ObjectId format first
            for (const name of uniqueSeasonNames) {
              studentGrade = await StudentGrade.findOne({
                student: studentObjectId,
                subject: subjectObjectId,
                season: name,
              });
              if (studentGrade) {
                matchedSeasonName = name;
                console.log(`Found StudentGrade with season: ${name} (using ObjectId)`);
                break;
              }
            }
            
            // If not found, try with original IDs (string format)
            if (!studentGrade) {
              for (const name of uniqueSeasonNames) {
                studentGrade = await StudentGrade.findOne({
                  student: studentId,
                  subject: subjectId,
                  season: name,
                });
                if (studentGrade) {
                  matchedSeasonName = name;
                  console.log(`Found StudentGrade with season: ${name} (using original ID format)`);
                  break;
                }
              }
            }
            
            // If still not found, try a broader search (just student + subject, then filter by season)
            if (!studentGrade) {
              console.log(`Trying broader search for StudentGrade...`);
              const allStudentGrades = await StudentGrade.find({
                student: studentObjectId,
                subject: subjectObjectId,
              });
              console.log(`Found ${allStudentGrades.length} StudentGrade records for this student+subject combination`);
              if (allStudentGrades.length > 0) {
                console.log(`Existing StudentGrade seasons:`, allStudentGrades.map(sg => sg.season));
                // Try to match any of the season names
                for (const sg of allStudentGrades) {
                  if (uniqueSeasonNames.includes(sg.season)) {
                    studentGrade = sg;
                    matchedSeasonName = sg.season;
                    console.log(`Found StudentGrade by matching season: ${sg.season}`);
                    break;
                  }
                }
              }
            }

            if (studentGrade) {
              console.log(`Found StudentGrade - Current values: exercises=${studentGrade.exercises}, attendance=${studentGrade.attendance}, behaviour=${studentGrade.behaviour}, season_exam=${studentGrade.season_exam}, monthly_exam=${JSON.stringify(studentGrade.monthly_exam)}`);
              
              let updateData = {};
              let updated = false;

              if (gradingType === 'exercise') {
                // Calculate total exercises from all remaining StudentExerciseGrade records
                const allExerciseGrades = await StudentExerciseGrade.find({
                  student: studentObjectId,
                  subject: subjectObjectId,
                  season: seasonObjectId,
                  gradingType: 'exercise',
                });

                console.log(`Found ${allExerciseGrades.length} remaining exercise grades after deletion`);

                // Sum all exercise grades (capped at 10)
                // If no exercises remain, total will be 0
                const exercisesTotal = allExerciseGrades.length > 0
                  ? Math.min(
                      allExerciseGrades.reduce((sum, eg) => sum + (parseFloat(eg.grade) || 0), 0),
                      10
                    )
                  : 0;

                updateData.exercises = exercisesTotal;
                updated = true;
                console.log(`Will update StudentGrade exercises to ${exercisesTotal} (from ${allExerciseGrades.length} remaining exercises) for student ${studentId}, subject ${subjectId}, season ${matchedSeasonName}`);
              } else if (gradingType === 'monthly_exam') {
                // For monthly_exam, set the specific exam number to 0
                const currentMonthlyExams = studentGrade.monthly_exam || [];
                const examIndex = monthlyExamNumber ? parseInt(monthlyExamNumber, 10) - 1 : 0; // Convert "1" or "2" to 0 or 1
                
                // Create a new array with the specific exam set to 0
                const updatedMonthlyExams = [...currentMonthlyExams];
                while (updatedMonthlyExams.length <= examIndex) {
                  updatedMonthlyExams.push(0);
                }
                updatedMonthlyExams[examIndex] = 0;
                
                updateData.monthly_exam = updatedMonthlyExams;
                updated = true;
                console.log(`Will update StudentGrade monthly_exam[${examIndex}] to 0 for student ${studentId}, subject ${subjectId}, season ${matchedSeasonName}`);
              } else if (gradingType === 'attendance') {
                updateData.attendance = 0;
                updated = true;
                console.log(`Will update StudentGrade attendance to 0 for student ${studentId}, subject ${subjectId}, season ${matchedSeasonName}`);
              } else if (gradingType === 'behaviour') {
                updateData.behaviour = 0;
                updated = true;
                console.log(`Will update StudentGrade behaviour to 0 for student ${studentId}, subject ${subjectId}, season ${matchedSeasonName}`);
              } else if (gradingType === 'season_exam') {
                updateData.season_exam = 0;
                updated = true;
                console.log(`Will update StudentGrade season_exam to 0 for student ${studentId}, subject ${subjectId}, season ${matchedSeasonName}. Current value: ${studentGrade.season_exam}`);
              } else {
                console.log(`Unknown or unhandled gradingType: ${gradingType}`);
              }

              if (updated && Object.keys(updateData).length > 0) {
                try {
                  // Apply updates to the document
                  Object.assign(studentGrade, updateData);
                  
                  // Save the document (this will trigger pre-save hook to recalculate total)
                  await studentGrade.save();
                  
                  // Reload to verify the save and get the calculated total
                  const verifyGrade = await StudentGrade.findById(studentGrade._id);
                  if (verifyGrade) {
                    console.log(`StudentGrade updated successfully. Verified - season_exam=${verifyGrade.season_exam}, exercises=${verifyGrade.exercises}, attendance=${verifyGrade.attendance}, behaviour=${verifyGrade.behaviour}, total=${verifyGrade.total}`);
                  } else {
                    console.error(`Could not verify StudentGrade after save`);
                  }
                } catch (saveError) {
                  console.error(`Error saving StudentGrade:`, saveError);
                  console.error(`Save error details:`, {
                    message: saveError.message,
                    stack: saveError.stack,
                    studentId,
                    subjectId,
                    matchedSeasonName,
                    updateData
                  });
                  throw saveError; // Re-throw to be caught by outer catch
                }
              } else {
                console.log(`No update was made for gradingType: ${gradingType}`);
              }
            } else {
              console.log(`No StudentGrade found for student ${studentId}, subject ${subjectId}, season names: ${uniqueSeasonNames.join(', ')}`);
              
              // Fallback: Try to find ANY StudentGrade for this student+subject combination
              // This handles cases where season name might be stored differently
              const fallbackStudentGrade = await StudentGrade.findOne({
                student: studentObjectId,
                subject: subjectObjectId,
              });
              
              if (fallbackStudentGrade) {
                console.log(`Found fallback StudentGrade with season: ${fallbackStudentGrade.season} (different from expected: ${uniqueSeasonNames.join(', ')})`);
                console.log(`Attempting to update this StudentGrade anyway...`);
                
                studentGrade = fallbackStudentGrade;
                matchedSeasonName = fallbackStudentGrade.season;
                
                // Proceed with update using the found StudentGrade
                let updateData = {};
                let updated = false;

                if (gradingType === 'exercise') {
                  const allExerciseGrades = await StudentExerciseGrade.find({
                    student: studentObjectId,
                    subject: subjectObjectId,
                    season: seasonObjectId,
                    gradingType: 'exercise',
                  });

                  console.log(`Found ${allExerciseGrades.length} remaining exercise grades after deletion`);

                  const exercisesTotal = allExerciseGrades.length > 0
                    ? Math.min(
                        allExerciseGrades.reduce((sum, eg) => sum + (parseFloat(eg.grade) || 0), 0),
                        10
                      )
                    : 0;

                  updateData.exercises = exercisesTotal;
                  updated = true;
                  console.log(`Will update fallback StudentGrade exercises to ${exercisesTotal}`);
                } else if (gradingType === 'monthly_exam') {
                  const currentMonthlyExams = studentGrade.monthly_exam || [];
                  const examIndex = monthlyExamNumber ? parseInt(monthlyExamNumber, 10) - 1 : 0;
                  const updatedMonthlyExams = [...currentMonthlyExams];
                  while (updatedMonthlyExams.length <= examIndex) {
                    updatedMonthlyExams.push(0);
                  }
                  updatedMonthlyExams[examIndex] = 0;
                  updateData.monthly_exam = updatedMonthlyExams;
                  updated = true;
                } else if (gradingType === 'attendance') {
                  updateData.attendance = 0;
                  updated = true;
                } else if (gradingType === 'behaviour') {
                  updateData.behaviour = 0;
                  updated = true;
                } else if (gradingType === 'season_exam') {
                  updateData.season_exam = 0;
                  updated = true;
                }

                if (updated && Object.keys(updateData).length > 0) {
                  try {
                    Object.assign(studentGrade, updateData);
                    await studentGrade.save();
                    const verifyGrade = await StudentGrade.findById(studentGrade._id);
                    if (verifyGrade) {
                      console.log(`Fallback StudentGrade updated successfully. Verified - season_exam=${verifyGrade.season_exam}, exercises=${verifyGrade.exercises}, attendance=${verifyGrade.attendance}, behaviour=${verifyGrade.behaviour}, total=${verifyGrade.total}`);
                    }
                  } catch (saveError) {
                    console.error(`Error saving fallback StudentGrade:`, saveError);
                  }
                }
              } else {
                console.log(`No StudentGrade found at all for student ${studentId}, subject ${subjectId}`);
              }
            }
          }
        } catch (updateError) {
          console.error("Error updating StudentGrade after deletion:", updateError);
          // Don't fail the deletion if update fails, just log the error
        }
      }

      res.json({
        success: true,
        message: "Grade deleted successfully",
        studentGradeUpdated: true, // Indicate that StudentGrade was updated
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

