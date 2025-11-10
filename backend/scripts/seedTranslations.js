const mongoose = require("mongoose");
require("dotenv").config();

const Translation = require("../models/Translation");

const seedTranslations = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("Connected to MongoDB");

    const translationsData = [
      {
        key: "chapterQuizzes.playQuiz",
        translations: {
          en: "Play Quiz",
          ar: "لعب الاختبار",
          ku: "کوییز بلێ",
        },
        category: "general",
        description: "Play quiz button",
      },
    ];

    // Safety check: only proceed if we have translation data
    if (!translationsData || translationsData.length === 0) {
      console.error(
        "ERROR: translationsData is empty! Aborting to prevent database deletion."
      );
      console.error(
        "Please check that translationsData array is properly defined in this file."
      );
      await mongoose.disconnect();
      process.exit(1);
    }

    // // Clear existing translations only if we have new data to insert
    // console.log("Clearing existing translations...");
    // await Translation.deleteMany({});
    // console.log("Cleared existing translations");

    try {
      await Translation.insertMany(translationsData, { ordered: false });
      console.log(`Created ${translationsData.length} translations`);
    } catch (bulkError) {
      // Continue even if there are duplicate key errors, as we still want to insert the rest
      if (bulkError.code === 11000) {
        console.log(
          "Some duplicate keys encountered (expected), continuing..."
        );
        const inserted = bulkError.result ? bulkError.result.insertedCount : 0;
        console.log(`Inserted ${inserted} translations despite duplicates`);
      } else {
        throw bulkError;
      }
    }

    console.log("\n=== Translations Created ===");
    const createdTranslations = await Translation.find({}).sort({
      category: 1,
      key: 1,
    });
    for (const translation of createdTranslations) {
      console.log(
        `- ${translation.key} (${translation.category}): ${translation.translations.en}`
      );
    }

    console.log("\nTranslations seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding translations:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

seedTranslations();
