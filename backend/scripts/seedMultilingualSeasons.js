const mongoose = require("mongoose");
require("dotenv").config();

const Season = require("../models/Season");

const seedMultilingualSeasons = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("Connected to MongoDB");

    // Clear existing seasons
    await Season.deleteMany({});
    console.log("Cleared existing seasons");

    const seasonsData = [
      {
        name: {
          en: "First Semester",
          ar: "الفصل الدراسي الأول",
          ku: "قوتابخانەی یەکەم",
        },
        description: "The first semester of the academic year",
        order: 1,
        isActive: true,
      },
      {
        name: {
          en: "Second Semester",
          ar: "الفصل الدراسي الثاني",
          ku: "قوتابخانەی دووەم",
        },
        description: "The second semester of the academic year",
        order: 2,
        isActive: true,
      },
      {
        name: {
          en: "Summer Session",
          ar: "الجلسة الصيفية",
          ku: "کاتەکانی هاوین",
        },
        description: "Summer intensive learning session",
        order: 3,
        isActive: true,
      },
      {
        name: {
          en: "Winter Break",
          ar: "العطلة الشتوية",
          ku: "پشووی زستان",
        },
        description: "Winter holiday period",
        order: 4,
        isActive: false,
      },
    ];

    await Season.insertMany(seasonsData);
    console.log(`Created ${seasonsData.length} multilingual seasons`);

    console.log("\n=== Seasons Created ===");
    const createdSeasons = await Season.find({});
    for (const season of createdSeasons) {
      console.log(
        `- ${season.name.en} (EN) / ${season.name.ar} (AR) / ${season.name.ku} (KU) - Order: ${season.order}`
      );
    }

    console.log("\nMultilingual seasons seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding multilingual seasons:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

seedMultilingualSeasons();
