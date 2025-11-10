const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Class = require("../models/Class");

// Load environment variables
dotenv.config();

// MongoDB connection
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/student_exercises",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Sample classes data
const sampleClasses = [
  {
    name: {
      en: "Class 10",
      ar: "الصف العاشر",
      ku: "پۆلی دەیەم",
    },
    branches: [
      {
        name: {
          en: "Science",
          ar: "علمي",
          ku: "زانستی",
        },
        description: "Science stream with Physics, Chemistry, Biology",
        isActive: true,
      },
      {
        name: {
          en: "Commerce",
          ar: "تجاري",
          ku: "بازرگانی",
        },
        description: "Commerce stream with Business Studies, Economics",
        isActive: true,
      },
      {
        name: {
          en: "Arts",
          ar: "أدبي",
          ku: "ئەدەبی",
        },
        description: "Arts stream with Literature, History, Geography",
        isActive: true,
      },
    ],
    isActive: true,
  },
  {
    name: {
      en: "Class 11",
      ar: "الصف الحادي عشر",
      ku: "پۆلی یازدەم",
    },
    branches: [
      {
        name: {
          en: "Science",
          ar: "علمي",
          ku: "زانستی",
        },
        description: "Advanced Science stream with specialized subjects",
        isActive: true,
      },
      {
        name: {
          en: "Commerce",
          ar: "تجاري",
          ku: "بازرگانی",
        },
        description: "Advanced Commerce stream with professional courses",
        isActive: true,
      },
      {
        name: {
          en: "Arts",
          ar: "أدبي",
          ku: "ئەدەبی",
        },
        description: "Advanced Arts stream with cultural studies",
        isActive: true,
      },
    ],
    isActive: true,
  },
  {
    name: {
      en: "Class 12",
      ar: "الصف الثاني عشر",
      ku: "پۆلی دوانزەم",
    },
    branches: [
      {
        name: {
          en: "Science",
          ar: "علمي",
          ku: "زانستی",
        },
        description: "Final year Science preparation for higher studies",
        isActive: true,
      },
      {
        name: {
          en: "Commerce",
          ar: "تجاري",
          ku: "بازرگانی",
        },
        description: "Final year Commerce preparation for business studies",
        isActive: true,
      },
      {
        name: {
          en: "Arts",
          ar: "أدبي",
          ku: "ئەدەبی",
        },
        description: "Final year Arts preparation for humanities",
        isActive: true,
      },
    ],
    isActive: true,
  },
];

// Function to seed classes data
async function seedClasses() {
  try {
    // Clear existing classes
    await Class.deleteMany({});
    console.log("Cleared existing classes");

    // Insert sample classes
    const classes = await Class.insertMany(sampleClasses);
    console.log(`Created ${classes.length} classes successfully`);

    // Display created classes
    console.log("\nCreated classes:");
    classes.forEach((classData, index) => {
      console.log(
        `${index + 1}. ${classData.name.en} - ${
          classData.branches.length
        } branches`
      );
      classData.branches.forEach((branch, branchIndex) => {
        console.log(
          `   ${branchIndex + 1}. ${branch.name.en}: ${branch.description}`
        );
      });
      console.log("");
    });
  } catch (error) {
    console.error("Error seeding classes:", error);
  } finally {
    mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the seeding function
seedClasses();
