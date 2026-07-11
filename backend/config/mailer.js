const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sentEmailsDir = path.join(__dirname, '../sent_emails');
if (!fs.existsSync(sentEmailsDir)) {
  fs.mkdirSync(sentEmailsDir, { recursive: true });
}

// Check if SMTP is configured
const isSmtpConfigured = (
  (process.env.EMAIL_USER && process.env.EMAIL_PASS) ||
  (process.env.SMTP_USER && process.env.SMTP_PASS)
);

let transporter = null;

if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
    },
  });
  console.log('Mailer: SMTP transporter initialized.');
} else {
  console.log('Mailer: SMTP credentials not set. Falling back to local file logging in backend/sent_emails/.');
}

/**
 * Sends an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Text body
 * @param {string} options.html - HTML body
 * @param {Array} [options.attachments] - Attachments list (e.g. { filename, path })
 */
const sendMail = async (options) => {
  const fromEmail = process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@apexhire.com';
  
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"ApexHire Recruitment" <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      });
      console.log(`Mailer: Email sent successfully to ${options.to}. MessageID: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Mailer: Error sending email via SMTP:', error.message);
      // Fallback to local log even if SMTP fails
    }
  }

  // Fallback or Local Mock logger
  const timestamp = Date.now();
  const safeEmail = options.to.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `email_${safeEmail}_${timestamp}.json`;
  const filepath = path.join(sentEmailsDir, filename);

  const emailLog = {
    timestamp: new Date().toISOString(),
    from: `"ApexHire Recruitment" <${fromEmail}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments ? options.attachments.map(att => ({
      filename: att.filename,
      path: att.path,
      exists: fs.existsSync(att.path)
    })) : []
  };

  fs.writeFileSync(filepath, JSON.stringify(emailLog, null, 2), 'utf8');
  console.log(`Mailer: [MOCK EMAIL] Saved email details to ${filepath}`);
  console.log(`Mailer: [MOCK EMAIL] Subject: "${options.subject}" sent to ${options.to}`);
  return { mock: true, filepath };
};

module.exports = {
  sendMail
};
