const mongoose = require("mongoose");
require("dotenv").config();

const Class = require("../models/Class");

const clearAllClasses = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("Connected to MongoDB");

    // Delete ALL classes
    const result = await Class.deleteMany({});
    console.log(`Deleted ${result.deletedCount} classes from database`);

    console.log("All classes cleared successfully!");
  } catch (error) {
    console.error("Error clearing classes:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

clearAllClasses();
