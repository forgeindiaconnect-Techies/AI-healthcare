require('dotenv').config();
const mongoose = require('mongoose');
const DoctorDocument = require('./models/DoctorDocument');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const docs = await DoctorDocument.find({});
    console.log(`Found ${docs.length} documents`);

    let updatedCount = 0;
    for (const doc of docs) {
      if (doc.verificationStatus === 'PENDING') {
        doc.verificationStatus = 'pending';
        await doc.save();
        updatedCount++;
      } else if (doc.verificationStatus === 'VERIFIED') {
        doc.verificationStatus = 'verified';
        await doc.save();
        updatedCount++;
      } else if (doc.verificationStatus === 'REUPLOAD_REQUIRED') {
        doc.verificationStatus = 'changes_requested';
        await doc.save();
        updatedCount++;
      } else if (doc.verificationStatus === 'REJECTED') {
        doc.verificationStatus = 'rejected';
        await doc.save();
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} documents`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
