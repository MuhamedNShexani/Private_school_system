const mongoose = require("mongoose");
require("dotenv").config();

const Class = require("../models/Class");

const migrateClassNames = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("Connected to MongoDB");

    // Get all existing classes
    const classes = await Class.find({});
    console.log(`Found ${classes.length} classes to migrate`);

    for (const classData of classes) {
      // Check if the class already has multilingual names
      if (typeof classData.name === "string") {
        console.log(`Migrating class: ${classData.name}`);

        // Create multilingual name structure
        const multilingualName = {
          en: classData.name,
          ar: classData.name, // Default to English for now
          ku: classData.name, // Default to English for now
        };

        // Update branches if they exist
        if (classData.branches && classData.branches.length > 0) {
          classData.branches = classData.branches.map((branch) => {
            if (typeof branch.name === "string") {
              return {
                ...branch,
                name: {
                  en: branch.name,
                  ar: branch.name, // Default to English for now
                  ku: branch.name, // Default to English for now
                },
              };
            }
            return branch;
          });
        }

        // Update the class with multilingual names
        await Class.findByIdAndUpdate(classData._id, {
          name: multilingualName,
          branches: classData.branches,
        });

        console.log(`✓ Migrated class: ${classData.name}`);
      } else {
        console.log(
          `Class ${
            classData.name?.en || classData._id
          } already has multilingual names`
        );
      }
    }

    console.log("\n=== Migration completed ===");

    // Verify the migration
    const updatedClasses = await Class.find({});
    console.log("\n=== Verification ===");
    for (const classData of updatedClasses) {
      console.log(
        `Class: ${classData.name.en} (EN), ${classData.name.ar} (AR), ${classData.name.ku} (KU)`
      );
      if (classData.branches && classData.branches.length > 0) {
        classData.branches.forEach((branch) => {
          console.log(
            `  Branch: ${branch.name.en} (EN), ${branch.name.ar} (AR), ${branch.name.ku} (KU)`
          );
        });
      }
    }

    console.log("\nClass names migration completed successfully!");
  } catch (error) {
    console.error("Error migrating class names:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

migrateClassNames();
