const { Resend } = require('resend');

const resend = new Resend('re_ZvrZyxs8_Q1VzCwk1APgjcjgDuFdrXwkT');

async function test() {
  console.log('Sending test email via Resend...');
  const { data, error } = await resend.emails.send({
    from: 'ApexHire <onboarding@resend.dev>',
    to: ['mounish197@gmail.com'],
    subject: 'Test Email from ApexHire Job Portal',
    html: '<h1>It works!</h1><p>Your ApexHire email system is now live.</p>'
  });

  if (error) {
    console.error('FAILED:', error);
  } else {
    console.log('SUCCESS!', data);
  }
}

test();
