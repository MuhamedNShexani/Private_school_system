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

// Loading programs translation
const loadingProgramsTranslation = {
  key: "msg.loading_programs",
  translations: {
    en: "Loading programs...",
    ar: "جاري تحميل البرامج...",
    ku: "بەرنامەکان باردەکەم...",
  },
  category: "messages",
  description: "Loading message for programs",
};

// Function to add translation
async function addLoadingProgramsTranslation() {
  try {
    console.log("Adding loading programs translation...");

    // Check if translation already exists
    const existingTranslation = await Translation.findOne({
      key: loadingProgramsTranslation.key,
    });

    if (existingTranslation) {
      // Update existing translation
      await Translation.findByIdAndUpdate(
        existingTranslation._id,
        loadingProgramsTranslation,
        { new: true, runValidators: true }
      );
      console.log(`Updated translation: ${loadingProgramsTranslation.key}`);
    } else {
      // Create new translation
      const translation = new Translation(loadingProgramsTranslation);
      await translation.save();
      console.log(`Added translation: ${loadingProgramsTranslation.key}`);
    }

    console.log("Loading programs translation added successfully!");
  } catch (error) {
    console.error("Error adding loading programs translation:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
addLoadingProgramsTranslation();
