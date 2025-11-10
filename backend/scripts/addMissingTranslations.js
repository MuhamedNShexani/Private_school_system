const mongoose = require("mongoose");
require("dotenv").config();

const Translation = require("../models/Translation");

const addMissingTranslations = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("Connected to MongoDB");

    const missingTranslations = [
      // Form fields
      {
        key: "form.content",
        translations: {
          en: "Content",
          ar: "المحتوى",
          ku: "ناوەڕۆک",
        },
        category: "forms",
        description: "Content form field",
      },
      {
        key: "form.difficulty",
        translations: {
          en: "Difficulty",
          ar: "الصعوبة",
          ku: "قورسایی",
        },
        category: "forms",
        description: "Difficulty form field",
      },
      {
        key: "form.estimated_time",
        translations: {
          en: "Estimated Time (minutes)",
          ar: "الوقت المقدر (بالدقائق)",
          ku: "کاتی خەمڵاندن (بە خولەک)",
        },
        category: "forms",
        description: "Estimated time form field",
      },
      {
        key: "form.name",
        translations: {
          en: "Name",
          ar: "الاسم",
          ku: "ناو",
        },
        category: "forms",
        description: "Name form field",
      },
      {
        key: "form.active_status",
        translations: {
          en: "Active Status",
          ar: "حالة النشاط",
          ku: "دۆخی چالاکی",
        },
        category: "forms",
        description: "Active status form field",
      },
      {
        key: "form.active",
        translations: {
          en: "Active",
          ar: "نشط",
          ku: "چالاک",
        },
        category: "forms",
        description: "Active option",
      },
      {
        key: "form.inactive",
        translations: {
          en: "Inactive",
          ar: "غير نشط",
          ku: "نەچالاک",
        },
        category: "forms",
        description: "Inactive option",
      },
      {
        key: "form.select_class",
        translations: {
          en: "Select Class",
          ar: "اختر الصف",
          ku: "پۆل هەڵبژێرە",
        },
        category: "forms",
        description: "Select class placeholder",
      },
      {
        key: "form.select_subject",
        translations: {
          en: "Select Subject",
          ar: "اختر المادة",
          ku: "بابەت هەڵبژێرە",
        },
        category: "forms",
        description: "Select subject placeholder",
      },
      {
        key: "form.select_chapter",
        translations: {
          en: "Select Chapter",
          ar: "اختر الفصل",
          ku: "بەش هەڵبژێرە",
        },
        category: "forms",
        description: "Select chapter placeholder",
      },

      // Programs specific
      {
        key: "programs.view_subjects",
        translations: {
          en: "View Subjects",
          ar: "عرض المواد",
          ku: "بابەتەکان ببینە",
        },
        category: "programs",
        description: "View subjects button text",
      },
      {
        key: "programs.view_chapters",
        translations: {
          en: "View Chapters",
          ar: "عرض الفصول",
          ku: "بەشەکان ببینە",
        },
        category: "programs",
        description: "View chapters button text",
      },
      {
        key: "programs.add_chapter",
        translations: {
          en: "Add Chapter",
          ar: "إضافة فصل",
          ku: "بەش زیادکردن",
        },
        category: "programs",
        description: "Add chapter button text",
      },
      {
        key: "programs.chapters_in",
        translations: {
          en: "Chapters in",
          ar: "فصول في",
          ku: "بەشەکان لە",
        },
        category: "programs",
        description: "Chapters in text",
      },
      {
        key: "programs.seasons_for",
        translations: {
          en: "Seasons for",
          ar: "فصول دراسية لـ",
          ku: "فەصلەکان بۆ",
        },
        category: "programs",
        description: "Seasons for text",
      },
      {
        key: "programs.subjects_count",
        translations: {
          en: "Subjects",
          ar: "مواد",
          ku: "بابەتەکان",
        },
        category: "programs",
        description: "Subjects count label",
      },
      {
        key: "programs.parts_count",
        translations: {
          en: "Parts",
          ar: "أجزاء",
          ku: "بەشەکان",
        },
        category: "programs",
        description: "Parts count label",
      },
      {
        key: "programs.branches_count",
        translations: {
          en: "Branches",
          ar: "فروع",
          ku: "لقەکان",
        },
        category: "programs",
        description: "Branches count label",
      },
      {
        key: "programs.seasons_count",
        translations: {
          en: "Seasons",
          ar: "فصول دراسية",
          ku: "فەصلەکان",
        },
        category: "programs",
        description: "Seasons count label",
      },
      {
        key: "programs.total_parts",
        translations: {
          en: "Total Parts",
          ar: "إجمالي الأجزاء",
          ku: "کۆی بەشەکان",
        },
        category: "programs",
        description: "Total parts label",
      },

      // Difficulty levels
      {
        key: "difficulty.easy",
        translations: {
          en: "Easy",
          ar: "سهل",
          ku: "ئاسان",
        },
        category: "forms",
        description: "Easy difficulty level",
      },
      {
        key: "difficulty.medium",
        translations: {
          en: "Medium",
          ar: "متوسط",
          ku: "مامناوەند",
        },
        category: "forms",
        description: "Medium difficulty level",
      },
      {
        key: "difficulty.hard",
        translations: {
          en: "Hard",
          ar: "صعب",
          ku: "قورس",
        },
        category: "forms",
        description: "Hard difficulty level",
      },

      // Season options
      {
        key: "season.season_1",
        translations: {
          en: "Season 1",
          ar: "الفصل الأول",
          ku: "فەصلی یەکەم",
        },
        category: "forms",
        description: "Season 1 option",
      },
      {
        key: "season.season_2",
        translations: {
          en: "Season 2",
          ar: "الفصل الثاني",
          ku: "فەصلی دووەم",
        },
        category: "forms",
        description: "Season 2 option",
      },
      {
        key: "season.season_3",
        translations: {
          en: "Season 3",
          ar: "الفصل الثالث",
          ku: "فەصلی سێیەم",
        },
        category: "forms",
        description: "Season 3 option",
      },
      {
        key: "season.season_4",
        translations: {
          en: "Season 4",
          ar: "الفصل الرابع",
          ku: "فەصلی چوارەم",
        },
        category: "forms",
        description: "Season 4 option",
      },

      // Status labels
      {
        key: "status.active",
        translations: {
          en: "Active",
          ar: "نشط",
          ku: "چالاک",
        },
        category: "labels",
        description: "Active status label",
      },
      {
        key: "status.inactive",
        translations: {
          en: "Inactive",
          ar: "غير نشط",
          ku: "نەچالاک",
        },
        category: "labels",
        description: "Inactive status label",
      },

      // Modal titles
      {
        key: "modal.add_class",
        translations: {
          en: "Add Class",
          ar: "إضافة صف",
          ku: "پۆل زیادکردن",
        },
        category: "admin",
        description: "Add class modal title",
      },
      {
        key: "modal.edit_class",
        translations: {
          en: "Edit Class",
          ar: "تعديل الصف",
          ku: "پۆل دەستکاریکردن",
        },
        category: "admin",
        description: "Edit class modal title",
      },
      {
        key: "modal.add_subject",
        translations: {
          en: "Add Subject",
          ar: "إضافة مادة",
          ku: "بابەت زیادکردن",
        },
        category: "admin",
        description: "Add subject modal title",
      },
      {
        key: "modal.edit_subject",
        translations: {
          en: "Edit Subject",
          ar: "تعديل المادة",
          ku: "بابەت دەستکاریکردن",
        },
        category: "admin",
        description: "Edit subject modal title",
      },
      {
        key: "modal.add_chapter",
        translations: {
          en: "Add Chapter",
          ar: "إضافة فصل",
          ku: "بەش زیادکردن",
        },
        category: "admin",
        description: "Add chapter modal title",
      },
      {
        key: "modal.edit_chapter",
        translations: {
          en: "Edit Chapter",
          ar: "تعديل الفصل",
          ku: "بەش دەستکاریکردن",
        },
        category: "admin",
        description: "Edit chapter modal title",
      },
      {
        key: "modal.add_part",
        translations: {
          en: "Add Part",
          ar: "إضافة جزء",
          ku: "بەشەکە زیادکردن",
        },
        category: "admin",
        description: "Add part modal title",
      },
      {
        key: "modal.edit_part",
        translations: {
          en: "Edit Part",
          ar: "تعديل الجزء",
          ku: "بەشەکە دەستکاریکردن",
        },
        category: "admin",
        description: "Edit part modal title",
      },

      // Helper text
      {
        key: "helper.showing_subjects_for",
        translations: {
          en: "Showing subjects for",
          ar: "عرض المواد لـ",
          ku: "بابەتەکان پیشان دەدرێن بۆ",
        },
        category: "labels",
        description: "Showing subjects helper text",
      },
      {
        key: "helper.showing_chapters_for",
        translations: {
          en: "Showing chapters for",
          ar: "عرض الفصول لـ",
          ku: "بەشەکان پیشان دەدرێن بۆ",
        },
        category: "labels",
        description: "Showing chapters helper text",
      },
    ];

    // Check which translations already exist
    const existingKeys = await Translation.find({}, { key: 1 });
    const existingKeySet = new Set(existingKeys.map((t) => t.key));

    const newTranslations = missingTranslations.filter(
      (t) => !existingKeySet.has(t.key)
    );

    if (newTranslations.length > 0) {
      await Translation.insertMany(newTranslations);
      console.log(`Added ${newTranslations.length} new translations`);
    } else {
      console.log("All translations already exist");
    }

    console.log("\n=== New Translations Added ===");
    for (const translation of newTranslations) {
      console.log(
        `- ${translation.key} (${translation.category}): ${translation.translations.en}`
      );
    }

    console.log("\nMissing translations added successfully!");
  } catch (error) {
    console.error("Error adding missing translations:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

addMissingTranslations();
