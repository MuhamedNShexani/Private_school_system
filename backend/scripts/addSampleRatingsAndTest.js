const mongoose = require("mongoose");

const mongoUri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/student-exercises";

async function addSampleRatingsAndTest() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    console.log(`📍 Connection string: ${mongoUri}`);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB\n");

    const db = mongoose.connection.db;

    // Step 1: Check if students exist
    console.log("📊 Checking students collection...");
    const studentsCount = await db.collection("students").countDocuments();
    console.log(`Total students: ${studentsCount}`);

    if (studentsCount === 0) {
      console.log("⚠️  No students found! This is the problem.");
      console.log("👉 Please make sure your MongoDB server is running!");
      console.log("👉 And the database name matches your connection string!");
      process.exit(1);
    }

    // Step 2: Get first student
    const firstStudent = await db.collection("students").findOne();
    console.log(`\nUsing student: ${firstStudent._id} (${firstStudent.fullName})`);

    // Step 3: Add sample ratings
    console.log("\n📝 Adding sample ratings...");
    const ratingsToAdd = [
      {
        _id: new mongoose.Types.ObjectId(),
        studentId: firstStudent._id,
        subjectId: "English",
        season: "Season 1",
        date: new Date("2025-11-11"),
        rating: "Excellent",
        ratedAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        studentId: firstStudent._id,
        subjectId: "Math",
        season: "Season 1",
        date: new Date("2025-11-11"),
        rating: "Good",
        ratedAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        studentId: firstStudent._id,
        subjectId: "Arabic Language",
        season: "Season 1",
        date: new Date("2025-10-11"),
        rating: "Fair",
        ratedAt: new Date(),
      },
    ];

    const insertResult = await db
      .collection("ratings")
      .insertMany(ratingsToAdd);
    console.log(`✅ Added ${insertResult.insertedCount} ratings`);

    // Step 4: Verify ratings were added
    console.log("\n📊 Verifying ratings...");
    const allRatings = await db
      .collection("ratings")
      .find({ studentId: firstStudent._id })
      .toArray();
    console.log(`Found ${allRatings.length} ratings:`);
    allRatings.forEach((rating, i) => {
      console.log(
        `  ${i + 1}. ${rating.subjectId} - ${rating.rating} (${rating.date.toDateString()})`
      );
    });

    console.log("\n✅✅✅ SUCCESS! Sample ratings added!");
    console.log("\n📱 Now:");
    console.log("1. Go to Student Profile in browser");
    console.log("2. Hard refresh: Ctrl+Shift+R");
    console.log("3. Scroll to Student Ratings");
    console.log("4. You should see the ratings table! 🎉");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    if (err.message.includes("connect")) {
      console.error("\n⚠️  Connection Error - MongoDB might not be running!");
      console.error("💡 Make sure MongoDB is started on your machine");
    }
    process.exit(1);
  }
}

addSampleRatingsAndTest();

