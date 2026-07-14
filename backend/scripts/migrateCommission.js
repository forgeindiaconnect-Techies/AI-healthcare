const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: '../.env' });

const Doctor = require('../models/Doctor');

const migrateCommissions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected');

    const doctors = await Doctor.find({});
    
    let count = 0;
    for (const doctor of doctors) {
      let updated = false;

      if (!doctor.commissionRate) {
        doctor.commissionRate = 20;
        updated = true;
      }
      
      if (!doctor.consultationFeePaise && doctor.consultationFee) {
        doctor.consultationFeePaise = Math.round(doctor.consultationFee * 100);
        updated = true;
      }

      if (updated) {
        await doctor.save();
        count++;
      }
    }

    console.log(`Migration completed. Updated ${count} doctors.`);
    process.exit();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateCommissions();
