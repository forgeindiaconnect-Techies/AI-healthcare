require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkDb() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  const user = await User.findOne({ email: 'james@email.com' });
  console.log('User found:', user ? user.email : 'NOT FOUND');
  await mongoose.disconnect();
}

checkDb();
