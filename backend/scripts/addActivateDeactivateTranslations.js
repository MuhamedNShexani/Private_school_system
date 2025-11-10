const mongoose = require("mongoose");
require("dotenv").config();

const Translation = require("../models/Translation");

const addActivateDeactivateTranslations = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("Connected to MongoDB");

    const activateDeactivateTranslations = [
      {
        key: "btn.activate",
        translations: {
          en: "Activate",
          ar: "تفعيل",
          ku: "چالاککردن",
        },
        category: "buttons",
        description: "Activate button",
      },
      {
        key: "btn.deactivate",
        translations: {
          en: "Deactivate",
          ar: "إلغاء التفعيل",
          ku: "ناچالاککردن",
        },
        category: "buttons",
        description: "Deactivate button",
      },
    ];

    for (const translation of activateDeactivateTranslations) {
      const existing = await Translation.findOne({ key: translation.key });

      if (!existing) {
        await Translation.create(translation);
        console.log(`Added '${translation.key}' translation`);
      } else {
        console.log(`Translation '${translation.key}' already exists`);
      }
    }

    console.log("Activate/Deactivate translations added successfully!");
  } catch (error) {
    console.error("Error adding activate/deactivate translations:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

addActivateDeactivateTranslations();
