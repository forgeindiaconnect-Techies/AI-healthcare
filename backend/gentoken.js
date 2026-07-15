require('dotenv').config({path: './.env'});
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

mongoose.connect('mongodb+srv://anburox111:anburox111@cluster0.a2m5b.mongodb.net/ai-healthcare?retryWrites=true&w=majority').then(async () => {
  try {
    const user = await User.findOne({ role: 'doctor' }).exec();
    if (user) {
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
      console.log('TOKEN:', token);
    } else {
      console.log('No doctor found');
    }
  } catch(e) {
    console.error(e)
  }
  process.exit(0);
});
