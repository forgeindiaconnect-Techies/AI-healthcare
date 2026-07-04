const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const MedicalReport = require('../models/MedicalReport');
const Prescription = require('../models/Prescription');
const { Notification } = require('../models/index');
const LabRecommendation = require('../models/LabRecommendation');
const Diagnosis = require('../models/Diagnosis');
const FollowUp = require('../models/FollowUp');
const TreatmentPlan = require('../models/TreatmentPlan');
const Report = require('../models/Report');

exports.seedDatabase = async (req, res) => {
  try {
    if (req.query.key !== 'secretdemoseed123') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Clear existing data
    await Promise.all([
      User.deleteMany({}), Patient.deleteMany({}), Doctor.deleteMany({}),
      Appointment.deleteMany({}), MedicalReport.deleteMany({}),
      Prescription.deleteMany({}), Notification.deleteMany({}),
      LabRecommendation.deleteMany({}), Diagnosis.deleteMany({}), FollowUp.deleteMany({}),
      TreatmentPlan.deleteMany({}), Report.deleteMany({})
    ]);

    // Create admin
    const admin = await User.create({
      name: 'System Admin', email: 'admin@healthsys.com', password: 'Admin@123',
      role: 'admin', isEmailVerified: true, isActive: true,
    });



    res.status(200).json({ success: true, message: 'Database seeded successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
