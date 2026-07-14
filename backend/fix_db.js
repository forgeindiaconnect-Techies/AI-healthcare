const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Doctor = require('./models/Doctor');
  const docs = await Doctor.find({ medicalLicenseNumber: { $exists: false } });
  const docs2 = await Doctor.find({ medicalLicenseNumber: null });
  const allDocs = [...docs, ...docs2];
  
  console.log('Found ' + allDocs.length + ' corrupted doctors');
  for (let i = 0; i < allDocs.length; i++) {
    allDocs[i].medicalLicenseNumber = 'FIXED-' + Date.now() + '-' + i;
    await allDocs[i].save();
  }
  console.log('Fixed');
  process.exit(0);
}).catch(console.error);
