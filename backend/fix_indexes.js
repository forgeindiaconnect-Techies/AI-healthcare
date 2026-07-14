const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const collection = db.collection('doctors');
  
  const indexes = await collection.indexes();
  console.log("Current indexes:", indexes.map(i => i.name));

  for (const index of indexes) {
    // Drop incorrect unique indexes on licenseNumber or medicalLicenseNumber if they are stale
    if (index.name !== '_id_' && index.name !== 'user_1') {
      console.log(`Dropping index ${index.name}...`);
      await collection.dropIndex(index.name);
    }
  }

  // Re-sync correct indexes based on the mongoose model
  const Doctor = require('./models/Doctor');
  await Doctor.syncIndexes();
  console.log("Re-synced indexes successfully!");

  process.exit(0);
}).catch(console.error);
