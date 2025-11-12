const mongoose = require("mongoose");
const StudentGrade = require("../models/StudentGrade");
const StudentExerciseGrade = require("../models/StudentExerciseGrade");
require("dotenv").config();

async function fixStudentGradeExercises() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/student-platform");
    console.log("✓ Connected to MongoDB");

    // Get all StudentGrade records
    const allStudentGrades = await StudentGrade.find({}).lean();
    console.log(`Found ${allStudentGrades.length} StudentGrade records to process`);

    let updated = 0;
    let errors = 0;

    // Get all seasons to map season names to their IDs
    const Season = require("../models/Season");
    const allSeasons = await Season.find({}).lean();
    
    // Create a mapping of season names to their IDs
    const seasonNameToId = {};
    allSeasons.forEach((season) => {
      // Map all possible season name variants to the season ID
      if (typeof season.name === "string") {
        seasonNameToId[season.name] = season._id;
      } else if (typeof season.name === "object") {
        Object.values(season.name).forEach((name) => {
          if (name) seasonNameToId[name] = season._id;
        });
      }
      if (season.nameMultilingual) {
        Object.values(season.nameMultilingual).forEach((name) => {
          if (name) seasonNameToId[name] = season._id;
        });
      }
    });

    console.log(`\nSeason name mappings created:`, Object.keys(seasonNameToId).length, "variants");

    for (const studentGrade of allStudentGrades) {
      try {
        // Get the season ID from the season name
        const seasonId = seasonNameToId[studentGrade.season];
        
        if (!seasonId) {
          throw new Error(`Season "${studentGrade.season}" not found in database`);
        }

        // Calculate total exercises from StudentExerciseGrade for this student/subject/season
        // Note: StudentExerciseGrade stores season as ObjectId
        const exerciseGrades = await StudentExerciseGrade.find({
          student: studentGrade.student,
          subject: studentGrade.subject,
          season: seasonId, // Use the ObjectId here
          gradingType: "exercise",
        });

        // Sum all exercise grades (capped at 10)
        const exercisesTotal = Math.min(
          exerciseGrades.reduce((sum, eg) => sum + (parseFloat(eg.grade) || 0), 0),
          10
        );

        // Update the StudentGrade with the correct exercises total
        await StudentGrade.findByIdAndUpdate(
          studentGrade._id,
          { exercises: exercisesTotal },
          { runValidators: true }
        );

        console.log(
          `✓ Fixed student ${studentGrade.student.toString().slice(-8)} - Subject: ${studentGrade.subject.toString().slice(-8)} - Season: ${studentGrade.season} - Exercises: ${exercisesTotal} (from ${exerciseGrades.length} grades)`
        );
        updated++;
      } catch (err) {
        console.error(
          `✗ Error processing StudentGrade ${studentGrade._id}:`,
          err.message
        );
        errors++;
      }
    }

    console.log("\n========== MIGRATION SUMMARY ==========");
    console.log(`Total StudentGrade records: ${allStudentGrades.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Errors encountered: ${errors}`);
    console.log("======================================\n");

    await mongoose.connection.close();
    console.log("✓ Migration completed and disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Fatal error during migration:", error);
    process.exit(1);
  }
}

fixStudentGradeExercises();

