const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function test() {
  const dummyFile = path.join(__dirname, 'dummy.pdf');
  fs.writeFileSync(dummyFile, 'Dummy PDF content');

  const form = new FormData();
  form.append('jobId', '1');
  form.append('coverLetter', 'Test cover letter');
  form.append('resume', fs.createReadStream(dummyFile));

  try {
    console.log('Logging in to get token...');
    const loginRes = await axios.post('https://job-portal-production-cbdc.up.railway.app/api/auth/login', {
      email: 'john@seeker.com',
      password: 'password123'
    });
    const token = loginRes.data.token;
    console.log('Login successful. Token acquired.');

    console.log('Submitting application...');
    const uploadRes = await axios.post('https://job-portal-production-cbdc.up.railway.app/api/applications', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    const resumePath = uploadRes.data.resumePath;
    console.log('Application submitted. Saved resume path:', resumePath);

    const fileUrl = `https://job-portal-production-cbdc.up.railway.app${resumePath}`;
    console.log('Fetching uploaded file from:', fileUrl);
    const fileRes = await axios.get(fileUrl);
    console.log('Fetch response status:', fileRes.status);
    console.log('Fetch response data:', fileRes.data);
    console.log('SUCCESS! File is served correctly by the backend.');

  } catch (err) {
    console.error('Test failed:', err.response ? err.response.data : err.message);
  } finally {
    if (fs.existsSync(dummyFile)) {
      fs.unlinkSync(dummyFile);
    }
  }
}

test();
