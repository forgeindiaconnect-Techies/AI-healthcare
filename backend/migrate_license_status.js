const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const Doctor = require('./models/Doctor');

const migrate = async () => {
  await connectDB();
  
  try {
    console.log('Starting migration...');
    const doctors = await Doctor.find({});
    let updated = 0;
    
    for (const doctor of doctors) {
      let needsUpdate = false;
      
      if (!doctor.licenseVerificationStatus) {
        if (doctor.medicalLicenseVerificationStatus === 'VERIFIED') {
          doctor.licenseVerificationStatus = 'verified';
          doctor.isLicenseVerified = true;
        } else {
          doctor.licenseVerificationStatus = 'pending';
          doctor.isLicenseVerified = false;
        }
        needsUpdate = true;
      }
      
      if (!doctor.registrationCouncil) {
        doctor.registrationCouncil = doctor.medicalCouncil || 'National Medical Commission';
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await doctor.save();
        updated++;
      }
    }
    
    console.log(`Migration complete. Updated ${updated} doctor records.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
