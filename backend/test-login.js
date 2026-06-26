const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('https://ai-healthcare-ohi4.onrender.com/api/auth/login', {
      email: 'james@email.com',
      password: 'Patient@123'
    });
    console.log('Success:', res.data);
  } catch (err) {
    if (err.response) {
      console.log('Error Status:', err.response.status);
      console.log('Error Data:', err.response.data);
    } else {
      console.log('Network Error:', err.message);
    }
  }
}

testLogin();
