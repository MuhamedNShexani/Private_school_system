const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Season = require("../models/Season");
const Chapter = require("../models/Chapter");
const Subject = require("../models/Subject");
const Class = require("../models/Class");

// Load environment variables
dotenv.config();

// MongoDB connection
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/student-exercises",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Sample seasons data
const sampleSeasons = [
  {
    name: {
      en: "Season 1",
      ar: "الموسم الأول",
      ku: "وەرزی یەکەم",
    },
    description: "First semester of the academic year",
    order: 1,
  },
  {
    name: {
      en: "Season 2",
      ar: "الموسم الثاني",
      ku: "وەرزی دووەم",
    },
    description: "Second semester of the academic year",
    order: 2,
  },
];

// Sample chapters data
const sampleChapters = [
  // Season 1 Chapters
  {
    title: "Introduction to Arabic Language",
    description: "Basic Arabic alphabet and pronunciation",
    order: 1,
    season: null, // Will be set after seasons are created
  },
  {
    title: "Arabic Grammar Fundamentals",
    description: "Basic grammar rules and sentence structure",
    order: 2,
    season: null,
  },
  {
    title: "English Reading Comprehension",
    description: "Basic reading skills and vocabulary",
    order: 1,
    season: null,
  },
  {
    title: "English Writing Skills",
    description: "Basic writing and composition",
    order: 2,
    season: null,
  },
  // Season 2 Chapters
  {
    title: "Advanced Arabic Vocabulary",
    description: "Expanded vocabulary and expressions",
    order: 1,
    season: null,
  },
  {
    title: "Arabic Literature",
    description: "Introduction to Arabic poetry and prose",
    order: 2,
    season: null,
  },
  {
    title: "English Grammar",
    description: "Advanced grammar concepts",
    order: 1,
    season: null,
  },
  {
    title: "English Communication",
    description: "Speaking and listening skills",
    order: 2,
    season: null,
  },
];

// Sample subjects data
const sampleSubjects = [
  // Class 10 Arabic - Season 1
  {
    title: {
      en: "Arabic Part 1",
      ar: "اللغة العربية الجزء الأول",
      ku: "عەرەبی بەش یەکەم",
    },
    description: "Introduction to Arabic alphabet and basic words",
    content: "Learn the Arabic alphabet, pronunciation, and basic vocabulary.",
    class: null, // Will be set after classes are created
    chapter: null, // Will be set after chapters are created
    order: 1,
    difficulty: "Easy",
    estimatedTime: 45,
    exercises: [
      {
        question: "What is the first letter of the Arabic alphabet?",
        options: ["أ", "ب", "ت", "ث"],
        correctAnswer: "أ",
        explanation: "أ (Alif) is the first letter of the Arabic alphabet.",
        points: 10,
      },
    ],
  },
  {
    title: {
      en: "Arabic Part 2",
      ar: "اللغة العربية الجزء الثاني",
      ku: "عەرەبی بەش دووەم",
    },
    description: "Arabic grammar basics and sentence formation",
    content:
      "Learn basic Arabic grammar rules and how to form simple sentences.",
    class: null, // Will be set after classes are created
    chapter: null,
    order: 2,
    difficulty: "Medium",
    estimatedTime: 60,
    exercises: [
      {
        question: "Which of the following is a noun in Arabic?",
        options: ["كتب", "أكل", "ذهب", "جلس"],
        correctAnswer: "كتب",
        explanation: "كتب (books) is a noun, while the others are verbs.",
        points: 10,
      },
    ],
  },
  // Class 10 English - Season 1
  {
    title: {
      en: "English Part 1",
      ar: "اللغة الإنجليزية الجزء الأول",
      ku: "ئینگلیزی بەش یەکەم",
    },
    description: "Basic English reading and comprehension",
    content: "Develop basic reading skills and comprehension abilities.",
    class: null, // Will be set after classes are created
    chapter: null,
    order: 1,
    difficulty: "Easy",
    estimatedTime: 40,
    exercises: [
      {
        question: "What is the capital of England?",
        options: ["Manchester", "Birmingham", "London", "Liverpool"],
        correctAnswer: "London",
        explanation: "London is the capital and largest city of England.",
        points: 10,
      },
    ],
  },
  {
    title: {
      en: "English Part 2",
      ar: "اللغة الإنجليزية الجزء الثاني",
      ku: "ئینگلیزی بەش دووەم",
    },
    description: "Basic English writing and composition",
    content: "Learn to write simple sentences and short paragraphs.",
    class: null, // Will be set after classes are created
    chapter: null,
    order: 2,
    difficulty: "Medium",
    estimatedTime: 50,
    exercises: [
      {
        question: "Which sentence is grammatically correct?",
        options: ["I are happy", "I is happy", "I am happy", "I be happy"],
        correctAnswer: "I am happy",
        explanation:
          "The correct form uses 'am' with the first person singular pronoun 'I'.",
        points: 10,
      },
    ],
  },
  // Class 10 Arabic - Season 2
  {
    title: {
      en: "Arabic Part 3",
      ar: "اللغة العربية الجزء الثالث",
      ku: "عەرەبی بەش سێیەم",
    },
    description: "Advanced Arabic vocabulary and expressions",
    content: "Learn advanced vocabulary and common expressions in Arabic.",
    class: null, // Will be set after classes are created
    chapter: null,
    order: 1,
    difficulty: "Medium",
    estimatedTime: 55,
    exercises: [
      {
        question: "What does 'شكراً' mean in English?",
        options: ["Hello", "Thank you", "Goodbye", "Please"],
        correctAnswer: "Thank you",
        explanation: "شكراً (Shukran) means 'Thank you' in Arabic.",
        points: 10,
      },
    ],
  },
  {
    title: {
      en: "Arabic Part 4",
      ar: "اللغة العربية الجزء الرابع",
      ku: "عەرەبی بەش چوارەم",
    },
    description: "Introduction to Arabic literature",
    content: "Explore Arabic poetry and prose, understanding cultural context.",
    class: null, // Will be set after classes are created
    chapter: null,
    order: 2,
    difficulty: "Hard",
    estimatedTime: 70,
    exercises: [
      {
        question: "Who is considered the father of Arabic poetry?",
        options: ["Al-Mutanabbi", "Al-Ma'arri", "Imru' al-Qais", "Al-Farazdaq"],
        correctAnswer: "Imru' al-Qais",
        explanation:
          "Imru' al-Qais is often called the father of Arabic poetry.",
        points: 15,
      },
    ],
  },
  // Class 10 English - Season 2
  {
    title: {
      en: "English Part 3",
      ar: "اللغة الإنجليزية الجزء الثالث",
      ku: "ئینگلیزی بەش سێیەم",
    },
    description: "Advanced English grammar",
    content: "Learn advanced grammar concepts and complex sentence structures.",
    class: null, // Will be set after classes are created
    chapter: null,
    order: 1,
    difficulty: "Medium",
    estimatedTime: 60,
    exercises: [
      {
        question: "Choose the correct conditional sentence:",
        options: [
          "If I will study, I will pass",
          "If I study, I will pass",
          "If I studied, I will pass",
          "If I study, I pass",
        ],
        correctAnswer: "If I study, I will pass",
        explanation:
          "First conditional uses present simple in if-clause and will + base verb in main clause.",
        points: 15,
      },
    ],
  },
  {
    title: {
      en: "English Part 4",
      ar: "اللغة الإنجليزية الجزء الرابع",
      ku: "ئینگلیزی بەش چوارەم",
    },
    description: "English communication skills",
    content:
      "Develop speaking and listening skills for effective communication.",
    class: null, // Will be set after classes are created
    chapter: null,
    order: 2,
    difficulty: "Medium",
    estimatedTime: 45,
    exercises: [
      {
        question:
          "What is the most important aspect of effective communication?",
        options: [
          "Speaking loudly",
          "Using complex words",
          "Active listening",
          "Speaking quickly",
        ],
        correctAnswer: "Active listening",
        explanation:
          "Active listening is crucial for understanding and responding appropriately.",
        points: 10,
      },
    ],
  },
];

// Function to seed programs data
async function seedPrograms() {
  try {
    // Clear existing data
    await Subject.deleteMany({});
    await Chapter.deleteMany({});
    await Season.deleteMany({});
    console.log("Cleared existing programs data");

    // Get or create Class 10
    let class10 = await Class.findOne({ "name.en": "Class 10" });
    if (!class10) {
      console.log("Class 10 not found. Please run seedClasses.js first.");
      return;
    }

    // Insert seasons
    const seasons = await Season.insertMany(sampleSeasons);
    console.log(`Created ${seasons.length} seasons`);

    // Insert subjects first (before chapters since chapters need subject references)
    sampleSubjects[0].class = class10._id; // Arabic Part 1
    sampleSubjects[1].class = class10._id; // Arabic Part 2
    sampleSubjects[2].class = class10._id; // English Part 1
    sampleSubjects[3].class = class10._id; // English Part 2
    sampleSubjects[4].class = class10._id; // Arabic Part 3
    sampleSubjects[5].class = class10._id; // Arabic Part 4
    sampleSubjects[6].class = class10._id; // English Part 3
    sampleSubjects[7].class = class10._id; // English Part 4

    const subjects = await Subject.insertMany(sampleSubjects);
    console.log(`Created ${subjects.length} subjects`);

    // Now create chapters and link them to subjects
    sampleChapters[0].subject = subjects[0]._id; // Arabic Introduction - Arabic Part 1
    sampleChapters[0].season = "Season 1";
    sampleChapters[1].subject = subjects[1]._id; // Arabic Grammar - Arabic Part 2
    sampleChapters[1].season = "Season 1";
    sampleChapters[2].subject = subjects[2]._id; // English Reading - English Part 1
    sampleChapters[2].season = "Season 1";
    sampleChapters[3].subject = subjects[3]._id; // English Writing - English Part 2
    sampleChapters[3].season = "Season 1";
    sampleChapters[4].subject = subjects[4]._id; // Arabic Vocabulary - Arabic Part 3
    sampleChapters[4].season = "Season 2";
    sampleChapters[5].subject = subjects[5]._id; // Arabic Literature - Arabic Part 4
    sampleChapters[5].season = "Season 2";
    sampleChapters[6].subject = subjects[6]._id; // English Grammar - English Part 3
    sampleChapters[6].season = "Season 2";
    sampleChapters[7].subject = subjects[7]._id; // English Communication - English Part 4
    sampleChapters[7].season = "Season 2";

    // Insert chapters
    const chapters = await Chapter.insertMany(sampleChapters);
    console.log(`Created ${chapters.length} chapters`);

    // Display summary
    console.log("\n=== Programs Data Summary ===");
    console.log(`Seasons: ${seasons.length}`);
    seasons.forEach((season) => {
      console.log(`  - ${season.name.en}: ${season.description}`);
    });

    console.log(`\nChapters: ${chapters.length}`);
    chapters.forEach((chapter) => {
      console.log(`  - ${chapter.title} (${chapter.season})`);
    });

    console.log(`\nSubjects: ${subjects.length}`);
    subjects.forEach((subject) => {
      console.log(`  - ${subject.title.en} (Class 10)`);
    });
  } catch (error) {
    console.error("Error seeding programs data:", error);
  } finally {
    mongoose.connection.close();
    console.log("\nDatabase connection closed");
  }
}

// Run the seeding function
seedPrograms();
