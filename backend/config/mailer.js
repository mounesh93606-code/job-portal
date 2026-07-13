const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sentEmailsDir = path.join(__dirname, '../sent_emails');
if (!fs.existsSync(sentEmailsDir)) {
  fs.mkdirSync(sentEmailsDir, { recursive: true });
}

// Check if Resend API key is configured
const resendApiKey = process.env.RESEND_API_KEY;

let resendClient = null;

if (resendApiKey) {
  const { Resend } = require('resend');
  resendClient = new Resend(resendApiKey);
  console.log('Mailer: Resend API client initialized.');
} else {
  console.log('Mailer: RESEND_API_KEY not set. Falling back to local file logging in backend/sent_emails/.');
}

/**
 * Sends an email using Resend API (works over HTTPS, not blocked by Railway)
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Text body
 * @param {string} options.html - HTML body
 * @param {Array} [options.attachments] - Attachments list (e.g. { filename, path })
 */
const sendMail = async (options) => {
  const fromEmail = 'ApexHire <onboarding@resend.dev>';

  // Email override: redirect all emails to owner's inbox (used when domain not verified)
  const mailOverride = process.env.MAIL_OVERRIDE;
  const actualTo = mailOverride || options.to;
  const overrideNote = mailOverride && mailOverride !== options.to
    ? `<p style="background:#fff3cd;border:1px solid #ffc107;border-radius:4px;padding:8px;font-size:0.8em;color:#856404;"><strong>[DEV REDIRECT]</strong> Originally addressed to: <code>${options.to}</code></p>`
    : '';

  if (resendClient) {
    try {
      // Convert file-path attachments to base64 for Resend
      let resendAttachments = [];
      if (options.attachments && options.attachments.length > 0) {
        resendAttachments = options.attachments
          .filter(att => att.path && fs.existsSync(att.path))
          .map(att => ({
            filename: att.filename,
            content: fs.readFileSync(att.path)
          }));
      }

      const { data, error } = await resendClient.emails.send({
        from: fromEmail,
        to: [actualTo],
        subject: options.subject,
        text: options.text,
        html: overrideNote + (options.html || ''),
        attachments: resendAttachments.length > 0 ? resendAttachments : undefined
      });

      if (error) {
        console.error('Mailer: Resend API error:', error);
      } else {
        console.log(`Mailer: Email sent successfully to ${actualTo}${mailOverride ? ` (override; original: ${options.to})` : ''}. ID: ${data.id}`);
        return data;
      }
    } catch (error) {
      console.error('Mailer: Error sending email via Resend:', error.message);
    }
  }

  // Fallback: save email to local file
  const timestamp = Date.now();
  const safeEmail = actualTo.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `email_${safeEmail}_${timestamp}.json`;
  const filepath = path.join(sentEmailsDir, filename);

  const emailLog = {
    timestamp: new Date().toISOString(),
    from: fromEmail,
    to: actualTo,
    originalTo: options.to,
    subject: options.subject,
    text: options.text,
    html: overrideNote + (options.html || ''),
    attachments: options.attachments ? options.attachments.map(att => ({
      filename: att.filename,
      path: att.path,
      exists: att.path ? fs.existsSync(att.path) : false
    })) : []
  };

  fs.writeFileSync(filepath, JSON.stringify(emailLog, null, 2), 'utf8');
  console.log(`Mailer: [MOCK EMAIL] Saved email details to ${filepath}`);
  console.log(`Mailer: [MOCK EMAIL] Subject: "${options.subject}" sent to ${actualTo}`);
  return { mock: true, filepath };
};

module.exports = {
  sendMail
};
