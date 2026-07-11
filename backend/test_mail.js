const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: 'mounish197@gmail.com',
    pass: 'aqayqzowliyppupy',
  },
});

console.log('Sending test email...');
transporter.sendMail({
  from: 'mounish197@gmail.com',
  to: 'mounish197@gmail.com',
  subject: 'Test Email from ApexHire',
  text: 'This is a test email to verify SMTP configuration.'
}).then(info => {
  console.log('SUCCESS!', info);
}).catch(err => {
  console.error('FAILED!', err);
});
