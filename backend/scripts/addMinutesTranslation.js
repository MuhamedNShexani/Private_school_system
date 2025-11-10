const mongoose = require("mongoose");
require("dotenv").config();

const Translation = require("../models/Translation");

const addMinutesTranslation = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("Connected to MongoDB");

    const minutesTranslation = {
      key: "form.minutes",
      translations: {
        en: "minutes",
        ar: "دقائق",
        ku: "خولەک",
      },
      category: "forms",
      description: "Minutes unit label",
    };

    const existing = await Translation.findOne({ key: minutesTranslation.key });

    if (!existing) {
      await Translation.create(minutesTranslation);
      console.log("Added 'form.minutes' translation");
    } else {
      console.log("Translation already exists");
    }

    console.log("Minutes translation added successfully!");
  } catch (error) {
    console.error("Error adding minutes translation:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

addMinutesTranslation();
