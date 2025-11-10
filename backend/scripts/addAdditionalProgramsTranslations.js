const mongoose = require("mongoose");
const Translation = require("../models/Translation");

// Connect to MongoDB
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/student_exercises",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Additional translations that might be missing
const additionalTranslations = [
  // Modal titles
  {
    key: "modal.add_class",
    translations: {
      en: "Add Class",
      ar: "إضافة فصل",
      ku: "زیادکردنی پۆل",
    },
    category: "modal",
    description: "Modal title for adding a class",
  },
  {
    key: "modal.edit_class",
    translations: {
      en: "Edit Class",
      ar: "تعديل الفصل",
      ku: "دەستکاریکردنی پۆل",
    },
    category: "modal",
    description: "Modal title for editing a class",
  },
  {
    key: "modal.add_subject",
    translations: {
      en: "Add Subject",
      ar: "إضافة مادة",
      ku: "زیادکردنی بابەت",
    },
    category: "modal",
    description: "Modal title for adding a subject",
  },
  {
    key: "modal.edit_subject",
    translations: {
      en: "Edit Subject",
      ar: "تعديل المادة",
      ku: "دەستکاریکردنی بابەت",
    },
    category: "modal",
    description: "Modal title for editing a subject",
  },
  {
    key: "modal.add_season",
    translations: {
      en: "Add Season",
      ar: "إضافة فصل دراسي",
      ku: "زیادکردنی وەرز",
    },
    category: "modal",
    description: "Modal title for adding a season",
  },
  {
    key: "modal.edit_season",
    translations: {
      en: "Edit Season",
      ar: "تعديل الفصل الدراسي",
      ku: "دەستکاریکردنی وەرز",
    },
    category: "modal",
    description: "Modal title for editing a season",
  },
  {
    key: "modal.add_chapter",
    translations: {
      en: "Add Chapter",
      ar: "إضافة فصل",
      ku: "زیادکردنی باب",
    },
    category: "modal",
    description: "Modal title for adding a chapter",
  },
  {
    key: "modal.edit_chapter",
    translations: {
      en: "Edit Chapter",
      ar: "تعديل الفصل",
      ku: "دەستکاریکردنی باب",
    },
    category: "modal",
    description: "Modal title for editing a chapter",
  },
  {
    key: "modal.add_part",
    translations: {
      en: "Add Part",
      ar: "إضافة جزء",
      ku: "زیادکردنی بەش",
    },
    category: "modal",
    description: "Modal title for adding a part",
  },
  {
    key: "modal.edit_part",
    translations: {
      en: "Edit Part",
      ar: "تعديل الجزء",
      ku: "دەستکاریکردنی بەش",
    },
    category: "modal",
    description: "Modal title for editing a part",
  },

  // Button actions
  {
    key: "btn.update",
    translations: {
      en: "Update",
      ar: "تحديث",
      ku: "نوێکردنەوە",
    },
    category: "buttons",
    description: "Button to update/save changes",
  },
  {
    key: "btn.create",
    translations: {
      en: "Create",
      ar: "إنشاء",
      ku: "دروستکردن",
    },
    category: "buttons",
    description: "Button to create new item",
  },

  // Helper text
  {
    key: "helper.showing_subjects_for",
    translations: {
      en: "Showing subjects for",
      ar: "عرض المواد لـ",
      ku: "نیشاندانی بابەتەکان بۆ",
    },
    category: "labels",
    description: "Helper text for subject filtering",
  },
  {
    key: "helper.showing_chapters_for",
    translations: {
      en: "Showing chapters for",
      ar: "عرض الفصول لـ",
      ku: "نیشاندانی بابەکان بۆ",
    },
    category: "labels",
    description: "Helper text for chapter filtering",
  },

  // Form placeholders and options
  {
    key: "form.select_class",
    translations: {
      en: "Select Class",
      ar: "اختر الفصل",
      ku: "پۆل هەڵبژێرە",
    },
    category: "forms",
    description: "Placeholder for class selection",
  },
  {
    key: "form.select_subject",
    translations: {
      en: "Select Subject",
      ar: "اختر المادة",
      ku: "بابەت هەڵبژێرە",
    },
    category: "forms",
    description: "Placeholder for subject selection",
  },
  {
    key: "form.select_season",
    translations: {
      en: "Select Season",
      ar: "اختر الفصل الدراسي",
      ku: "وەرز هەڵبژێرە",
    },
    category: "forms",
    description: "Placeholder for season selection",
  },
  {
    key: "form.select_chapter",
    translations: {
      en: "Select Chapter",
      ar: "اختر الفصل",
      ku: "باب هەڵبژێرە",
    },
    category: "forms",
    description: "Placeholder for chapter selection",
  },

  // Difficulty levels
  {
    key: "difficulty.easy",
    translations: {
      en: "Easy",
      ar: "سهل",
      ku: "ئاسان",
    },
    category: "labels",
    description: "Easy difficulty level",
  },
  {
    key: "difficulty.medium",
    translations: {
      en: "Medium",
      ar: "متوسط",
      ku: "ناوەند",
    },
    category: "labels",
    description: "Medium difficulty level",
  },
  {
    key: "difficulty.hard",
    translations: {
      en: "Hard",
      ar: "صعب",
      ku: "قورس",
    },
    category: "labels",
    description: "Hard difficulty level",
  },

  // Time units
  {
    key: "form.minutes",
    translations: {
      en: "minutes",
      ar: "دقائق",
      ku: "خولەک",
    },
    category: "labels",
    description: "Time unit for minutes",
  },
];

async function addAdditionalTranslations() {
  try {
    console.log("Starting to add additional Programs.js translations...");

    let addedCount = 0;
    let updatedCount = 0;

    for (const translation of additionalTranslations) {
      try {
        const existingTranslation = await Translation.findOne({
          key: translation.key,
        });

        if (existingTranslation) {
          // Update existing translation
          await Translation.updateOne(
            { key: translation.key },
            {
              translations: translation.translations,
              category: translation.category,
              description: translation.description,
              updatedAt: new Date(),
            }
          );
          updatedCount++;
          console.log(`Updated: ${translation.key}`);
        } else {
          // Create new translation
          await Translation.create(translation);
          addedCount++;
          console.log(`Added: ${translation.key}`);
        }
      } catch (error) {
        console.error(`Error processing ${translation.key}:`, error.message);
      }
    }

    console.log(`\nAdditional translation addition completed!`);
    console.log(`Added: ${addedCount} new translations`);
    console.log(`Updated: ${updatedCount} existing translations`);
    console.log(`Total processed: ${addedCount + updatedCount} translations`);
  } catch (error) {
    console.error("Error adding additional translations:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
addAdditionalTranslations();
