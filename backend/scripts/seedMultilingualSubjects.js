const mongoose = require("mongoose");
require("dotenv").config();

const Subject = require("../models/Subject");
const Class = require("../models/Class");

const seedMultilingualSubjects = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/student-exercise-platform"
    );
    console.log("Connected to MongoDB");

    // Clear existing subjects
    await Subject.deleteMany({});
    console.log("Cleared existing subjects");

    // Get existing classes
    const classes = await Class.find({});
    if (classes.length === 0) {
      console.log("No classes found. Please seed classes first.");
      return;
    }

    const subjectsData = [
      {
        title: {
          en: "Mathematics",
          ar: "الرياضيات",
          ku: "بیرکاری",
        },
        description: "Basic mathematical concepts and problem solving",
        content: "Introduction to algebra, geometry, and arithmetic",
        class: classes[0]._id, // Grade 10
        order: 1,
        difficulty: "Medium",
        estimatedTime: 45,
        exercises: [],
        isActive: true,
      },
      {
        title: {
          en: "English Language",
          ar: "اللغة الإنجليزية",
          ku: "زمانی ئینگلیزی",
        },
        description: "English grammar, vocabulary, and communication skills",
        content: "Reading, writing, listening, and speaking in English",
        class: classes[0]._id, // Grade 10
        order: 2,
        difficulty: "Easy",
        estimatedTime: 40,
        exercises: [],
        isActive: true,
      },
      {
        title: {
          en: "Arabic Language",
          ar: "اللغة العربية",
          ku: "زمانی عەرەبی",
        },
        description: "Arabic grammar, literature, and language skills",
        content: "Arabic reading, writing, and comprehension",
        class: classes[0]._id, // Grade 10
        order: 3,
        difficulty: "Medium",
        estimatedTime: 35,
        exercises: [],
        isActive: true,
      },
      {
        title: {
          en: "Science",
          ar: "العلوم",
          ku: "زانست",
        },
        description:
          "General science including physics, chemistry, and biology",
        content: "Basic scientific concepts and laboratory work",
        class: classes[0]._id, // Grade 10
        order: 4,
        difficulty: "Medium",
        estimatedTime: 50,
        exercises: [],
        isActive: true,
      },
      {
        title: {
          en: "Advanced Mathematics",
          ar: "الرياضيات المتقدمة",
          ku: "بیرکاری پێشکەوتوو",
        },
        description: "Advanced mathematical concepts for higher grades",
        content: "Calculus, trigonometry, and advanced algebra",
        class: classes[1]._id, // Grade 11
        order: 1,
        difficulty: "Hard",
        estimatedTime: 60,
        exercises: [],
        isActive: true,
      },
      {
        title: {
          en: "Literature",
          ar: "الأدب",
          ku: "ئەدەبیات",
        },
        description: "Study of literary works and analysis",
        content: "Poetry, prose, and literary criticism",
        class: classes[1]._id, // Grade 11
        order: 2,
        difficulty: "Medium",
        estimatedTime: 45,
        exercises: [],
        isActive: true,
      },
      {
        title: {
          en: "Physics",
          ar: "الفيزياء",
          ku: "فیزیا",
        },
        description: "Advanced physics concepts and laboratory work",
        content: "Mechanics, thermodynamics, and modern physics",
        class: classes[2]._id, // Grade 12
        order: 1,
        difficulty: "Hard",
        estimatedTime: 55,
        exercises: [],
        isActive: true,
      },
      {
        title: {
          en: "Chemistry",
          ar: "الكيمياء",
          ku: "کیمیا",
        },
        description: "Chemical reactions, compounds, and laboratory techniques",
        content: "Organic and inorganic chemistry fundamentals",
        class: classes[2]._id, // Grade 12
        order: 2,
        difficulty: "Hard",
        estimatedTime: 50,
        exercises: [],
        isActive: true,
      },
    ];

    await Subject.insertMany(subjectsData);
    console.log(`Created ${subjectsData.length} multilingual subjects`);

    console.log("\n=== Subjects Created ===");
    const createdSubjects = await Subject.find({}).populate("class", "name");
    for (const subject of createdSubjects) {
      console.log(
        `- ${subject.title.en} (EN) / ${subject.title.ar} (AR) / ${
          subject.title.ku
        } (KU) - Class: ${subject.class?.name?.en || "N/A"}`
      );
    }

    console.log("\nMultilingual subjects seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding multilingual subjects:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

seedMultilingualSubjects();
