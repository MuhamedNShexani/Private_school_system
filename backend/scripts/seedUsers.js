const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

// Connect to MongoDB
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

// Seed initial users
const seedUsers = async () => {
  try {
    // Clear existing users (optional - remove this in production)
    await User.deleteMany({});
    console.log("Cleared existing users");

    // Create default admin user
    const adminUser = new User({
      email: "admin@platform.com",
      password: "admin123", // Will be hashed automatically
      firstName: "System",
      lastName: "Administrator",
      role: "Admin",
      adminProfile: {
        permissions: [
          "manage_users",
          "manage_classes",
          "manage_subjects",
          "manage_seasons",
          "manage_chapters",
          "view_analytics",
        ],
      },
    });

    await adminUser.save();
    console.log("✅ Created admin user:", adminUser.email);

    // Create sample teacher user
    const teacherUser = new User({
      email: "teacher@platform.com",
      password: "teacher123",
      firstName: "John",
      lastName: "Teacher",
      role: "Teacher",
      teacherProfile: {
        employeeNumber: "T001",
        subjects: [], // Will be populated when subjects are created
      },
    });

    await teacherUser.save();
    console.log("✅ Created teacher user:", teacherUser.email);

    // Create sample student user
    const studentUser = new User({
      email: "student@platform.com",
      password: "student123",
      firstName: "Jane",
      lastName: "Student",
      role: "Student",
      studentProfile: {
        studentNumber: "S001",
        class: null, // Will be populated when classes are created
        branchID: null, // Will be populated when branches are created
      },
    });

    await studentUser.save();
    console.log("✅ Created student user:", studentUser.email);

    console.log("\n🎉 User seeding completed successfully!");
    console.log("\nDefault login credentials:");
    console.log("Admin: admin@platform.com / admin123");
    console.log("Teacher: teacher@platform.com / teacher123");
    console.log("Student: student@platform.com / student123");
  } catch (error) {
    console.error("Error seeding users:", error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeding function
seedUsers();
