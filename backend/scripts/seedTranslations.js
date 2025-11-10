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

    await Translation.deleteMany({});
    console.log("Cleared existing translations");

    const translationsData = [
      // Navigation
      {
        key: "nav.home",
        translations: {
          en: "Home",
          ar: "الرئيسية",
          ku: "سەرەکی",
        },
        category: "navigation",
        description: "Home navigation link",
      },
      {
        key: "nav.students",
        translations: {
          en: "Students",
          ar: "الطلاب",
          ku: "قوتابیان",
        },
        category: "navigation",
        description: "Students navigation link",
      },
      {
        key: "nav.programs",
        translations: {
          en: "Programs",
          ar: "البرامج",
          ku: "بەرنامەکان",
        },
        category: "navigation",
        description: "Programs navigation link",
      },
      {
        key: "nav.dashboard",
        translations: {
          en: "Dashboard",
          ar: "لوحة التحكم",
          ku: "داشبۆرد",
        },
        category: "navigation",
        description: "Dashboard navigation link",
      },
      {
        key: "nav.teachers",
        translations: {
          en: "Teachers",
          ar: "المعلمون",
          ku: "مامۆستایان",
        },
        category: "navigation",
        description: "Teachers navigation link",
      },
      {
        key: "nav.payments",
        translations: {
          en: "Payments",
          ar: "المدفوعات",
          ku: "پارەدانەکان",
        },
        category: "navigation",
        description: "Payments navigation link",
      },
      {
        key: "nav.translations",
        translations: {
          en: "Translations",
          ar: "الترجمات",
          ku: "وەرگێڕانەکان",
        },
        category: "navigation",
        description: "Translations navigation link",
      },
      {
        key: "nav.grading",
        translations: {
          en: "Grading",
          ar: "التقييم",
          ku: "نمرەدان",
        },
        category: "navigation",
        description: "Grading navigation link",
      },
      {
        key: "nav.profile",
        translations: {
          en: "My Profile",
          ar: "ملفي الشخصي",
          ku: "پرۆفایلی من",
        },
        category: "navigation",
        description: "Profile navigation link",
      },

      // Buttons
      {
        key: "btn.add",
        translations: {
          en: "Add",
          ar: "إضافة",
          ku: "زیادکردن",
        },
        category: "buttons",
        description: "Add button",
      },
      {
        key: "btn.edit",
        translations: {
          en: "Edit",
          ar: "تعديل",
          ku: "دەستکاریکردن",
        },
        category: "buttons",
        description: "Edit button",
      },
      {
        key: "btn.delete",
        translations: {
          en: "Delete",
          ar: "حذف",
          ku: "سڕینەوە",
        },
        category: "buttons",
        description: "Delete button",
      },
      {
        key: "btn.save",
        translations: {
          en: "Save",
          ar: "حفظ",
          ku: "پاشەکەوتکردن",
        },
        category: "buttons",
        description: "Save button",
      },
      {
        key: "btn.cancel",
        translations: {
          en: "Cancel",
          ar: "إلغاء",
          ku: "هەڵوەشاندنەوە",
        },
        category: "buttons",
        description: "Cancel button",
      },
      {
        key: "btn.back",
        translations: {
          en: "Back",
          ar: "رجوع",
          ku: "گەڕانەوە",
        },
        category: "buttons",
        description: "Back button",
      },
      {
        key: "btn.login",
        translations: {
          en: "Login",
          ar: "تسجيل الدخول",
          ku: "چوونەژوورەوە",
        },
        category: "buttons",
        description: "Login button",
      },
      {
        key: "btn.logout",
        translations: {
          en: "Logout",
          ar: "تسجيل الخروج",
          ku: "چوونەدەرەوە",
        },
        category: "buttons",
        description: "Logout button",
      },

      // Forms
      {
        key: "form.title",
        translations: {
          en: "Title",
          ar: "العنوان",
          ku: "سەردێڕ",
        },
        category: "forms",
        description: "Title form field",
      },
      {
        key: "form.description",
        translations: {
          en: "Description",
          ar: "الوصف",
          ku: "پێناسە",
        },
        category: "forms",
        description: "Description form field",
      },
      {
        key: "form.order",
        translations: {
          en: "Order",
          ar: "الترتيب",
          ku: "ڕیزبەندی",
        },
        category: "forms",
        description: "Order form field",
      },
      {
        key: "form.class",
        translations: {
          en: "Class",
          ar: "الصف",
          ku: "پۆل",
        },
        category: "forms",
        description: "Class form field",
      },
      {
        key: "form.subject",
        translations: {
          en: "Subject",
          ar: "المادة",
          ku: "بابەت",
        },
        category: "forms",
        description: "Subject form field",
      },
      {
        key: "form.chapter",
        translations: {
          en: "Chapter",
          ar: "الفصل",
          ku: "بەش",
        },
        category: "forms",
        description: "Chapter form field",
      },
      {
        key: "form.season",
        translations: {
          en: "Season",
          ar: "الفصل الدراسي",
          ku: "فەصل",
        },
        category: "forms",
        description: "Season form field",
      },

      // Messages
      {
        key: "msg.loading",
        translations: {
          en: "Loading...",
          ar: "جاري التحميل...",
          ku: "بارکردن...",
        },
        category: "messages",
        description: "Loading message",
      },
      {
        key: "msg.error",
        translations: {
          en: "An error occurred",
          ar: "حدث خطأ",
          ku: "هەڵەیەک ڕوویدا",
        },
        category: "messages",
        description: "Error message",
      },
      {
        key: "msg.success",
        translations: {
          en: "Operation completed successfully",
          ar: "تمت العملية بنجاح",
          ku: "ئەمە بە سەرکەوتوویی تەواو بوو",
        },
        category: "messages",
        description: "Success message",
      },
      {
        key: "msg.confirm_delete",
        translations: {
          en: "Are you sure you want to delete this item?",
          ar: "هل أنت متأكد من حذف هذا العنصر؟",
          ku: "دڵنیایت کە دەتەوێت ئەم شتە بسڕیتەوە؟",
        },
        category: "messages",
        description: "Delete confirmation message",
      },

      // Programs
      {
        key: "programs.title",
        translations: {
          en: "Programs",
          ar: "البرامج",
          ku: "بەرنامەکان",
        },
        category: "programs",
        description: "Programs page title",
      },
      {
        key: "programs.subtitle",
        translations: {
          en: "Explore our educational programs organized by classes and subjects",
          ar: "استكشف برامجنا التعليمية المنظمة حسب الفصول والمواد",
          ku: "بەرنامەکانی پەروەردەییمان بەرچاو بکە کە بە پۆل و بابەت ڕێکخراون",
        },
        category: "programs",
        description: "Programs page subtitle",
      },
      {
        key: "programs.available_classes",
        translations: {
          en: "Available Classes",
          ar: "الفصول المتاحة",
          ku: "پۆلە بەردەستەکان",
        },
        category: "programs",
        description: "Available classes section title",
      },
      {
        key: "programs.subjects_in",
        translations: {
          en: "Subjects in",
          ar: "مواد",
          ku: "بابەتەکان لە",
        },
        category: "programs",
        description: "Subjects in class title",
      },
      {
        key: "programs.chapters_for",
        translations: {
          en: "Chapters for",
          ar: "فصول",
          ku: "بەشەکان بۆ",
        },
        category: "programs",
        description: "Chapters for subject title",
      },
      {
        key: "programs.parts_in",
        translations: {
          en: "Parts in",
          ar: "أجزاء في",
          ku: "بەشەکان لە",
        },
        category: "programs",
        description: "Parts in chapter title",
      },

      // Admin
      {
        key: "admin.translations.title",
        translations: {
          en: "Translation Management",
          ar: "إدارة الترجمة",
          ku: "بەڕێوەبردنی وەرگێڕان",
        },
        category: "admin",
        description: "Admin translations page title",
      },
      {
        key: "admin.translations.subtitle",
        translations: {
          en: "Manage system translations for multiple languages",
          ar: "إدارة ترجمات النظام للغات متعددة",
          ku: "بەڕێوەبردنی وەرگێڕانەکانی سیستەم بۆ چەندین زمان",
        },
        category: "admin",
        description: "Admin translations page subtitle",
      },
      {
        key: "admin.translations.add_new",
        translations: {
          en: "Add New Translation",
          ar: "إضافة ترجمة جديدة",
          ku: "وەرگێڕانێکی نوێ زیادکردن",
        },
        category: "admin",
        description: "Add new translation button",
      },
      {
        key: "admin.translations.search",
        translations: {
          en: "Search translations...",
          ar: "البحث في الترجمات...",
          ku: "گەڕان بۆ وەرگێڕانەکان...",
        },
        category: "admin",
        description: "Search translations placeholder",
      },
      {
        key: "admin.translations.category",
        translations: {
          en: "Category",
          ar: "الفئة",
          ku: "پۆل",
        },
        category: "admin",
        description: "Category label",
      },
      {
        key: "admin.translations.key",
        translations: {
          en: "Translation Key",
          ar: "مفتاح الترجمة",
          ku: "کلیلەی وەرگێڕان",
        },
        category: "admin",
        description: "Translation key label",
      },
      {
        key: "admin.translations.english",
        translations: {
          en: "English",
          ar: "الإنجليزية",
          ku: "ئینگلیزی",
        },
        category: "admin",
        description: "English language label",
      },
      {
        key: "admin.translations.arabic",
        translations: {
          en: "Arabic",
          ar: "العربية",
          ku: "عەرەبی",
        },
        category: "admin",
        description: "Arabic language label",
      },
      {
        key: "admin.translations.kurdish",
        translations: {
          en: "Kurdish",
          ar: "الكردية",
          ku: "کوردی",
        },
        category: "admin",
        description: "Kurdish language label",
      },

      // App
      {
        key: "app.schoolName",
        translations: {
          en: "CLEVER PRIVATE HIGH SCHOOL",
          ar: "مدرسة كليفر الخاصة الثانوية",
          ku: "قوتابخانەی تایبەتی کلیفەر",
        },
        category: "app",
        description: "School name displayed in header",
      },
    ];

    await Translation.insertMany(translationsData);
    console.log(`Created ${translationsData.length} translations`);

    console.log("\n=== Translations Created ===");
    const createdTranslations = await Translation.find({}).sort({ category: 1, key: 1 });
    for (const translation of createdTranslations) {
      console.log(`- ${translation.key} (${translation.category}): ${translation.translations.en}`);
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
