const mongoose = require("mongoose");
const Translation = require("../models/Translation");

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI ||
      "mongodb://localhost:27017/student-exercise-platform"
  )
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Failed load programs translation
const failedLoadProgramsTranslation = {
  key: "msg.failed_load_programs",
  translations: {
    en: "Failed to load programs. Please try again.",
    ar: "فشل في تحميل البرامج. يرجى المحاولة مرة أخرى.",
    ku: "سەرکەوتوو نەبوو لە بارکردنی بەرنامەکان. تکایە دووبارە هەوڵ بدە.",
  },
  category: "messages",
  description: "Error message when loading programs fails",
};

// Function to add translation
async function addFailedLoadProgramsTranslation() {
  try {
    console.log("Adding failed load programs translation...");

    // Check if translation already exists
    const existingTranslation = await Translation.findOne({
      key: failedLoadProgramsTranslation.key,
    });

    if (existingTranslation) {
      // Update existing translation
      await Translation.findByIdAndUpdate(
        existingTranslation._id,
        failedLoadProgramsTranslation,
        { new: true, runValidators: true }
      );
      console.log(`Updated translation: ${failedLoadProgramsTranslation.key}`);
    } else {
      // Create new translation
      const translation = new Translation(failedLoadProgramsTranslation);
      await translation.save();
      console.log(`Added translation: ${failedLoadProgramsTranslation.key}`);
    }

    console.log("Failed load programs translation added successfully!");
  } catch (error) {
    console.error("Error adding failed load programs translation:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
addFailedLoadProgramsTranslation();
