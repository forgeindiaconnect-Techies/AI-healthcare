const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') }); 

const AppointmentSlot = require('../models/AppointmentSlot');
const Appointment = require('../models/Appointment');

const fixSlotStatuses = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected.');

    console.log('Finding appointments that have a slotId...');
    const activeAppointments = await Appointment.find({
      slotId: { $exists: true, $ne: null },
      status: { $nin: ['Cancelled', 'Rejected', 'no-show', 'rescheduled', 'cancelled'] },
      isDeleted: { $ne: true }
    });
    
    console.log(`Found ${activeAppointments.length} active appointments with slot IDs.`);

    let fixedCount = 0;
    
    for (const appointment of activeAppointments) {
      // Find the slot
      const slot = await AppointmentSlot.findById(appointment.slotId);
      
      if (slot && slot.status === 'AVAILABLE') {
        console.log(`Fixing slot ${slot._id} for appointment ${appointment._id}`);
        slot.status = 'BOOKED';
        slot.appointmentId = appointment._id;
        await slot.save();
        fixedCount++;
      }
    }

    console.log(`Migration completed successfully. Fixed ${fixedCount} orphaned available slots.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
};

fixSlotStatuses();
