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

// Button translations for Programs.js
const buttonTranslations = [
  // Add Buttons
  {
    key: "btn.add_class",
    translations: {
      en: "Add Class",
      ar: "إضافة فصل",
      ku: "زیادکردنی پۆل",
    },
    category: "buttons",
    description: "Button to add a new class",
  },
  {
    key: "btn.add_subject",
    translations: {
      en: "Add Subject",
      ar: "إضافة مادة",
      ku: "زیادکردنی بابەت",
    },
    category: "buttons",
    description: "Button to add a new subject",
  },
  {
    key: "btn.add_season",
    translations: {
      en: "Add Season",
      ar: "إضافة فصل دراسي",
      ku: "زیادکردنی وەرز",
    },
    category: "buttons",
    description: "Button to add a new season",
  },
  {
    key: "btn.add_chapter",
    translations: {
      en: "Add Chapter",
      ar: "إضافة فصل",
      ku: "زیادکردنی باب",
    },
    category: "buttons",
    description: "Button to add a new chapter",
  },
  {
    key: "btn.add_part",
    translations: {
      en: "Add Part",
      ar: "إضافة جزء",
      ku: "زیادکردنی بەش",
    },
    category: "buttons",
    description: "Button to add a new part",
  },
  {
    key: "btn.add_branch",
    translations: {
      en: "Add Branch",
      ar: "إضافة فرع",
      ku: "زیادکردنی لق",
    },
    category: "buttons",
    description: "Button to add a new branch",
  },

  // Edit Buttons
  {
    key: "btn.edit_class",
    translations: {
      en: "Edit Class",
      ar: "تعديل الفصل",
      ku: "دەستکاریکردنی پۆل",
    },
    category: "buttons",
    description: "Button to edit a class",
  },
  {
    key: "btn.edit_subject",
    translations: {
      en: "Edit Subject",
      ar: "تعديل المادة",
      ku: "دەستکاریکردنی بابەت",
    },
    category: "buttons",
    description: "Button to edit a subject",
  },
  {
    key: "btn.edit_season",
    translations: {
      en: "Edit Season",
      ar: "تعديل الفصل الدراسي",
      ku: "دەستکاریکردنی وەرز",
    },
    category: "buttons",
    description: "Button to edit a season",
  },
  {
    key: "btn.edit_chapter",
    translations: {
      en: "Edit Chapter",
      ar: "تعديل الفصل",
      ku: "دەستکاریکردنی باب",
    },
    category: "buttons",
    description: "Button to edit a chapter",
  },
  {
    key: "btn.edit_part",
    translations: {
      en: "Edit Part",
      ar: "تعديل الجزء",
      ku: "دەستکاریکردنی بەش",
    },
    category: "buttons",
    description: "Button to edit a part",
  },

  // Delete Buttons
  {
    key: "btn.delete_class",
    translations: {
      en: "Delete Class",
      ar: "حذف الفصل",
      ku: "سڕینەوەی پۆل",
    },
    category: "buttons",
    description: "Button to delete a class",
  },
  {
    key: "btn.delete_subject",
    translations: {
      en: "Delete Subject",
      ar: "حذف المادة",
      ku: "سڕینەوەی بابەت",
    },
    category: "buttons",
    description: "Button to delete a subject",
  },
  {
    key: "btn.delete_season",
    translations: {
      en: "Delete Season",
      ar: "حذف الفصل الدراسي",
      ku: "سڕینەوەی وەرز",
    },
    category: "buttons",
    description: "Button to delete a season",
  },
  {
    key: "btn.delete_chapter",
    translations: {
      en: "Delete Chapter",
      ar: "حذف الفصل",
      ku: "سڕینەوەی باب",
    },
    category: "buttons",
    description: "Button to delete a chapter",
  },
  {
    key: "btn.delete_part",
    translations: {
      en: "Delete Part",
      ar: "حذف الجزء",
      ku: "سڕینەوەی بەش",
    },
    category: "buttons",
    description: "Button to delete a part",
  },

  // Other Buttons
  {
    key: "btn.manage_seasons",
    translations: {
      en: "Manage Seasons",
      ar: "إدارة الفصول الدراسية",
      ku: "بەڕێوەبردنی وەرزەکان",
    },
    category: "buttons",
    description: "Button to manage seasons",
  },
  {
    key: "btn.remove_branch",
    translations: {
      en: "Remove Branch",
      ar: "إزالة الفرع",
      ku: "لابردنی لق",
    },
    category: "buttons",
    description: "Button to remove a branch",
  },

  // Form Labels
  {
    key: "form.name_english",
    translations: {
      en: "Name - English",
      ar: "الاسم - الإنجليزية",
      ku: "ناو - ئینگلیزی",
    },
    category: "forms",
    description: "Form label for English name field",
  },
  {
    key: "form.name_arabic",
    translations: {
      en: "Name - Arabic",
      ar: "الاسم - العربية",
      ku: "ناو - عەرەبی",
    },
    category: "forms",
    description: "Form label for Arabic name field",
  },
  {
    key: "form.name_kurdish",
    translations: {
      en: "Name - Kurdish",
      ar: "الاسم - الكردية",
      ku: "ناو - کوردی",
    },
    category: "forms",
    description: "Form label for Kurdish name field",
  },
  {
    key: "form.title_english",
    translations: {
      en: "Title - English",
      ar: "العنوان - الإنجليزية",
      ku: "ناونیشان - ئینگلیزی",
    },
    category: "forms",
    description: "Form label for English title field",
  },
  {
    key: "form.title_arabic",
    translations: {
      en: "Title - Arabic",
      ar: "العنوان - العربية",
      ku: "ناونیشان - عەرەبی",
    },
    category: "forms",
    description: "Form label for Arabic title field",
  },
  {
    key: "form.title_kurdish",
    translations: {
      en: "Title - Kurdish",
      ar: "العنوان - الكردية",
      ku: "ناونیشان - کوردی",
    },
    category: "forms",
    description: "Form label for Kurdish title field",
  },
  {
    key: "form.branches",
    translations: {
      en: "Branches",
      ar: "الفروع",
      ku: "لقەکان",
    },
    category: "forms",
    description: "Form label for branches section",
  },
  {
    key: "form.branch_name_english",
    translations: {
      en: "Branch Name - English",
      ar: "اسم الفرع - الإنجليزية",
      ku: "ناوی لق - ئینگلیزی",
    },
    category: "forms",
    description: "Form label for English branch name field",
  },
  {
    key: "form.branch_name_arabic",
    translations: {
      en: "Branch Name - Arabic",
      ar: "اسم الفرع - العربية",
      ku: "ناوی لق - عەرەبی",
    },
    category: "forms",
    description: "Form label for Arabic branch name field",
  },
  {
    key: "form.branch_name_kurdish",
    translations: {
      en: "Branch Name - Kurdish",
      ar: "اسم الفرع - الكردية",
      ku: "ناوی لق - کوردی",
    },
    category: "forms",
    description: "Form label for Kurdish branch name field",
  },
  {
    key: "form.order_label",
    translations: {
      en: "Order",
      ar: "الترتيب",
      ku: "ڕیز",
    },
    category: "forms",
    description: "Form label for order field",
  },
  {
    key: "form.status_label",
    translations: {
      en: "Status",
      ar: "الحالة",
      ku: "دۆخ",
    },
    category: "forms",
    description: "Form label for status field",
  },

  // Error Messages
  {
    key: "error.select_chapter_for_part",
    translations: {
      en: "Please select a chapter for the part",
      ar: "يرجى اختيار فصل للجزء",
      ku: "تکایە بابەکە هەڵبژێرە بۆ بەشەکە",
    },
    category: "messages",
    description: "Error message when no chapter is selected for a part",
  },
  {
    key: "error.failed_to_save",
    translations: {
      en: "Failed to save data",
      ar: "فشل في حفظ البيانات",
      ku: "سەرکەوتوو نەبوو لە هەڵگرتنی داتاکان",
    },
    category: "messages",
    description: "Error message when data saving fails",
  },
  {
    key: "error.failed_to_delete",
    translations: {
      en: "Failed to delete data",
      ar: "فشل في حذف البيانات",
      ku: "سەرکەوتوو نەبوو لە سڕینەوەی داتاکان",
    },
    category: "messages",
    description: "Error message when data deletion fails",
  },
  {
    key: "error.failed_to_update_status",
    translations: {
      en: "Failed to update status",
      ar: "فشل في تحديث الحالة",
      ku: "سەرکەوتوو نەبوو لە نوێکردنەوەی دۆخ",
    },
    category: "messages",
    description: "Error message when status update fails",
  },

  // Confirmation Messages
  {
    key: "confirm.delete_class",
    translations: {
      en: "Are you sure you want to delete this class?",
      ar: "هل أنت متأكد من أنك تريد حذف هذا الفصل؟",
      ku: "ئایا دڵنیایت کە دەتەوێت ئەم پۆلە بسڕیتەوە؟",
    },
    category: "messages",
    description: "Confirmation message for deleting a class",
  },
  {
    key: "confirm.delete_subject",
    translations: {
      en: "Are you sure you want to delete this subject?",
      ar: "هل أنت متأكد من أنك تريد حذف هذه المادة؟",
      ku: "ئایا دڵنیایت کە دەتەوێت ئەم بابەتە بسڕیتەوە؟",
    },
    category: "messages",
    description: "Confirmation message for deleting a subject",
  },
  {
    key: "confirm.delete_season",
    translations: {
      en: "Are you sure you want to delete this season?",
      ar: "هل أنت متأكد من أنك تريد حذف هذا الفصل الدراسي؟",
      ku: "ئایا دڵنیایت کە دەتەوێت ئەم وەرزە بسڕیتەوە؟",
    },
    category: "messages",
    description: "Confirmation message for deleting a season",
  },
  {
    key: "confirm.delete_chapter",
    translations: {
      en: "Are you sure you want to delete this chapter?",
      ar: "هل أنت متأكد من أنك تريد حذف هذا الفصل؟",
      ku: "ئایا دڵنیایت کە دەتەوێت ئەم بابە بسڕیتەوە؟",
    },
    category: "messages",
    description: "Confirmation message for deleting a chapter",
  },
  {
    key: "confirm.delete_part",
    translations: {
      en: "Are you sure you want to delete this part?",
      ar: "هل أنت متأكد من أنك تريد حذف هذا الجزء؟",
      ku: "ئایا دڵنیایت کە دەتەوێت ئەم بەشە بسڕیتەوە؟",
    },
    category: "messages",
    description: "Confirmation message for deleting a part",
  },
];

async function addButtonTranslations() {
  try {
    console.log("Starting to add Programs.js button translations...");

    let addedCount = 0;
    let updatedCount = 0;

    for (const translation of buttonTranslations) {
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

    console.log(`\nTranslation addition completed!`);
    console.log(`Added: ${addedCount} new translations`);
    console.log(`Updated: ${updatedCount} existing translations`);
    console.log(`Total processed: ${addedCount + updatedCount} translations`);
  } catch (error) {
    console.error("Error adding button translations:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
addButtonTranslations();
