const mongoose = require("mongoose");
const Student = require("../models/Student");
require("dotenv").config();

// Connect to MongoDB
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

// Function to check payment data
async function checkPayments() {
  try {
    console.log("=== Checking Payment Data ===\n");

    // Check total students
    const totalStudents = await Student.countDocuments();
    console.log(`1. Total Students: ${totalStudents}`);

    // Check students with payment data
    const studentsWithFirstPayment = await Student.countDocuments({
      firstPayment: true,
    });
    const studentsWithSecondPayment = await Student.countDocuments({
      secondPayment: true,
    });
    const studentsWithBothPayments = await Student.countDocuments({
      firstPayment: true,
      secondPayment: true,
    });

    console.log(
      `2. Students with firstPayment = true: ${studentsWithFirstPayment}`
    );
    console.log(
      `3. Students with secondPayment = true: ${studentsWithSecondPayment}`
    );
    console.log(`4. Students with both payments: ${studentsWithBothPayments}`);

    // Sample student
    const sampleStudent = await Student.findOne();
    if (sampleStudent) {
      console.log("\n5. Sample Student Payment Data:");
      console.log("   - First Payment:", sampleStudent.firstPayment);
      console.log("   - Second Payment:", sampleStudent.secondPayment);
      console.log("   - First Payment Date:", sampleStudent.firstPaymentDate);
      console.log("   - Second Payment Date:", sampleStudent.secondPaymentDate);
    }

    // Test the aggregation query
    console.log("\n6. Testing Payment Aggregation Query...");
    const paymentStats = await Student.aggregate([
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          firstPaymentPaid: {
            $sum: { $cond: ["$firstPayment", 1, 0] },
          },
          secondPaymentPaid: {
            $sum: { $cond: ["$secondPayment", 1, 0] },
          },
          bothPaymentsPaid: {
            $sum: {
              $cond: [{ $and: ["$firstPayment", "$secondPayment"] }, 1, 0],
            },
          },
        },
      },
    ]);

    console.log("Aggregation Result:", JSON.stringify(paymentStats, null, 2));

    if (paymentStats.length > 0) {
      const stats = paymentStats[0];
      console.log("\n7. Payment Statistics:");
      console.log("   - Total Students:", stats.totalStudents);
      console.log("   - First Payment Paid:", stats.firstPaymentPaid);
      console.log("   - Second Payment Paid:", stats.secondPaymentPaid);
      console.log("   - Both Payments Paid:", stats.bothPaymentsPaid);
    } else {
      console.log("\n⚠️ No aggregation results returned!");
    }
  } catch (error) {
    console.error("Error checking payments:", error);
  } finally {
    mongoose.connection.close();
    console.log("\nDatabase connection closed");
  }
}

// Run the check function
checkPayments();
