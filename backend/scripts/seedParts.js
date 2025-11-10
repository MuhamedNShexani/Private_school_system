const mongoose = require("mongoose");
require("dotenv").config();

const Part = require("../models/Part");
const Chapter = require("../models/Chapter");
const Season = require("../models/Season");

const seedParts = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );

    console.log("Connected to MongoDB");

    // Clear existing parts
    await Part.deleteMany({});
    console.log("Cleared existing parts");

    // Get all chapters
    const chapters = await Chapter.find({}).populate("season");
    console.log(`Found ${chapters.length} chapters`);

    if (chapters.length === 0) {
      console.log("No chapters found. Please run seedCurriculum.js first.");
      return;
    }

    const partsData = [];

    // Create parts for each chapter
    for (const chapter of chapters) {
      const partsPerChapter = 3; // 3 parts per chapter

      for (let i = 1; i <= partsPerChapter; i++) {
        const difficultyLevels = ["Beginner", "Intermediate", "Advanced"];
        const difficulties = ["Easy", "Medium", "Hard"]; // For subjects compatibility

        const partData = {
          title: `${chapter.title} - Part ${i}`,
          description: `This is part ${i} of ${chapter.title}. Learn fundamental concepts and practice exercises.`,
          content: `
            <h2>Part ${i}: ${chapter.title}</h2>
            <p>Welcome to part ${i} of ${chapter.title}. In this section, you will learn:</p>
            <ul>
              <li>Key concepts and theories</li>
              <li>Practical applications</li>
              <li>Problem-solving techniques</li>
              <li>Real-world examples</li>
            </ul>
            <h3>Learning Objectives</h3>
            <p>By the end of this part, you will be able to:</p>
            <ul>
              <li>Understand the core concepts</li>
              <li>Apply knowledge to solve problems</li>
              <li>Analyze different scenarios</li>
              <li>Evaluate your understanding</li>
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
          chapter: chapter._id,
          order: i,
          difficulty: difficultyLevels[i - 1] || "Beginner",
          estimatedTime: 30 + i * 15, // 30, 45, 60 minutes
          learningObjectives: [
            `Understand the fundamental concepts of ${chapter.title}`,
            `Apply theoretical knowledge to practical situations`,
            `Analyze and solve complex problems`,
            `Evaluate different approaches and solutions`,
            `Demonstrate mastery through assessments`,
          ],
          resources: [
            {
              title: "Video Tutorial",
              url: `https://example.com/video/${chapter._id}/part-${i}`,
              type: "Video",
            },
            {
              title: "Study Guide",
              url: `https://example.com/guide/${chapter._id}/part-${i}`,
              type: "Document",
            },
            {
              title: "Practice Exercises",
              url: `https://example.com/exercises/${chapter._id}/part-${i}`,
              type: "Exercise",
            },
            {
              title: "Additional Resources",
              url: `https://example.com/resources/${chapter._id}/part-${i}`,
              type: "Link",
            },
          ],
          isActive: true,
        };

        partsData.push(partData);
      }
    }

    // Insert parts
    const createdParts = await Part.insertMany(partsData);
    console.log(`Created ${createdParts.length} parts`);

    // Display summary
    console.log("\n=== Parts Created ===");
    for (const part of createdParts) {
      const chapter = chapters.find(
        (c) => c._id.toString() === part.chapter.toString()
      );
      console.log(
        `- ${part.title} (${part.difficulty}, ${part.estimatedTime}min) - Chapter: ${chapter?.title}`
      );
    }

    console.log("\nParts seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding parts:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the seeding function
if (require.main === module) {
  seedParts();
}

module.exports = seedParts;
