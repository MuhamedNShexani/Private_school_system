const mongoose = require("mongoose");
const Translation = require("../models/Translation");

// Connect to MongoDB
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/student-exercises",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

async function checkTranslations() {
  try {
    console.log("Checking button translations in database...\n");

    const buttonTranslations = await Translation.find({
      key: { $regex: "^btn." },
    })
      .select("key translations.en")
      .sort("key");

    console.log("Button translations in database:");
    buttonTranslations.forEach((t) => {
      console.log(`- ${t.key}: ${t.translations.en}`);
    });

    console.log(`\nTotal button translations: ${buttonTranslations.length}`);

    console.log("\nChecking form translations...\n");

    const formTranslations = await Translation.find({
      key: { $regex: "^form." },
    })
      .select("key translations.en")
      .sort("key");

    console.log("Form translations in database:");
    formTranslations.forEach((t) => {
      console.log(`- ${t.key}: ${t.translations.en}`);
    });

    console.log(`\nTotal form translations: ${formTranslations.length}`);

    console.log("\nChecking error translations...\n");

    const errorTranslations = await Translation.find({
      key: { $regex: "^error." },
    })
      .select("key translations.en")
      .sort("key");

    console.log("Error translations in database:");
    errorTranslations.forEach((t) => {
      console.log(`- ${t.key}: ${t.translations.en}`);
    });

    console.log(`\nTotal error translations: ${errorTranslations.length}`);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    mongoose.connection.close();
  }
}

checkTranslations();
