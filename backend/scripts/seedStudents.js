const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Student = require("../models/Student");
const User = require("../models/User");
const Class = require("../models/Class");
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

// Sample student data
const sampleStudents = [
  {
    fullName: "Alice Johnson",
    email: "alice.johnson@example.com",
    phone: "123-456-7890",
    username: "alice.johnson",
    parentsNumber: "987-654-3210",
    class: null, // Will be set after classes are created
    branchID: null, // Will be set after classes are created
    gender: "Female",
    studentNumber: "STU001",
    status: {
      math: "Active",
      science: "Active",
      english: "Inactive",
    },
    paymentStatus: "Paid",
  },
  {
    fullName: "Bob Smith",
    email: "bob.smith@example.com",
    phone: "123-456-7891",
    username: "bob.smith",
    parentsNumber: "987-654-3211",
    class: null, // Will be set after classes are created
    branchID: null, // Will be set after classes are created
    gender: "Male",
    studentNumber: "STU002",
    status: {
      math: "Active",
      science: "Inactive",
      english: "Active",
    },
    paymentStatus: "Unpaid",
  },
  {
    fullName: "Carol Davis",
    email: "carol.davis@example.com",
    phone: "123-456-7892",
    username: "carol.davis",
    parentsNumber: "987-654-3212",
    class: null, // Will be set after classes are created
    branchID: null, // Will be set after classes are created
    gender: "Female",
    studentNumber: "STU003",
    status: {
      math: "Inactive",
      science: "Active",
      english: "Active",
    },
    paymentStatus: "Partial",
  },
  {
    fullName: "David Wilson",
    email: "david.wilson@example.com",
    phone: "123-456-7893",
    username: "david.wilson",
    parentsNumber: "987-654-3213",
    class: null, // Will be set after classes are created
    branchID: null, // Will be set after classes are created
    gender: "Male",
    studentNumber: "STU004",
    status: {
      math: "Active",
      science: "Active",
      english: "Active",
    },
    paymentStatus: "Paid",
  },
  {
    fullName: "Eva Brown",
    email: "eva.brown@example.com",
    phone: "123-456-7894",
    username: "eva.brown",
    parentsNumber: "987-654-3214",
    class: null, // Will be set after classes are created
    branchID: null, // Will be set after classes are created
    gender: "Female",
    studentNumber: "STU005",
    status: {
      math: "Inactive",
      science: "Inactive",
      english: "Inactive",
    },
    paymentStatus: "Unpaid",
  },
];

// Function to seed students
async function seedStudents() {
  try {
    // Clear existing students
    await Student.deleteMany({});
    console.log("Cleared existing students");

    // Get classes
    const classes = await Class.find();

    if (classes.length === 0) {
      console.log("No classes found. Please run seedClasses.js first.");
      return;
    }

    // Set class and branch references for students
    sampleStudents[0].class = classes[0]._id;
    sampleStudents[0].branchID = classes[0].branches[0]?._id;

    sampleStudents[1].class = classes[0]._id;
    sampleStudents[1].branchID = classes[0].branches[0]?._id;

    sampleStudents[2].class = classes[1]?._id || classes[0]._id;
    sampleStudents[2].branchID =
      classes[1]?.branches[0]?._id || classes[0].branches[0]?._id;

    sampleStudents[3].class = classes[1]?._id || classes[0]._id;
    sampleStudents[3].branchID =
      classes[1]?.branches[0]?._id || classes[0].branches[0]?._id;

    sampleStudents[4].class = classes[0]._id;
    sampleStudents[4].branchID =
      classes[0].branches[1]?._id || classes[0].branches[0]?._id;

    // Hash password for all students
    const hashedPassword = await bcrypt.hash("password123", 12);

    // Insert sample students
    const students = await Student.insertMany(
      sampleStudents.map((student) => ({
        ...student,
        password: hashedPassword,
      }))
    );
    console.log(`Seeded ${students.length} students successfully`);

    // Create corresponding User accounts
    const users = [];
    for (const student of students) {
      const user = new User({
        firstName: student.fullName.split(" ")[0] || student.fullName,
        lastName: student.fullName.split(" ").slice(1).join(" ") || "",
        username: student.username,
        email: student.email,
        password: hashedPassword,
        role: "Student",
        studentProfile: {
          class: student.class,
          branchID: student.branchID,
          studentNumber: student.studentNumber,
          parentsNumber: student.parentsNumber,
        },
      });
      const savedUser = await user.save();
      users.push(savedUser);
    }
    console.log(`Created ${users.length} user accounts successfully`);

    // Display created students
    console.log("\nCreated students:");
    students.forEach((student, index) => {
      console.log(
        `${index + 1}. ${student.fullName} (${student.email}) - Username: ${
          student.username
        }`
      );
      console.log(
        `   Gender: ${student.gender}, Payment: ${student.paymentStatus}`
      );
      console.log(`   Parents: ${student.parentsNumber}`);
      console.log(`   Status:`, student.status);
      console.log("");
    });
  } catch (error) {
    console.error("Error seeding students:", error);
  } finally {
    mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the seeding function
seedStudents();
