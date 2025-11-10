const mongoose = require("mongoose");
const Subject = require("../models/Subject");
const Season = require("../models/Season");
const Chapter = require("../models/Chapter");
const Part = require("../models/Part");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/student_exercises",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Seed curriculum hierarchy
const seedCurriculum = async () => {
  try {
    // Get existing courses
    const subjects = await Subject.find({ isActive: true });

    if (subjects.length === 0) {
      console.log("Please run seedCourses.js first!");
      return;
    }

    // Clear existing curriculum data (optional - remove this in production)
    await Season.deleteMany({});
    await Chapter.deleteMany({});
    await Part.deleteMany({});
    console.log("Cleared existing curriculum data");

    // Create curriculum for each course
    for (const subject of subjects) {
      console.log(`\nCreating curriculum for ${subject.name}...`);

      // Create semesters for each course
      const semesters = [];
      const seasonCount = subject.name.includes("Advanced") ? 3 : 2;

      for (let i = 1; i <= semesterCount; i++) {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() + (i - 1) * 4);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 4);

        const semester = new Season({
          name: `Season ${i}`,
          code: `${course.code}-S${i}`,
          description: `${course.name} - Season ${i}`,
          course: course._id,
          startDate,
          endDate,
          order: i,
        });

        const savedSemester = await semester.save();
        semesters.push(savedSemester);
        console.log(`  ✅ Created ${semester.name}`);
      }

      // Create units for each semester
      for (let s = 0; s < semesters.length; s++) {
        const semester = semesters[s];
        const unitsPerSemester = 4;

        for (let i = 1; i <= unitsPerSemester; i++) {
          const unit = new Chapter({
            name: `Chapter ${i}`,
            code: `${course.code}-S${s + 1}-U${i}`,
            description: `${course.name} - ${semester.name} - Chapter ${i}`,
            semester: semester._id,
            course: course._id,
            objectives: [
              `Understand key concepts in Chapter ${i}`,
              `Apply knowledge to practical problems`,
              `Demonstrate mastery of Chapter ${i} topics`,
            ],
            order: i,
            estimatedHours: 20 + i * 5,
          });

          const savedUnit = await unit.save();
          console.log(`    ✅ Created ${unit.name}`);

          // Create topics for each unit
          const topicsPerUnit = 5;
          for (let j = 1; j <= topicsPerUnit; j++) {
            const difficulty =
              j <= 2 ? "Beginner" : j <= 4 ? "Intermediate" : "Advanced";

            const topic = new Part({
              name: `Part ${j}`,
              code: `${course.code}-S${s + 1}-U${i}-T${j}`,
              description: `${course.name} - ${semester.name} - ${unit.name} - Part ${j}`,
              unit: savedUnit._id,
              semester: semester._id,
              course: course._id,
              learningOutcomes: [
                `Master Part ${j} fundamentals`,
                `Apply Part ${j} concepts`,
                `Evaluate Part ${j} applications`,
              ],
              content: `This topic covers the essential concepts and applications related to Part ${j} in the context of ${course.name}.`,
              resources: [
                {
                  title: `Part ${j} Study Guide`,
                  url: `https://example.com/study-guide-${j}`,
                  type: "Document",
                },
                {
                  title: `Part ${j} Video Tutorial`,
                  url: `https://example.com/video-${j}`,
                  type: "Video",
                },
              ],
              assessmentCriteria: [
                {
                  criterion: "Knowledge Understanding",
                  weight: 30,
                },
                {
                  criterion: "Application Skills",
                  weight: 40,
                },
                {
                  criterion: "Critical Thinking",
                  weight: 30,
                },
              ],
              order: j,
              estimatedHours: 4 + j * 2,
              difficulty,
            });

            await topic.save();
            console.log(`      ✅ Created ${topic.name} (${difficulty})`);
          }
        }
      }
    }

    console.log("\n🎉 Curriculum hierarchy seeding completed successfully!");

    // Print summary
    const totalSemesters = await Season.countDocuments();
    const totalUnits = await Chapter.countDocuments();
    const totalTopics = await Part.countDocuments();

    console.log(`\nSummary:`);
    console.log(`- ${courses.length} courses`);
    console.log(`- ${totalSemesters} semesters`);
    console.log(`- ${totalUnits} units`);
    console.log(`- ${totalTopics} topics`);
  } catch (error) {
    console.error("Error seeding curriculum:", error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeding function
seedCurriculum();
