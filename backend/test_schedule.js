const db = require('./config/db');
const { scheduleInterview } = require('./controllers/applicationController');

async function test() {
  const req = {
    params: { id: '7' },
    body: {
      interviewDate: '2026-07-15',
      interviewTime: '4pm',
      interviewLink: 'https://meet.google.com/abc-defg-hij'
    },
    user: {
      id: 2, // TechCorp employer ID (owner of job_id 1)
      role: 'employer'
    }
  };

  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log('Response Status:', this.statusCode);
      console.log('Response Data:', data);
    }
  };

  try {
    await scheduleInterview(req, res);
  } catch (err) {
    console.error('CRITICAL UNCAUGHT ERROR:', err);
  } finally {
    process.exit(0);
  }
}

test();
