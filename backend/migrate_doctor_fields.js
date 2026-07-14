const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const db = mongoose.connection.db;
    
    // Standardize 'specialist' to 'specialization'
    await db.collection('doctors').updateMany(
      { specialist: { $exists: true } },
      [
        { $set: { specialization: '$specialist' } },
        { $unset: ['specialist'] }
      ]
    );

    // Standardize 'experienceYears' to 'experience'
    await db.collection('doctors').updateMany(
      { experienceYears: { $exists: true } },
      [
        { $set: { experience: '$experienceYears' } },
        { $unset: ['experienceYears'] }
      ]
    );

    console.log('Migration complete. Standardized field names.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
