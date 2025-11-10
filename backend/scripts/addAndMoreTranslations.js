const mongoose = require("mongoose");
require("dotenv").config();

const Translation = require("../models/Translation");

const addAndMoreTranslations = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("Connected to MongoDB");

    const andMoreTranslations = [
      {
        key: "form.and_more",
        translations: {
          en: "and",
          ar: "و",
          ku: "و",
        },
        category: "forms",
        description: "And connector word",
      },
      {
        key: "form.more",
        translations: {
          en: "more",
          ar: "المزيد",
          ku: "زیاتر",
        },
        category: "forms",
        description: "More word",
      },
    ];

    for (const translation of andMoreTranslations) {
      const existing = await Translation.findOne({ key: translation.key });

      if (!existing) {
        await Translation.create(translation);
        console.log(`Added '${translation.key}' translation`);
      } else {
        console.log(`Translation '${translation.key}' already exists`);
      }
    }

    console.log("And/More translations added successfully!");
  } catch (error) {
    console.error("Error adding and/more translations:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

addAndMoreTranslations();
