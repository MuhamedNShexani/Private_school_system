const mongoose = require("mongoose");
require("dotenv").config();

const Translation = require("../models/Translation");

const addViewPartsTranslation = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("Connected to MongoDB");

    const viewPartsTranslation = {
      key: "programs.view_parts",
      translations: {
        en: "View Parts",
        ar: "عرض الأجزاء",
        ku: "بەشەکان ببینە",
      },
      category: "programs",
      description: "View parts button text",
    };

    // Check if translation already exists
    const existing = await Translation.findOne({
      key: viewPartsTranslation.key,
    });

    if (!existing) {
      await Translation.create(viewPartsTranslation);
      console.log("Added 'programs.view_parts' translation");
    } else {
      console.log("Translation already exists");
    }

    console.log("View parts translation added successfully!");
  } catch (error) {
    console.error("Error adding view parts translation:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

addViewPartsTranslation();
