const mongoose = require('mongoose');

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/student_exercise_platform';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  
  // Get the students collection
  const db = mongoose.connection.db;
  const students = db.collection('students');
  
  // Delete N/A ratings
  students.updateMany(
    {},
    { $pull: { ratings: { subjectId: null } } }
  )
  .then(result1 => {
    console.log(`✅ Deleted ${result1.modifiedCount} documents with null subjectId`);
    
    // Also delete empty string subjectIds
    return students.updateMany(
      {},
      { $pull: { ratings: { subjectId: '' } } }
    );
  })
  .then(result2 => {
    console.log(`✅ Deleted ${result2.modifiedCount} documents with empty subjectId`);
    console.log('✅ ALL N/A records deleted!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error deleting records:', err);
    process.exit(1);
  });
})
.catch(err => {
  console.error('❌ Connection error:', err);
  process.exit(1);
});

