const mongoose = require("mongoose");
require("dotenv").config();

const Exercise = require("../models/Exercise");
const Part = require("../models/Part");

const seedExercises = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );

    console.log("Connected to MongoDB");

    // Clear existing exercises
    await Exercise.deleteMany({});
    console.log("Cleared existing exercises");

    // Get all parts
    const parts = await Part.find({}).populate("chapter");
    console.log(`Found ${parts.length} parts`);

    if (parts.length === 0) {
      console.log("No parts found. Please run seedParts.js first.");
      return;
    }

    const exercisesData = [];

    // Create exercises for each part
    for (const part of parts) {
      const exercisesPerPart = 3; // 3 exercises per part

      for (let i = 1; i <= exercisesPerPart; i++) {
        const degreeValues = [10, 15, 20];

        const exerciseData = {
          name: `Exercise ${i}: ${part.title}`,
          part: part._id,
          degree: degreeValues[i - 1] || 10,
          isActive: true,
        };

        exercisesData.push(exerciseData);
      }
    }

    // Insert exercises
    const createdExercises = await Exercise.insertMany(exercisesData);
    console.log(`Created ${createdExercises.length} exercises`);

    // Display summary
    console.log("\n=== Exercises Created ===");
    for (const exercise of createdExercises) {
      const part = parts.find(
        (p) => p._id.toString() === exercise.part.toString()
      );
      console.log(
        `- ${exercise.name} (${exercise.degree} points) - Part: ${part?.title}`
      );
    }

    console.log("\nExercises seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding exercises:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the seeding function
if (require.main === module) {
  seedExercises();
}

module.exports = seedExercises;

