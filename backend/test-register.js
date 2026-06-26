const axios = require('axios');

async function registerAll() {
  const users = [
    { name: 'Dr. Sarah Johnson', email: 'sarah@healthsys.com', password: 'Doctor@123', role: 'doctor' },
    { name: 'System Admin', email: 'admin@healthsys.com', password: 'Admin@123', role: 'admin' }
  ];

  for (const u of users) {
    try {
      const res = await axios.post('https://ai-healthcare-ohi4.onrender.com/api/auth/register', u);
      console.log(`Registered ${u.email}`);
    } catch (err) {
      if (err.response) {
        console.log(`Failed ${u.email}:`, err.response.data);
      } else {
        console.log(`Failed ${u.email}:`, err.message);
      }
    }
  }
}

registerAll();
