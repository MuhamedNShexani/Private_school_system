const fs = require("fs");
const path = require("path");

console.log("🧹 Cleaning up old model files and references...\n");

// List of old model files to remove
const oldModelFiles = ["Course.js", "Semester.js", "Unit.js", "Topic.js"];

// List of old model names to replace
const modelReplacements = {
  Course: "Subject",
  Semester: "Season",
  Unit: "Chapter",
  Topic: "Part",
};

// List of collection names to replace
const collectionReplacements = {
  courses: "subjects",
  semesters: "seasons",
  units: "chapters",
  topics: "parts",
};

// Function to remove old model files
function removeOldModelFiles() {
  console.log("📁 Removing old model files...");

  oldModelFiles.forEach((fileName) => {
    const filePath = path.join(__dirname, "..", "models", fileName);

    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`✅ Removed: ${fileName}`);
      } catch (error) {
        console.log(`❌ Error removing ${fileName}:`, error.message);
      }
    } else {
      console.log(`ℹ️  File not found: ${fileName} (already removed)`);
    }
  });
}

// Function to update references in files
function updateReferences() {
  console.log("\n🔄 Updating references in files...");

  const filesToUpdate = ["backend/scripts/seedCurriculum.js"];

  filesToUpdate.forEach((filePath) => {
    const fullPath = path.join(__dirname, "..", "..", filePath);

    if (fs.existsSync(fullPath)) {
      try {
        let content = fs.readFileSync(fullPath, "utf8");

        // Update model references
        Object.entries(modelReplacements).forEach(([oldModel, newModel]) => {
          const regex = new RegExp(`\\b${oldModel}\\b`, "g");
          content = content.replace(regex, newModel);
        });

        // Update collection references
        Object.entries(collectionReplacements).forEach(
          ([oldCollection, newCollection]) => {
            const regex = new RegExp(`"${oldCollection}"`, "g");
            content = content.replace(regex, `"${newCollection}"`);
          }
        );

        fs.writeFileSync(fullPath, content);
        console.log(`✅ Updated: ${filePath}`);
      } catch (error) {
        console.log(`❌ Error updating ${filePath}:`, error.message);
      }
    } else {
      console.log(`ℹ️  File not found: ${filePath}`);
    }
  });
}

// Main execution
async function main() {
  try {
    removeOldModelFiles();
    updateReferences();

    console.log("\n🎉 Cleanup completed!");
    console.log("\n📋 Summary of changes:");
    console.log(
      "- Removed old model files: Course.js, Semester.js, Unit.js, Topic.js"
    );
    console.log(
      "- Updated references to use new models: Subject, Season, Chapter, Part"
    );
    console.log("- Updated collection names in database references");
    console.log(
      "\n⚠️  Note: You may need to manually review and update some files that have complex logic."
    );
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  }
}

main();
