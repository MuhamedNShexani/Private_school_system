const mongoose = require("mongoose");
require("dotenv").config();

const Subject = require("../models/Subject");
const Chapter = require("../models/Chapter");
const Part = require("../models/Part");
const Season = require("../models/Season");

const migrateDataStructure = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("Connected to MongoDB");

    console.log("Starting data structure migration...");

    // Get all subjects
    const subjects = await Subject.find({});
    console.log(`Found ${subjects.length} subjects to migrate`);

    // Get all chapters
    const chapters = await Chapter.find({}).populate("season");
    console.log(`Found ${chapters.length} chapters to migrate`);

    // Get all parts
    const parts = await Part.find({}).populate("chapter");
    console.log(`Found ${parts.length} parts to migrate`);

    // First, let's clear all existing chapters and parts to start fresh
    console.log("Clearing existing chapters and parts...");
    await Part.deleteMany({});
    await Chapter.deleteMany({});
    console.log("Cleared existing data");

    // For each subject, create its own chapters and parts
    for (const subject of subjects) {
      console.log(`\nProcessing subject: ${subject.title}`);

      // Create chapters for this subject based on the original chapters
      const seasons = ["Season 1", "Season 2", "Season 3", "Season 4"];

      for (let i = 0; i < seasons.length; i++) {
        const seasonName = seasons[i];
        const order = i + 1;

        // Create a chapter for this season
        const newChapter = new Chapter({
          title: `${subject.title} - ${seasonName}`,
          description: `This chapter covers ${seasonName} content for ${subject.title}`,
          subject: subject._id,
          season: seasonName,
          order: order,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const savedChapter = await newChapter.save();
        console.log(`  Created chapter: ${savedChapter.title}`);

        // Create 3 parts for this chapter
        for (let j = 1; j <= 3; j++) {
          const difficultyLevels = ["Beginner", "Intermediate", "Advanced"];

          const newPart = new Part({
            title: `${subject.title} - ${seasonName} - Part ${j}`,
            description: `This is part ${j} of ${seasonName} in ${subject.title}. Learn fundamental concepts and practice exercises.`,
            content: `
              <h3>Introduction to ${subject.title} ${seasonName} Part ${j}</h3>
              <p>Welcome to this section! Here, we will dive deep into the core concepts of ${subject.title}.</p>
              <h4>Key Learning Points:</h4>
              <ul>
                <li>Understanding basic principles</li>
                <li>Exploring advanced techniques</li>
                <li>Real-world applications</li>
              </ul>
              <h3>Practice Exercises</h3>
              <p>Complete the following exercises to reinforce your learning:</p>
              <ol>
                <li>Conceptual questions</li>
                <li>Problem-solving tasks</li>
                <li>Analysis exercises</li>
                <li>Application scenarios</li>
              </ol>
            `,
            chapter: savedChapter._id,
            order: j,
            difficulty: difficultyLevels[j - 1] || "Beginner",
            estimatedTime: 30 + j * 15, // 30, 45, 60 minutes
            learningObjectives: [
              `Understand the fundamental concepts of ${subject.title}`,
              `Apply theoretical knowledge to practical situations`,
              `Analyze and solve complex problems`,
              `Evaluate different approaches and solutions`,
              `Demonstrate mastery through assessments`,
            ],
            resources: [
              {
                title: "Video Tutorial",
                url: `https://example.com/video/${subject._id}/${seasonName}/part-${j}`,
                type: "Video",
              },
              {
                title: "Study Guide",
                url: `https://example.com/guide/${subject._id}/${seasonName}/part-${j}`,
                type: "Document",
              },
              {
                title: "Practice Exercises",
                url: `https://example.com/exercises/${subject._id}/${seasonName}/part-${j}`,
                type: "Exercise",
              },
            ],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          await newPart.save();
          console.log(`    Created part: ${newPart.title}`);
        }
      }
    }

    console.log("\nData migration completed successfully!");

    console.log("\n=== Migration Summary ===");
    const finalSubjects = await Subject.countDocuments();
    const finalChapters = await Chapter.countDocuments();
    const finalParts = await Part.countDocuments();

    console.log(`Final counts:`);
    console.log(`- Subjects: ${finalSubjects}`);
    console.log(`- Chapters: ${finalChapters}`);
    console.log(`- Parts: ${finalParts}`);

    console.log("\nData structure migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

migrateDataStructure();
