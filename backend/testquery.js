const mongoose = require('mongoose');
const Appointment = require('./models/Appointment');
const User = require('./models/User');
const Doctor = require('./models/Doctor');

mongoose.connect('mongodb+srv://anburox111:anburox111@cluster0.a2m5b.mongodb.net/ai-healthcare?retryWrites=true&w=majority').then(async () => {
  try {
    const query = { isDeleted: { $ne: true } };
    const appointments = await Appointment.find(query).populate('patient', 'name email avatar phone').sort({ appointmentDate: -1, appointmentTime: -1 }).limit(1);
    console.log("Appointments ok:", appointments.length);

    const docQuery = {};
    const doctors = await Doctor.find(docQuery).populate('user', 'name email avatar phone').sort({ rating: -1, experience: -1 }).limit(1);
    console.log("Doctors ok:", doctors.length);
  } catch(e) {
    console.error(e)
  }
  process.exit(0);
});
