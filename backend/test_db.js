const mongoose = require('mongoose');
require('dotenv').config();
const Diagnosis = require('./models/Diagnosis');
const Doctor = require('./models/Doctor');

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://forge:forge123@cluster0.b5nvd.mongodb.net/ai-healthcare?retryWrites=true&w=majority')
  .then(async () => {
    const d = await Diagnosis.find().lean();
    console.log("Total diagnoses:", d.length);
    if(d.length > 0) {
      console.log(d[0]);
    }
    const docs = await Doctor.find().lean();
    console.log("Doctors:", docs.length);
    process.exit();
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
