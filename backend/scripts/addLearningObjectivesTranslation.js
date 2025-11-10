const mongoose = require("mongoose");
require("dotenv").config();

const Translation = require("../models/Translation");

const addLearningObjectivesTranslation = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("Connected to MongoDB");

    const learningObjectivesTranslation = {
      key: "form.learning_objectives",
      translations: {
        en: "Learning Objectives:",
        ar: "أهداف التعلم:",
        ku: "ئامانجەکانی فێربوون:",
      },
      category: "forms",
      description: "Learning objectives label",
    };

    const existing = await Translation.findOne({
      key: learningObjectivesTranslation.key,
    });

    if (!existing) {
      await Translation.create(learningObjectivesTranslation);
      console.log("Added 'form.learning_objectives' translation");
    } else {
      console.log("Translation already exists");
    }

    console.log("Learning objectives translation added successfully!");
  } catch (error) {
    console.error("Error adding learning objectives translation:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

addLearningObjectivesTranslation();
