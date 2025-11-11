const mongoose = require("mongoose");
require("dotenv").config();

const Translation = require("../models/Translation");

const seedTranslations = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("Connected to MongoDB");

    const translationsData = [
      {
        key: "chapterQuizzes.playQuiz",
        translations: {
          en: "Play Quiz",
          ar: "لعب الاختبار",
          ku: "کوییز بلێ",
        },
        category: "general",
        description: "Play quiz button",
      },
      {
        key: "chapterQuizzes.questionLabel",
        translations: {
          en: "Question",
          ar: "سؤال",
          ku: "پرسیار",
        },
        category: "general",
        description: "Question label in quiz form",
      },
      {
        key: "chapterQuizzes.removeQuestion",
        translations: {
          en: "Remove question",
          ar: "حذف السؤال",
          ku: "پرسیار لاببرین",
        },
        category: "general",
        description: "Remove question button",
      },
      {
        key: "chapterQuizzes.prompt",
        translations: {
          en: "Question prompt",
          ar: "نص السؤال",
          ku: "پرسیاری سؤال",
        },
        category: "general",
        description: "Question prompt input label",
      },
      {
        key: "chapterQuizzes.choices",
        translations: {
          en: "Choices",
          ar: "الخيارات",
          ku: "هیلبژاردن",
        },
        category: "general",
        description: "Choices section header",
      },
      {
        key: "chapterQuizzes.addChoice",
        translations: {
          en: "Add choice",
          ar: "إضافة خيار",
          ku: "هیلبژاردن زیاد کردن",
        },
        category: "general",
        description: "Add choice button",
      },
      {
        key: "chapterQuizzes.correctAnswer",
        translations: {
          en: "Correct answer",
          ar: "الإجابة الصحيحة",
          ku: "وەڵامی ڕاست",
        },
        category: "general",
        description: "Correct answer label",
      },
      {
        key: "chapterQuizzes.choice",
        translations: {
          en: "Choice",
          ar: "خيار",
          ku: "هیلبژاردن",
        },
        category: "general",
        description: "Choice label",
      },
      {
        key: "chapterQuizzes.removeChoice",
        translations: {
          en: "Remove choice",
          ar: "حذف الخيار",
          ku: "هیلبژاردن لاببرین",
        },
        category: "general",
        description: "Remove choice button",
      },
      {
        key: "chapterQuizzes.true",
        translations: {
          en: "True",
          ar: "صحيح",
          ku: "ڕاست",
        },
        category: "general",
        description: "True option",
      },
      {
        key: "chapterQuizzes.false",
        translations: {
          en: "False",
          ar: "خاطئ",
          ku: "هیچ",
        },
        category: "general",
        description: "False option",
      },
      {
        key: "chapterQuizzes.pairs",
        translations: {
          en: "Pairs",
          ar: "الأزواج",
          ku: "جووتە",
        },
        category: "general",
        description: "Pairs section header for matching questions",
      },
      {
        key: "chapterQuizzes.addPair",
        translations: {
          en: "Add pair",
          ar: "إضافة زوج",
          ku: "جووتە زیاد کردن",
        },
        category: "general",
        description: "Add pair button",
      },
      {
        key: "chapterQuizzes.left",
        translations: {
          en: "Left",
          ar: "يسار",
          ku: "چەپ",
        },
        category: "general",
        description: "Left side label for matching pairs",
      },
      {
        key: "chapterQuizzes.right",
        translations: {
          en: "Right",
          ar: "يمين",
          ku: "ڕاست",
        },
        category: "general",
        description: "Right side label for matching pairs",
      },
      {
        key: "chapterQuizzes.removePair",
        translations: {
          en: "Remove pair",
          ar: "حذف الزوج",
          ku: "جووتە لاببرین",
        },
        category: "general",
        description: "Remove pair button",
      },
      {
        key: "chapterQuizzes.explanation",
        translations: {
          en: "Explanation (optional)",
          ar: "التوضيح (اختياري)",
          ku: "شروە (بەختیار)",
        },
        category: "general",
        description: "Explanation field label",
      },
      {
        key: "chapterQuizzes.explanationHint",
        translations: {
          en: "Short feedback shown after answering.",
          ar: "ملاحظات قصيرة تظهر بعد الإجابة.",
          ku: "پاسخدانی کورت کە دوای وەڵام دەردەکەون.",
        },
        category: "general",
        description: "Explanation field hint",
      },
      {
        key: "chapterQuizzes.questions",
        translations: {
          en: "Questions",
          ar: "الأسئلة",
          ku: "پرسیاراں",
        },
        category: "general",
        description: "Questions section header",
      },
      {
        key: "chapterQuizzes.addQuestion",
        translations: {
          en: "Add Question",
          ar: "إضافة سؤال",
          ku: "پرسیار زیاد کردن",
        },
        category: "general",
        description: "Add question button",
      },
      {
        key: "btn.edit_chapter",
        translations: {
          en: "Edit Chapter",
          ar: "تعديل الفصل",
          ku: "بەشی دەستکاری کردن",
        },
        category: "buttons",
        description: "Edit chapter button",
      },
      {
        key: "btn.delete_chapter",
        translations: {
          en: "Delete Chapter",
          ar: "حذف الفصل",
          ku: "بەشی لاببرین",
        },
        category: "buttons",
        description: "Delete chapter button",
      },
      {
        key: "modal.add_quiz",
        translations: {
          en: "Add Quiz",
          ar: "إضافة اختبار",
          ku: "کوییز زیاد کردن",
        },
        category: "modal",
        description: "Add quiz modal title",
      },
      {
        key: "form.training_only",
        translations: {
          en: "Training Only",
          ar: "التدريب فقط",
          ku: "تەنھا ڕاهێنان",
        },
        category: "forms",
        description: "Training only checkbox label",
      },
      {
        key: "form.training_only_hint",
        translations: {
          en: "Quiz is for practice and will not affect student degree",
          ar: "الاختبار للممارسة ولن يؤثر على درجة الطالب",
          ku: "کوییز بۆ جێبەجێکردن و تاثیری لە دەرجەی خوێندکار نابێت",
        },
        category: "forms",
        description: "Training only checkbox hint text",
      },
    ];

    // Safety check: only proceed if we have translation data
    if (!translationsData || translationsData.length === 0) {
      console.error(
        "ERROR: translationsData is empty! Aborting to prevent database deletion."
      );
      console.error(
        "Please check that translationsData array is properly defined in this file."
      );
      await mongoose.disconnect();
      process.exit(1);
    }

    // // Clear existing translations only if we have new data to insert
    // console.log("Clearing existing translations...");
    // await Translation.deleteMany({});
    // console.log("Cleared existing translations");

    try {
      await Translation.insertMany(translationsData, { ordered: false });
      console.log(`Created ${translationsData.length} translations`);
    } catch (bulkError) {
      // Continue even if there are duplicate key errors, as we still want to insert the rest
      if (bulkError.code === 11000) {
        console.log(
          "Some duplicate keys encountered (expected), continuing..."
        );
        const inserted = bulkError.result ? bulkError.result.insertedCount : 0;
        console.log(`Inserted ${inserted} translations despite duplicates`);
      } else {
        throw bulkError;
      }
    }

    console.log("\n=== Translations Created ===");
    const createdTranslations = await Translation.find({}).sort({
      category: 1,
      key: 1,
    });
    for (const translation of createdTranslations) {
      console.log(
        `- ${translation.key} (${translation.category}): ${translation.translations.en}`
      );
    }

    console.log("\nTranslations seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding translations:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

seedTranslations();
