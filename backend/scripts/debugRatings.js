const mongoose = require("mongoose");

const mongoUri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/student-exercises";

async function debugRatings() {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB\n");

    const db = mongoose.connection.db;

    // Check students collection
    console.log("📊 STUDENTS COLLECTION:");
    const studentsCount = await db.collection("students").countDocuments();
    console.log(`Total students: ${studentsCount}`);

    const sampleStudent = await db.collection("students").findOne();
    console.log("Sample student:", JSON.stringify(sampleStudent, null, 2));

    // Check ratings collection
    console.log("\n📊 RATINGS COLLECTION:");
    const ratingsCount = await db.collection("ratings").countDocuments();
    console.log(`Total ratings: ${ratingsCount}`);

    const allRatings = await db
      .collection("ratings")
      .find()
      .toArray();
    console.log("All ratings:", JSON.stringify(allRatings, null, 2));

    // Check if ratings collection exists
    const collections = await db.listCollections().toArray();
    const ratingsExists = collections.some(c => c.name === "ratings");
    console.log("\n📋 Ratings collection exists:", ratingsExists);

    // Get student Ss details
    console.log("\n🔍 STUDENT 'Ss' DETAILS:");
    const studentSs = await db
      .collection("students")
      .findOne({ fullName: "Ss" });
    console.log("Student Ss:", JSON.stringify(studentSs, null, 2));

    if (studentSs) {
      const ratingsForSs = await db
        .collection("ratings")
        .find({ studentId: studentSs._id })
        .toArray();
      console.log(
        `\nRatings for Ss (ID: ${studentSs._id}):`,
        JSON.stringify(ratingsForSs, null, 2)
      );
    }

    console.log("\n✅ DEBUG COMPLETE");
    process.exit(0);
  } catch (err) {
    console.error("❌ Debug error:", err);
    process.exit(1);
  }
}

debugRatings();

