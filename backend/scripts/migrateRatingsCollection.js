const mongoose = require("mongoose");

// Connect to MongoDB
const mongoUri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/student-exercises";

async function migrateRatings() {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const studentsCollection = db.collection("students");
    const ratingsCollection = db.collection("ratings");

    // Step 1: Migrate data from students.ratings to ratings collection
    console.log("📋 Step 1: Migrating ratings to new collection...");

    const migrationResult = await db.collection("students").aggregate([
      { $unwind: "$ratings" },
      {
        $project: {
          _id: "$ratings._id",
          studentId: "$_id",
          subjectId: "$ratings.subjectId",
          season: "$ratings.season",
          date: "$ratings.date",
          rating: "$ratings.rating",
          ratedAt: "$ratings.ratedAt",
        },
      },
      { $out: "ratings" },
    ]);

    await migrationResult.toArray();
    console.log("✅ Ratings migrated to new collection");

    // Step 2: Verify migration
    console.log("📋 Step 2: Verifying migration...");
    const ratingCount = await ratingsCollection.countDocuments();
    console.log(`✅ Found ${ratingCount} ratings in new collection`);

    // Step 3: Remove ratings from students
    console.log("📋 Step 3: Removing ratings from students collection...");
    const updateResult = await studentsCollection.updateMany(
      {},
      { $unset: { ratings: "" } }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} student documents`);

    // Step 4: Final verification
    console.log("📋 Step 4: Final verification...");
    const studentWithoutRatings = await studentsCollection.findOne();
    console.log(
      "✅ Sample student document:",
      JSON.stringify(studentWithoutRatings, null, 2)
    );

    const sampleRating = await ratingsCollection.findOne();
    console.log(
      "✅ Sample rating document:",
      JSON.stringify(sampleRating, null, 2)
    );

    console.log("✅✅✅ MIGRATION COMPLETE! ✅✅✅");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error:", err);
    process.exit(1);
  }
}

migrateRatings();
