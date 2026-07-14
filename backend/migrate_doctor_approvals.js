const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const db = mongoose.connection.db;
    
    // Migrate existing verified doctors who have status APPROVED or are otherwise considered verified
    // We will set approvalStatus to "approved" and isVerified to true for any doctor with status 'APPROVED'
    const result = await db.collection('doctors').updateMany(
      { status: 'APPROVED' },
      [
        {
          $set: {
            approvalStatus: 'approved',
            isVerified: true
          }
        }
      ]
    );

    // Any doctor with status 'PENDING', 'DRAFT', etc., will just retain the default 'pending' approvalStatus
    // that mongoose defaults to, but we can explicitly set it just in case.
    await db.collection('doctors').updateMany(
      { status: { $ne: 'APPROVED' }, approvalStatus: { $exists: false } },
      [
        {
          $set: {
            approvalStatus: 'pending',
            isVerified: false
          }
        }
      ]
    );

    console.log(`Migration complete. Approved ${result.modifiedCount} existing doctors.`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
