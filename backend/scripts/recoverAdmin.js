const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

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

// Function to recover admin user
async function recoverAdmin() {
  try {
    // Check if admin user already exists with the correct email
    const existingAdmin = await User.findOne({
      $or: [{ email: "admin@platform.com" }, { role: "Admin" }],
    });

    if (existingAdmin) {
      if (existingAdmin.email === "admin@platform.com") {
        console.log(
          "Admin user already exists with email:",
          existingAdmin.email
        );
        console.log(
          "If you need to reset the password, delete the user first."
        );
        return;
      } else {
        console.log(
          "Found existing admin with different email:",
          existingAdmin.email
        );
        console.log("Creating new admin with admin@platform.com...");
      }
    }

    // Create admin user (password will be hashed by User model's pre-save hook)
    const adminUser = new User({
      firstName: "System",
      lastName: "Administrator",
      email: "admin@platform.com",
      password: "admin123", // Will be automatically hashed by pre-save hook
      role: "Admin",
      isActive: true,
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

    const savedAdmin = await adminUser.save();
    console.log("Admin user recovered successfully!");
    console.log("Email: admin@platform.com");
    console.log("Password: admin123");
    console.log("Role: Admin");
    console.log("Admin ID:", savedAdmin._id);
  } catch (error) {
    console.error("Error recovering admin user:", error);
  } finally {
    mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the recovery function
recoverAdmin();
