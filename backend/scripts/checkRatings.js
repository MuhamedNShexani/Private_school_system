const mongoose = require("mongoose");
require("dotenv").config();

// Function to check ratings
async function checkRatings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/student_exercises",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("MongoDB connected successfully");

    const ratingsCollection = mongoose.connection.db.collection("ratings");

    // Get all ratings
    const allRatings = await ratingsCollection.find({}).toArray();
    console.log(`Total ratings in database: ${allRatings.length}`);

    if (allRatings.length > 0) {
      console.log("\nSample rating structure:");
      console.log(JSON.stringify(allRatings[0], null, 2));

      // Check ratings by class
      const ratingsByClass = await ratingsCollection
        .aggregate([
          {
            $group: {
              _id: "$studentClass",
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();

      console.log("\nRatings by class:");
      ratingsByClass.forEach((item) => {
        console.log(`  Class ${item._id}: ${item.count} ratings`);
      });

      // Check date ranges
      const dateStats = await ratingsCollection
        .aggregate([
          {
            $group: {
              _id: null,
              minDate: { $min: "$date" },
              maxDate: { $max: "$date" },
            },
          },
        ])
        .toArray();

      if (dateStats.length > 0) {
        console.log("\nDate range:");
        console.log(`  Earliest: ${dateStats[0].minDate}`);
        console.log(`  Latest: ${dateStats[0].maxDate}`);
      }
    } else {
      console.log("\n⚠️ No ratings found in database!");
    }
  } catch (error) {
    console.error("Error checking ratings:", error);
  } finally {
    mongoose.connection.close();
    console.log("\nDatabase connection closed");
  }
}

// Run the check function
checkRatings().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
