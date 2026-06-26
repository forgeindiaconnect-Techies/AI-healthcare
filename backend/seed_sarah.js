const axios = require('axios');

async function registerDoctor() {
  try {
    const res = await axios.post('https://ai-healthcare-ohi4.onrender.com/api/auth/register', {
      name: 'Dr. Sarah Johnson',
      email: 'sarah@healthsys.com',
      password: 'Doctor@123',
      role: 'doctor',
      specialization: 'Cardiology',
      licenseNumber: 'LIC001'
    });
    console.log(`Registered sarah@healthsys.com`);
  } catch (err) {
    if (err.response) {
      console.log(`Failed:`, err.response.data);
    } else {
      console.log(`Failed:`, err.message);
    }
  }
}

registerDoctor();
