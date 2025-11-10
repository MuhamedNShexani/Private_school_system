const mongoose = require("mongoose");
require("dotenv").config();

const Subject = require("../models/Subject");

const cleanupSubjects = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("Connected to MongoDB");

    console.log("Cleaning up subjects data...");

    // Remove the old chapter field from all subjects
    const result = await Subject.updateMany(
      { chapter: { $exists: true } },
      { $unset: { chapter: "" } }
    );

    console.log(`Updated ${result.modifiedCount} subjects`);
    console.log("Subjects cleanup completed successfully!");
  } catch (error) {
    console.error("Error cleaning up subjects:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

cleanupSubjects();
