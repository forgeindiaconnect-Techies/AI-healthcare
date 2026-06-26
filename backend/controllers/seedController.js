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

    // Create doctors
    const doctorUsers = await User.create([
      { name: 'Dr. Sarah Johnson', email: 'sarah@healthsys.com', password: 'Doctor@123', role: 'doctor', phone: '+1234567890', gender: 'female', isEmailVerified: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah' },
      { name: 'Dr. Michael Chen', email: 'michael@healthsys.com', password: 'Doctor@123', role: 'doctor', phone: '+1234567891', gender: 'male', isEmailVerified: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael' },
      { name: 'Dr. Emily Rodriguez', email: 'emily@healthsys.com', password: 'Doctor@123', role: 'doctor', phone: '+1234567892', gender: 'female', isEmailVerified: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily' },
      { name: 'Dr. James Wilson', email: 'james.dr@healthsys.com', password: 'Doctor@123', role: 'doctor', phone: '+1234567893', gender: 'male', isEmailVerified: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james' },
    ]);

    const doctorProfiles = await Doctor.create([
      { user: doctorUsers[0]._id, specialization: 'Cardiology', licenseNumber: 'LIC001', experience: 12, consultationFee: 150, rating: 4.8, totalRatings: 124, bio: 'Experienced cardiologist specializing in heart disease prevention and treatment.', languages: ['English', 'Spanish'], isVerified: true, isAcceptingPatients: true, availability: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true }, { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true }, { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true }] },
      { user: doctorUsers[1]._id, specialization: 'Neurology', licenseNumber: 'LIC002', experience: 8, consultationFee: 200, rating: 4.6, totalRatings: 98, bio: 'Neurologist with expertise in stroke management and neurological disorders.', languages: ['English', 'Mandarin'], isVerified: true, isAcceptingPatients: true },
      { user: doctorUsers[2]._id, specialization: 'General Medicine', licenseNumber: 'LIC003', experience: 6, consultationFee: 100, rating: 4.9, totalRatings: 215, bio: 'Family physician focused on preventive care and holistic health.', languages: ['English', 'Spanish', 'Portuguese'], isVerified: true, isAcceptingPatients: true },
      { user: doctorUsers[3]._id, specialization: 'Orthopedics', licenseNumber: 'LIC004', experience: 15, consultationFee: 175, rating: 4.7, totalRatings: 167, bio: 'Orthopedic surgeon specializing in joint replacement and sports injuries.', languages: ['English'], isVerified: true, isAcceptingPatients: true },
    ]);

    // Create patients
    const patientUsers = await User.create([
      { name: 'James Miller', email: 'james@email.com', password: 'Patient@123', role: 'patient', phone: '+9876543210', gender: 'male', dateOfBirth: new Date('1990-05-15'), isEmailVerified: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james_patient' },
      { name: 'Emma Davis', email: 'emma@email.com', password: 'Patient@123', role: 'patient', phone: '+9876543211', gender: 'female', dateOfBirth: new Date('1985-08-22'), isEmailVerified: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma' },
      { name: 'Robert Brown', email: 'robert@email.com', password: 'Patient@123', role: 'patient', phone: '+9876543212', gender: 'male', dateOfBirth: new Date('1978-03-10'), isEmailVerified: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=robert' },
    ]);

    const patientProfiles = await Patient.create([
      { user: patientUsers[0]._id, bloodType: 'O+', height: 178, weight: 75, allergies: ['Penicillin', 'Dust'], chronicConditions: ['Hypertension'], currentMedications: [{ name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily' }], emergencyContact: { name: 'Sarah Miller', relationship: 'Spouse', phone: '+9876543220' }, healthScore: 78, exerciseFrequency: 'moderate', smokingStatus: 'never', vitals: [{ date: new Date(), bloodPressure: { systolic: 135, diastolic: 85 }, heartRate: 72, temperature: 37.0, oxygenSaturation: 98 }] },
      { user: patientUsers[1]._id, bloodType: 'A-', height: 165, weight: 58, allergies: [], chronicConditions: [], currentMedications: [], emergencyContact: { name: 'John Davis', relationship: 'Spouse', phone: '+9876543221' }, healthScore: 92, exerciseFrequency: 'active', smokingStatus: 'never', vitals: [{ date: new Date(), bloodPressure: { systolic: 118, diastolic: 75 }, heartRate: 68, temperature: 36.8, oxygenSaturation: 99 }] },
      { user: patientUsers[2]._id, bloodType: 'B+', height: 182, weight: 88, allergies: ['Sulfa'], chronicConditions: ['Type 2 Diabetes', 'Obesity'], currentMedications: [{ name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' }], emergencyContact: { name: 'Lisa Brown', relationship: 'Spouse', phone: '+9876543222' }, healthScore: 65, exerciseFrequency: 'light', smokingStatus: 'former', vitals: [{ date: new Date(), bloodPressure: { systolic: 145, diastolic: 92 }, heartRate: 84, temperature: 37.2, oxygenSaturation: 96, glucoseLevel: 185 }] },
    ]);

    // Create appointments
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const appointments = await Appointment.create([
      { patient: patientUsers[0]._id, doctor: doctorUsers[0]._id, appointmentDate: tomorrow, appointmentTime: '10:00', reason: 'Blood pressure follow-up', type: 'follow-up', status: 'confirmed', mode: 'in-person', consultationFee: 150 },
      { patient: patientUsers[0]._id, doctor: doctorUsers[2]._id, appointmentDate: nextWeek, appointmentTime: '14:30', reason: 'Annual checkup', type: 'checkup', status: 'pending', mode: 'in-person', consultationFee: 100 },
      { patient: patientUsers[1]._id, doctor: doctorUsers[0]._id, appointmentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), appointmentTime: '11:00', reason: 'Chest pain evaluation', type: 'specialist', status: 'completed', consultationFee: 150 },
      { patient: patientUsers[2]._id, doctor: doctorUsers[2]._id, appointmentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), appointmentTime: '09:30', reason: 'Diabetes management', type: 'follow-up', status: 'completed', consultationFee: 100 },
    ]);

    // Create prescriptions
    await Prescription.create([
      {
        patient: patientUsers[0]._id,
        doctor: doctorUsers[0]._id,
        appointment: appointments[0]._id,
        diagnosis: 'Hypertension - Stage 1',
        medicines: [
          { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days', instructions: 'Take with water in the morning', beforeFood: false },
          { name: 'Losartan', dosage: '50mg', frequency: 'Once daily', duration: '30 days', instructions: 'Take at bedtime', beforeFood: false },
        ],
        instructions: 'Monitor blood pressure twice daily. Reduce salt intake.',
        followUpDate: nextWeek,
        status: 'active',
      },
      {
        patient: patientUsers[2]._id,
        doctor: doctorUsers[2]._id,
        appointment: appointments[3]._id,
        diagnosis: 'Type 2 Diabetes Mellitus',
        medicines: [
          { name: 'Metformin', dosage: '1000mg', frequency: 'Twice daily', duration: '90 days', beforeFood: true, instructions: 'Take with meals' },
          { name: 'Glipizide', dosage: '5mg', frequency: 'Once daily', duration: '90 days', beforeFood: true, instructions: 'Take 30 minutes before breakfast' },
        ],
        instructions: 'Monitor blood glucose daily. Follow diabetic diet.',
        status: 'active',
      },
    ]);

    // Create lab recommendations
    await LabRecommendation.create([
      { patient: patientProfiles[0]._id, doctor: doctorProfiles[0]._id, testName: 'Complete Blood Count (CBC)', reason: 'Routine checkup', priority: 'Low', status: 'Pending' },
      { patient: patientProfiles[0]._id, doctor: doctorProfiles[0]._id, testName: 'Lipid Panel', reason: 'High cholesterol risk', priority: 'Medium', status: 'Completed' },
      { patient: patientProfiles[2]._id, doctor: doctorProfiles[2]._id, testName: 'HbA1c', reason: 'Diabetes monitoring', priority: 'High', status: 'Pending' }
    ]);

    // Create diagnoses
    await Diagnosis.create([
      { patient: patientProfiles[0]._id, doctor: doctorProfiles[0]._id, primaryDiagnosis: 'Hypertension Stage 1', possibleConditions: ['Essential Hypertension', 'Secondary Hypertension'], confidence: 95, riskLevel: 'Medium', symptoms: ['Headache', 'Dizziness'] },
      { patient: patientProfiles[2]._id, doctor: doctorProfiles[2]._id, primaryDiagnosis: 'Type 2 Diabetes Mellitus', possibleConditions: ['Type 2 Diabetes', 'Prediabetes'], confidence: 98, riskLevel: 'High', symptoms: ['Increased thirst', 'Frequent urination'] }
    ]);

    // Create follow-ups
    await FollowUp.create([
      { patient: patientProfiles[0]._id, doctor: doctorProfiles[0]._id, type: 'Blood Pressure Review', timeline: '7 Days', status: 'Scheduled', notes: 'Check blood pressure' },
      { patient: patientProfiles[2]._id, doctor: doctorProfiles[2]._id, type: 'Diabetes Monitoring', timeline: '30 Days', status: 'Scheduled', notes: 'Review HbA1c results' }
    ]);

    // Create Treatment Plans
    await TreatmentPlan.create([
      { 
        patient: patientProfiles[0]._id, doctor: doctorProfiles[0]._id, title: 'Hypertension Management Protocol', 
        description: 'Comprehensive plan to lower blood pressure naturally and medically.',
        goals: ['Maintain BP under 130/80', 'Reduce sodium intake', 'Daily light exercise'],
        instructions: 'Take prescribed Amlodipine daily. Avoid salty foods. Walk 30 minutes every evening.',
        startDate: new Date(), endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)), status: 'Active'
      },
      { 
        patient: patientProfiles[2]._id, doctor: doctorProfiles[2]._id, title: 'Diabetes Control Plan', 
        description: 'Strict monitoring and medication routine for Type 2 Diabetes.',
        goals: ['Lower HbA1c below 6.5%', 'Weight loss of 5kg'],
        instructions: 'Take Metformin twice daily. Follow the low-carb diet plan. Test blood sugar every morning.',
        startDate: new Date(), endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)), status: 'Active'
      }
    ]);

    // Create Reports
    await Report.create([
      {
        patient: patientProfiles[0]._id, doctor: doctorProfiles[0]._id, title: 'Annual Blood Work', type: 'Blood Test',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'blood_work_2023.pdf', status: 'Pending Review'
      },
      {
        patient: patientProfiles[2]._id, doctor: doctorProfiles[2]._id, title: 'Chest X-Ray', type: 'X-Ray',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'chest_xray_2023.pdf', status: 'Reviewed', doctorNotes: 'Clear lungs, no abnormalities detected.'
      }
    ]);

    // Create notifications
    await Notification.create([
      { user: patientUsers[0]._id, title: 'Appointment Confirmed', message: 'Your appointment with Dr. Sarah Johnson has been confirmed for tomorrow at 10:00 AM.', type: 'appointment', priority: 'high', isRead: false },
      { user: patientUsers[0]._id, title: 'Prescription Ready', message: 'Dr. Sarah Johnson has created a new prescription for you.', type: 'prescription', priority: 'high', isRead: false },
      { user: doctorUsers[0]._id, title: 'New Patient Appointment', message: 'James Miller has booked an appointment for tomorrow at 10:00 AM.', type: 'appointment', priority: 'normal', isRead: false },
    ]);

    res.status(200).json({ success: true, message: 'Database seeded successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
