const mongoose = require("mongoose");
require("dotenv").config();

const Season = require("../models/Season");

const migrateSeasonNames = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("Connected to MongoDB");

    // Get all existing seasons
    const seasons = await Season.find({});
    console.log(`Found ${seasons.length} seasons to migrate`);

    for (const season of seasons) {
      // Check if the season already has multilingual names
      if (typeof season.name === "string") {
        console.log(`Migrating season: ${season.name}`);

        // Create multilingual name structure
        const multilingualName = {
          en: season.name,
          ar: season.name, // Default to English for now
          ku: season.name, // Default to English for now
        };

        // Update the season with multilingual names
        await Season.findByIdAndUpdate(season._id, {
          name: multilingualName,
        });

        console.log(`✓ Migrated season: ${season.name}`);
      } else {
        console.log(
          `Season ${
            season.name?.en || season._id
          } already has multilingual names`
        );
      }
    }

    console.log("\n=== Migration completed ===");

    // Verify the migration
    const updatedSeasons = await Season.find({});
    console.log("\n=== Verification ===");
    for (const season of updatedSeasons) {
      console.log(
        `Season: ${season.name.en} (EN), ${season.name.ar} (AR), ${season.name.ku} (KU)`
      );
    }

    console.log("\nSeason names migration completed successfully!");
  } catch (error) {
    console.error("Error migrating season names:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

migrateSeasonNames();
