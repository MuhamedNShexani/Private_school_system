const mongoose = require("mongoose");
require("dotenv").config();

const Translation = require("../models/Translation");

const addChapterTranslations = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("Connected to MongoDB");

    const chapterTranslations = [
      {
        key: "programs.chapter_count",
        translations: {
          en: "Chapter",
          ar: "فصل",
          ku: "بەش",
        },
        category: "programs",
        description: "Single chapter count label",
      },
      {
        key: "programs.chapters_count",
        translations: {
          en: "Chapters",
          ar: "فصول",
          ku: "بەشەکان",
        },
        category: "programs",
        description: "Multiple chapters count label",
      },
    ];

    for (const translation of chapterTranslations) {
      const existing = await Translation.findOne({ key: translation.key });

      if (!existing) {
        await Translation.create(translation);
        console.log(`Added '${translation.key}' translation`);
      } else {
        console.log(`Translation '${translation.key}' already exists`);
      }
    }

    console.log("Chapter translations added successfully!");
  } catch (error) {
    console.error("Error adding chapter translations:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

addChapterTranslations();
