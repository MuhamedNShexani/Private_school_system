const mongoose = require("mongoose");
require("dotenv").config();

const Class = require("../models/Class");

const seedMultilingualClasses = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("Connected to MongoDB");

    await Class.deleteMany({});
    console.log("Cleared existing classes");

    const classesData = [
      {
        name: {
          en: "Grade 10",
          ar: "الصف العاشر",
          ku: "پۆلی دەیەم",
        },
        branches: [
          {
            name: {
              en: "Science Branch",
              ar: "قسم العلوم",
              ku: "لقی زانست",
            },
            description: "Science focused curriculum",
            isActive: true,
          },
          {
            name: {
              en: "Literature Branch",
              ar: "قسم الأدب",
              ku: "لقی ئەدەبیات",
            },
            description: "Literature focused curriculum",
            isActive: true,
          },
        ],
        isActive: true,
      },
      {
        name: {
          en: "Grade 11",
          ar: "الصف الحادي عشر",
          ku: "پۆلی یازدەیەم",
        },
        branches: [
          {
            name: {
              en: "Science Branch",
              ar: "قسم العلوم",
              ku: "لقی زانست",
            },
            description: "Advanced science curriculum",
            isActive: true,
          },
          {
            name: {
              en: "Literature Branch",
              ar: "قسم الأدب",
              ku: "لقی ئەدەبیات",
            },
            description: "Advanced literature curriculum",
            isActive: true,
          },
        ],
        isActive: true,
      },
      {
        name: {
          en: "Grade 12",
          ar: "الصف الثاني عشر",
          ku: "پۆلی دوازدەیەم",
        },
        branches: [
          {
            name: {
              en: "Science Branch",
              ar: "قسم العلوم",
              ku: "لقی زانست",
            },
            description: "Final year science curriculum",
            isActive: true,
          },
          {
            name: {
              en: "Literature Branch",
              ar: "قسم الأدب",
              ku: "لقی ئەدەبیات",
            },
            description: "Final year literature curriculum",
            isActive: true,
          },
        ],
        isActive: true,
      },
    ];

    await Class.insertMany(classesData);
    console.log(`Created ${classesData.length} multilingual classes`);

    console.log("\n=== Classes Created ===");
    const createdClasses = await Class.find({});
    for (const classData of createdClasses) {
      console.log(
        `- ${classData.name.en} (EN) / ${classData.name.ar} (AR) / ${classData.name.ku} (KU)`
      );
      if (classData.branches && classData.branches.length > 0) {
        classData.branches.forEach((branch) => {
          console.log(
            `  Branch: ${branch.name.en} (EN) / ${branch.name.ar} (AR) / ${branch.name.ku} (KU)`
          );
        });
      }
    }

    console.log("\nMultilingual classes seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding multilingual classes:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

seedMultilingualClasses();
