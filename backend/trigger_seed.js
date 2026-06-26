const axios = require('axios');

async function triggerSeed() {
  try {
    const res = await axios.get('https://ai-healthcare-ohi4.onrender.com/api/auth/seed-db?key=secretdemoseed123');
    console.log('Success:', res.data);
  } catch (err) {
    if (err.response) {
      console.log('Failed:', err.response.data);
    } else {
      console.log('Failed:', err.message);
    }
  }
}

triggerSeed();
