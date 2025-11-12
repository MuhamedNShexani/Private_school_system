const mongoose = require("mongoose");
require("dotenv").config();

const Translation = require("../models/Translation");

const testTranslations = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("Connected to MongoDB");

    // Find all chapterQuizzes translations
    const translations = await Translation.find({ 
      key: { $regex: "chapterQuizzes" } 
    });

    console.log("\n=== Checking Database ===");
    console.log(`Total chapterQuizzes translations found: ${translations.length}`);

    if (translations.length === 0) {
      console.log("❌ NO TRANSLATIONS FOUND IN DATABASE!");
    } else {
      console.log("\n✅ Translations found:");
      translations.forEach((t) => {
        console.log(`\n- Key: ${t.key}`);
        console.log(`  Active: ${t.isActive}`);
        console.log(`  EN: ${t.translations.en}`);
        console.log(`  AR: ${t.translations.ar}`);
      });
    }

    // Check API response
    console.log("\n=== Checking API Response ===");
    const allTranslations = await Translation.find({ isActive: true });
    console.log(`Total active translations in DB: ${allTranslations.length}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error.message);
  }
};

testTranslations();

