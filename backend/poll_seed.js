const axios = require('axios');

async function triggerSeed() {
  console.log('Polling for deployment to finish...');
  let retries = 30; // 5 minutes max
  while (retries > 0) {
    try {
      const res = await axios.get('https://ai-healthcare-ohi4.onrender.com/api/auth/seed-db?key=secretdemoseed123');
      console.log('Success:', res.data);
      break;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log('Deploy not ready yet, retrying in 10s...');
      } else {
        console.log('Failed:', err.response ? err.response.data : err.message);
        // If it's not a 404, the route exists but failed, so we stop.
        if (err.response && err.response.status !== 502 && err.response.status !== 503) break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 10000));
    retries--;
  }
}

triggerSeed();
