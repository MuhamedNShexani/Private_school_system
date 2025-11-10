const mongoose = require("mongoose");
require("dotenv").config();

const Subject = require("../models/Subject");

const migrateSubjectTitles = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("Connected to MongoDB");

    // Get all existing subjects
    const subjects = await Subject.find({});
    console.log(`Found ${subjects.length} subjects to migrate`);

    for (const subject of subjects) {
      // Check if the subject already has multilingual titles
      if (typeof subject.title === "string") {
        console.log(`Migrating subject: ${subject.title}`);

        // Create multilingual title structure
        const multilingualTitle = {
          en: subject.title,
          ar: subject.title, // Default to English for now
          ku: subject.title, // Default to English for now
        };

        // Update the subject with multilingual titles
        await Subject.findByIdAndUpdate(subject._id, {
          title: multilingualTitle,
        });

        console.log(`✓ Migrated subject: ${subject.title}`);
      } else {
        console.log(
          `Subject ${
            subject.title?.en || subject._id
          } already has multilingual titles`
        );
      }
    }

    console.log("\n=== Migration completed ===");

    // Verify the migration
    const updatedSubjects = await Subject.find({});
    console.log("\n=== Verification ===");
    for (const subject of updatedSubjects) {
      console.log(
        `Subject: ${subject.title.en} (EN), ${subject.title.ar} (AR), ${subject.title.ku} (KU)`
      );
    }

    console.log("\nSubject titles migration completed successfully!");
  } catch (error) {
    console.error("Error migrating subject titles:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

migrateSubjectTitles();
