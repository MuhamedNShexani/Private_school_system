const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/student-exercises";

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB connected successfully");
    
    const db = mongoose.connection.db;
    const collection = db.collection("studentexercisegrades");
    
    try {
      // Drop the existing problematic unique index
      console.log("Dropping existing unique index on student_1_exercise_1...");
      await collection.dropIndex("student_1_exercise_1");
      console.log("✓ Dropped index successfully");
    } catch (error) {
      if (error.code === 27 || error.codeName === "IndexNotFound") {
        console.log("Index doesn't exist, skipping drop");
      } else {
        console.error("Error dropping index:", error);
      }
    }
    
    try {
      // Drop the existing composite index for non-exercise types if it exists
      console.log("Dropping existing composite index for non-exercise types...");
      await collection.dropIndex("student_1_subject_1_season_1_gradingType_1_monthlyExamNumber_1");
      console.log("✓ Dropped composite index successfully");
    } catch (error) {
      if (error.code === 27 || error.codeName === "IndexNotFound") {
        console.log("Composite index doesn't exist, skipping drop");
      } else {
        console.error("Error dropping composite index:", error);
      }
    }
    
    // Create new index with partial filter - only for exercises (exercise is an ObjectId)
    console.log("Creating new unique index with partial filter for exercises...");
    await collection.createIndex(
      { student: 1, exercise: 1 },
      {
        unique: true,
        partialFilterExpression: { exercise: { $type: "objectId" } },
        name: "student_1_exercise_1_unique"
      }
    );
    console.log("✓ Created new index for exercises");
    
    // Create unique index for non-exercise types
    // We check that exercise is null (non-exercise types have null exercise)
    console.log("Creating unique index for non-exercise types...");
    await collection.createIndex(
      { student: 1, subject: 1, season: 1, gradingType: 1, monthlyExamNumber: 1 },
      {
        unique: true,
        partialFilterExpression: { exercise: null },
        name: "student_subject_season_gradingType_monthlyExamNumber_unique"
      }
    );
    console.log("✓ Created new index for non-exercise types");
    
    console.log("\n✓ All indexes fixed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

