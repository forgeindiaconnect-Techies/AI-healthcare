require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const MedicalReport = require('../models/MedicalReport');
const Prescription = require('../models/Prescription');
const { Notification } = require('../models/index');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');
};

const seedData = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Patient.deleteMany({}), Doctor.deleteMany({}),
    Appointment.deleteMany({}), MedicalReport.deleteMany({}),
    Prescription.deleteMany({}), Notification.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // Create admin
  const admin = await User.create({
    name: 'System Admin',
    email: 'admin@healthsys.com',
    password: 'Admin@123',
    role: 'admin',
    isEmailVerified: true,
    isActive: true,
  });



  console.log('\n✅ Database seeded successfully!\n');
  console.log('='.repeat(50));
  console.log('Demo Credentials:');
  console.log('-'.repeat(50));
  console.log('👨‍💼 Admin:   admin@healthsys.com   | Admin@123');

  console.log('='.repeat(50));

  process.exit(0);
};

seedData().catch((err) => {
  console.error('❌ Seeding failed:', err.message);
  process.exit(1);
});
