const mongoose = require("mongoose");
require("dotenv").config();

const Class = require("../models/Class");

const checkClasses = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("Connected to MongoDB");

    // Get all existing classes
    const classes = await Class.find({});
    console.log(`Found ${classes.length} classes in database`);

    if (classes.length > 0) {
      console.log("\n=== Classes in Database ===");
      for (const classData of classes) {
        console.log(`Class ID: ${classData._id}`);
        console.log(`Class Name Type: ${typeof classData.name}`);
        console.log(`Class Name Value:`, classData.name);
        console.log(`Branches: ${classData.branches?.length || 0}`);
        if (classData.branches && classData.branches.length > 0) {
          classData.branches.forEach((branch, index) => {
            console.log(
              `  Branch ${index}: ${branch.name} (type: ${typeof branch.name})`
            );
          });
        }
        console.log("---");
      }
    } else {
      console.log("No classes found in database");
    }
  } catch (error) {
    console.error("Error checking classes:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

checkClasses();
