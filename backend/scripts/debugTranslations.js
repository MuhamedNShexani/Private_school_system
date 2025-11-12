const mongoose = require("mongoose");
require("dotenv").config();

const Translation = require("../models/Translation");

const debugTranslations = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("✅ Connected to MongoDB\n");

    // 1. Count all translations
    const totalCount = await Translation.countDocuments({});
    console.log(`📊 Total translations in database: ${totalCount}`);

    // 2. Count active translations
    const activeCount = await Translation.countDocuments({ isActive: true });
    console.log(`✅ Active translations: ${activeCount}`);

    // 3. Count chapterQuizzes translations
    const quizCount = await Translation.countDocuments({
      key: { $regex: "chapterQuizzes" },
      isActive: true,
    });
    console.log(`📝 chapterQuizzes translations: ${quizCount}`);

    // 4. Test API response format
    console.log("\n🔍 Testing API Response Format (English):\n");
    const allTranslations = await Translation.find({ isActive: true }).sort({
      key: 1,
    });

    const languageTranslations = {};
    allTranslations.forEach((translation) => {
      languageTranslations[translation.key] = translation.translations.en;
    });

    console.log(`Total keys in response: ${Object.keys(languageTranslations).length}`);
    
    // Show first 10
    console.log("\nFirst 10 translations:");
    Object.entries(languageTranslations)
      .slice(0, 10)
      .forEach(([key, value]) => {
        console.log(`  ${key}: "${value}"`);
      });

    // Check if quiz translations are included
    console.log("\n🎯 Checking Quiz Translations:");
    const quizTranslations = Object.entries(languageTranslations).filter(
      ([key]) => key.includes("chapterQuizzes")
    );
    console.log(`Found: ${quizTranslations.length} quiz translations`);
    if (quizTranslations.length > 0) {
      quizTranslations.slice(0, 5).forEach(([key, value]) => {
        console.log(`  ✅ ${key}: "${value}"`);
      });
    } else {
      console.log("  ❌ NO QUIZ TRANSLATIONS FOUND!");
    }

    // Check for other missing translations
    console.log("\n🔍 Checking Other Translations:");
    const otherKeys = [
      "modal.add_quiz",
      "form.training_only",
      "form.training_only_hint",
      "btn.edit_chapter",
      "btn.delete_chapter",
    ];
    
    otherKeys.forEach((key) => {
      const exists = languageTranslations[key];
      if (exists) {
        console.log(`  ✅ ${key}: "${exists}"`);
      } else {
        console.log(`  ❌ ${key}: MISSING!`);
      }
    });

    console.log("\n✅ Debug completed!");
    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
};

debugTranslations();

