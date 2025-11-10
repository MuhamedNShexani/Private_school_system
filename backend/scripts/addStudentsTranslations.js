const mongoose = require("mongoose");
const Translation = require("../models/Translation");

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/student_exercises"
  )
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Students component translations
const studentsTranslations = [
  // Main content
  {
    key: "students.title",
    translations: {
      en: "Students",
      ar: "الطلاب",
      ku: "قوتابیان",
    },
    category: "navigation",
    description: "Students page title",
  },
  {
    key: "students.subtitle",
    translations: {
      en: "Manage and view all students organized by their classes",
      ar: "إدارة ومشاهدة جميع الطلاب منظمين حسب فصولهم",
      ku: "بەڕێوەبردنی و بینینی هەموو قوتابیان بەپێی پۆلەکانیان",
    },
    category: "labels",
    description: "Students page subtitle",
  },
  {
    key: "students.loading",
    translations: {
      en: "Loading students...",
      ar: "جاري تحميل الطلاب...",
      ku: "قوتابیان باردەکەم...",
    },
    category: "messages",
    description: "Loading message for students",
  },
  {
    key: "students.error.loadFailed",
    translations: {
      en: "Failed to load students. Please try again.",
      ar: "فشل في تحميل الطلاب. يرجى المحاولة مرة أخرى.",
      ku: "سەرکەوتوو نەبوو لە بارکردنی قوتابیان. تکایە دووبارە هەوڵ بدە.",
    },
    category: "messages",
    description: "Error message when loading students fails",
  },

  // Statistics
  {
    key: "students.stats.myStudents",
    translations: {
      en: "My Students",
      ar: "طلابي",
      ku: "قوتابیانم",
    },
    category: "labels",
    description: "Statistics label for teacher's students",
  },
  {
    key: "students.stats.totalStudents",
    translations: {
      en: "Total Students",
      ar: "إجمالي الطلاب",
      ku: "کۆی قوتابیان",
    },
    category: "labels",
    description: "Statistics label for total students",
  },
  {
    key: "students.stats.classes",
    translations: {
      en: "Classes",
      ar: "الفصول",
      ku: "پۆلەکان",
    },
    category: "labels",
    description: "Statistics label for classes",
  },
  {
    key: "students.stats.femaleStudents",
    translations: {
      en: "Female Students",
      ar: "الطالبات",
      ku: "قوتابیان مێینە",
    },
    category: "labels",
    description: "Statistics label for female students",
  },
  {
    key: "students.stats.maleStudents",
    translations: {
      en: "Male Students",
      ar: "الطلاب الذكور",
      ku: "قوتابیان نێرینە",
    },
    category: "labels",
    description: "Statistics label for male students",
  },

  // Empty state
  {
    key: "students.empty.title",
    translations: {
      en: "No Students Found",
      ar: "لم يتم العثور على طلاب",
      ku: "هیچ قوتابیەک نەدۆزرایەوە",
    },
    category: "messages",
    description: "Empty state title when no students found",
  },
  {
    key: "students.empty.message",
    translations: {
      en: "There are no students in the database yet.",
      ar: "لا يوجد طلاب في قاعدة البيانات بعد.",
      ku: "هێشتا هیچ قوتابیەک لە داتابەیسدا نییە.",
    },
    category: "messages",
    description: "Empty state message when no students found",
  },

  // Class section
  {
    key: "students.byClass.title",
    translations: {
      en: "Students by Class",
      ar: "الطلاب حسب الفصل",
      ku: "قوتابیان بەپێی پۆل",
    },
    category: "labels",
    description: "Title for students grouped by class section",
  },
  {
    key: "students.class.student",
    translations: {
      en: "student",
      ar: "طالب",
      ku: "قوتابی",
    },
    category: "labels",
    description: "Singular form of student",
  },
  {
    key: "students.gender.male",
    translations: {
      en: "Male",
      ar: "ذكر",
      ku: "نێرینە",
    },
    category: "labels",
    description: "Gender label for male",
  },
  {
    key: "students.gender.female",
    translations: {
      en: "Female",
      ar: "أنثى",
      ku: "مێینە",
    },
    category: "labels",
    description: "Gender label for female",
  },
  {
    key: "students.joined",
    translations: {
      en: "Joined",
      ar: "انضم",
      ku: "بەشداری کرد",
    },
    category: "labels",
    description: "Label for join date",
  },
  {
    key: "students.subjectStatus",
    translations: {
      en: "Subject Status",
      ar: "حالة المادة",
      ku: "دۆخی بابەت",
    },
    category: "labels",
    description: "Label for subject status section",
  },
  {
    key: "students.viewProfile",
    translations: {
      en: "View Profile",
      ar: "عرض الملف الشخصي",
      ku: "بینینی پڕۆفایل",
    },
    category: "buttons",
    description: "Button text to view student profile",
  },
];

// StudentProfile component translations
const studentProfileTranslations = [
  // Main content
  {
    key: "studentProfile.title",
    translations: {
      en: "Student Profile",
      ar: "الملف الشخصي للطالب",
      ku: "پڕۆفایلی قوتابی",
    },
    category: "navigation",
    description: "Student profile page title",
  },
  {
    key: "studentProfile.subtitle",
    translations: {
      en: "Detailed information about",
      ar: "معلومات مفصلة حول",
      ku: "زانیاری ورد لەسەر",
    },
    category: "labels",
    description: "Student profile page subtitle",
  },
  {
    key: "studentProfile.loading",
    translations: {
      en: "Loading student profile...",
      ar: "جاري تحميل الملف الشخصي للطالب...",
      ku: "پڕۆفایلی قوتابی باردەکەم...",
    },
    category: "messages",
    description: "Loading message for student profile",
  },
  {
    key: "studentProfile.error.loadFailed",
    translations: {
      en: "Failed to load student data. Please try again.",
      ar: "فشل في تحميل بيانات الطالب. يرجى المحاولة مرة أخرى.",
      ku: "سەرکەوتوو نەبوو لە بارکردنی داتای قوتابی. تکایە دووبارە هەوڵ بدە.",
    },
    category: "messages",
    description: "Error message when loading student profile fails",
  },

  // Empty state
  {
    key: "studentProfile.empty.title",
    translations: {
      en: "No Student Found",
      ar: "لم يتم العثور على طالب",
      ku: "هیچ قوتابیەک نەدۆزرایەوە",
    },
    category: "messages",
    description: "Empty state title when student not found",
  },
  {
    key: "studentProfile.empty.message",
    translations: {
      en: "Student profile not found or you don't have permission to view it.",
      ar: "الملف الشخصي للطالب غير موجود أو ليس لديك صلاحية لعرضه.",
      ku: "پڕۆفایلی قوتابی نەدۆزرایەوە یان مۆڵەتت نییە بۆ بینینی.",
    },
    category: "messages",
    description: "Empty state message when student not found",
  },

  // Student information
  {
    key: "studentProfile.id",
    translations: {
      en: "ID",
      ar: "المعرف",
      ku: "ناسنامە",
    },
    category: "labels",
    description: "Label for student ID",
  },
  {
    key: "studentProfile.notProvided",
    translations: {
      en: "Not provided",
      ar: "غير متوفر",
      ku: "پێشکەش نەکراوە",
    },
    category: "labels",
    description: "Label when information is not provided",
  },
  {
    key: "studentProfile.username",
    translations: {
      en: "Username",
      ar: "اسم المستخدم",
      ku: "ناوی بەکارهێنەر",
    },
    category: "labels",
    description: "Label for username",
  },
  {
    key: "studentProfile.parents",
    translations: {
      en: "Parents",
      ar: "الوالدان",
      ku: "دایک و باوک",
    },
    category: "labels",
    description: "Label for parents contact",
  },
  {
    key: "studentProfile.notAssigned",
    translations: {
      en: "Not assigned",
      ar: "غير مخصص",
      ku: "دابین نەکراوە",
    },
    category: "labels",
    description: "Label when something is not assigned",
  },

  // Sections
  {
    key: "studentProfile.contactInfo",
    translations: {
      en: "Contact Information",
      ar: "معلومات الاتصال",
      ku: "زانیاری پەیوەندی",
    },
    category: "labels",
    description: "Section title for contact information",
  },
  {
    key: "studentProfile.academicInfo",
    translations: {
      en: "Academic Information",
      ar: "المعلومات الأكاديمية",
      ku: "زانیاری ئەکادیمی",
    },
    category: "labels",
    description: "Section title for academic information",
  },
  {
    key: "studentProfile.academicPerformance",
    translations: {
      en: "Academic Performance",
      ar: "الأداء الأكاديمي",
      ku: "ئەدای ئەکادیمی",
    },
    category: "labels",
    description: "Section title for academic performance",
  },
  {
    key: "studentProfile.availableCourses",
    translations: {
      en: "Available Courses",
      ar: "الدورات المتاحة",
      ku: "کۆرسە بەردەستەکان",
    },
    category: "labels",
    description: "Section title for available courses",
  },

  // Academic details
  {
    key: "studentProfile.class",
    translations: {
      en: "Class",
      ar: "الفصل",
      ku: "پۆل",
    },
    category: "labels",
    description: "Label for class",
  },
  {
    key: "studentProfile.branch",
    translations: {
      en: "Branch",
      ar: "الفرع",
      ku: "لق",
    },
    category: "labels",
    description: "Label for branch",
  },
  {
    key: "studentProfile.joined",
    translations: {
      en: "Joined",
      ar: "انضم",
      ku: "بەشداری کرد",
    },
    category: "labels",
    description: "Label for join date",
  },
  {
    key: "studentProfile.noEvaluations",
    translations: {
      en: "No evaluations found",
      ar: "لم يتم العثور على تقييمات",
      ku: "هیچ هەڵسەنگاندنێک نەدۆزرایەوە",
    },
    category: "messages",
    description: "Message when no evaluations found",
  },
  {
    key: "studentProfile.noCourses",
    translations: {
      en: "No courses available",
      ar: "لا توجد دورات متاحة",
      ku: "هیچ کۆرسێک بەردەست نییە",
    },
    category: "messages",
    description: "Message when no courses available",
  },
  {
    key: "studentProfile.noDescription",
    translations: {
      en: "No description available",
      ar: "لا يوجد وصف متاح",
      ku: "هیچ وەسفێک بەردەست نییە",
    },
    category: "messages",
    description: "Message when no description available",
  },
  {
    key: "studentProfile.duration",
    translations: {
      en: "Duration",
      ar: "المدة",
      ku: "ماوە",
    },
    category: "labels",
    description: "Label for duration",
  },
  {
    key: "studentProfile.credits",
    translations: {
      en: "Credits",
      ar: "الساعات المعتمدة",
      ku: "کریت",
    },
    category: "labels",
    description: "Label for credits",
  },
];

// Common translations
const commonTranslations = [
  {
    key: "common.na",
    translations: {
      en: "N/A",
      ar: "غير متوفر",
      ku: "بەردەست نییە",
    },
    category: "labels",
    description: "Not available label",
  },
];

// Function to add translations
async function addTranslations() {
  try {
    console.log("Starting to add Students and StudentProfile translations...");

    // Combine all translations
    const allTranslations = [
      ...studentsTranslations,
      ...studentProfileTranslations,
      ...commonTranslations,
    ];

    let addedCount = 0;
    let updatedCount = 0;

    for (const translationData of allTranslations) {
      try {
        // Check if translation already exists
        const existingTranslation = await Translation.findOne({
          key: translationData.key,
        });

        if (existingTranslation) {
          // Update existing translation
          await Translation.findByIdAndUpdate(
            existingTranslation._id,
            translationData,
            { new: true, runValidators: true }
          );
          updatedCount++;
          console.log(`Updated translation: ${translationData.key}`);
        } else {
          // Create new translation
          const translation = new Translation(translationData);
          await translation.save();
          addedCount++;
          console.log(`Added translation: ${translationData.key}`);
        }
      } catch (error) {
        console.error(
          `Error processing translation ${translationData.key}:`,
          error.message
        );
      }
    }

    console.log(`\nTranslation process completed:`);
    console.log(`- Added: ${addedCount} translations`);
    console.log(`- Updated: ${updatedCount} translations`);
    console.log(`- Total processed: ${allTranslations.length} translations`);
  } catch (error) {
    console.error("Error adding translations:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
addTranslations();
