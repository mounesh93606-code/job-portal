const axios = require('axios');

async function test() {
  try {
    console.log('Logging in...');
    const loginRes = await axios.post('https://job-portal-production-cbdc.up.railway.app/api/auth/login', {
      email: 'techcorp@jobs.com',
      password: 'password123'
    });
    const token = loginRes.data.token;
    console.log('Login successful. Token acquired.');

    console.log('Attempting to schedule interview...');
    const scheduleRes = await axios.put('https://job-portal-production-cbdc.up.railway.app/api/applications/7/schedule', {
      interviewDate: '2026-07-15',
      interviewTime: '4pm',
      interviewLink: 'https://meet.google.com/abc-defg-hij'
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Schedule Response:', scheduleRes.data);

  } catch (err) {
    console.error('API call failed:', err.response ? err.response.data : err.message);

    console.log('Fetching error logs from backend...');
    try {
      const debugRes = await axios.get('https://job-portal-production-cbdc.up.railway.app/api/debug-errors');
      console.log('Backend errors captured:', JSON.stringify(debugRes.data, null, 2));
    } catch (debugErr) {
      console.error('Failed to get backend debug logs:', debugErr.message);
    }
  }
}

test();
