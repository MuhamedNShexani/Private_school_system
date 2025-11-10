const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

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
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: "Admin" });
    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.username);
      return;
    }

    // Hash the admin password
    const hashedPassword = await bcrypt.hash("admin123", 12);

    // Create admin user
    const adminUser = new User({
      firstName: "Admin",
      lastName: "User",
      email: "admin@school.com",
      password: hashedPassword,
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
        department: "Administration",
      },
    });

    const savedAdmin = await adminUser.save();
    console.log("Admin user recovered successfully!");
    console.log("Email: admin@school.com");
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
