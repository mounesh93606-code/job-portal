const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sentEmailsDir = path.join(__dirname, '../sent_emails');
if (!fs.existsSync(sentEmailsDir)) {
  fs.mkdirSync(sentEmailsDir, { recursive: true });
}

/**
 * Sends an email via Brevo API (primary - sends to ANY recipient, free, HTTPS - not blocked by Railway)
 * Falls back to Resend if BREVO_API_KEY not set.
 * Falls back to local file log if neither is configured.
 *
 * @param {Object} options
 * @param {string} options.to        - Recipient email
 * @param {string} options.subject   - Email subject
 * @param {string} options.text      - Plain-text body
 * @param {string} options.html      - HTML body
 * @param {Array}  [options.attachments] - [{ filename, path }]
 */
const sendMail = async (options) => {
  const brevoKey    = process.env.BREVO_API_KEY;
  const resendKey   = process.env.RESEND_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.MAIL_FROM || 'onboarding@resend.dev';
  const senderName  = 'ApexHire';

  // ── 1. BREVO (primary) ──────────────────────────────────────────────────────
  if (brevoKey) {
    try {
      const body = {
        sender:      { name: senderName, email: senderEmail },
        to:          [{ email: options.to }],
        subject:     options.subject,
        textContent: options.text  || '',
        htmlContent: options.html  || '',
      };

      // Attachments (base64)
      if (options.attachments && options.attachments.length > 0) {
        body.attachment = options.attachments
          .filter(att => att.path && fs.existsSync(att.path))
          .map(att => ({
            name:    att.filename,
            content: fs.readFileSync(att.path).toString('base64'),
          }));
      }

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method:  'POST',
        headers: {
          'accept':       'application/json',
          'api-key':      brevoKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Mailer: Brevo API error:', JSON.stringify(data));
        // fall through to Resend / file fallback
      } else {
        console.log(`Mailer: [Brevo] Email sent to ${options.to}. MessageId: ${data.messageId}`);
        return data;
      }
    } catch (err) {
      console.error('Mailer: Brevo fetch error:', err.message);
    }
  }

  // ── 2. RESEND (secondary fallback) ─────────────────────────────────────────
  if (resendKey) {
    try {
      const { Resend } = require('resend');
      const resend = new Resend(resendKey);

      // MAIL_OVERRIDE: redirect to owner inbox when Resend domain not verified
      const mailOverride = process.env.MAIL_OVERRIDE;
      const actualTo     = mailOverride || options.to;
      const overrideNote = mailOverride && mailOverride !== options.to
        ? `<p style="background:#fff3cd;border:1px solid #ffc107;border-radius:4px;padding:8px;font-size:0.8em;color:#856404;"><strong>[REDIRECT]</strong> Originally addressed to: <code>${options.to}</code></p>`
        : '';

      let resendAttachments = [];
      if (options.attachments && options.attachments.length > 0) {
        resendAttachments = options.attachments
          .filter(att => att.path && fs.existsSync(att.path))
          .map(att => ({ filename: att.filename, content: fs.readFileSync(att.path) }));
      }

      const { data, error } = await resend.emails.send({
        from:        `${senderName} <onboarding@resend.dev>`,
        to:          [actualTo],
        subject:     options.subject,
        text:        options.text,
        html:        overrideNote + (options.html || ''),
        attachments: resendAttachments.length > 0 ? resendAttachments : undefined,
      });

      if (error) {
        console.error('Mailer: Resend API error:', error);
      } else {
        console.log(`Mailer: [Resend] Email sent to ${actualTo}${mailOverride ? ` (redirect; original: ${options.to})` : ''}. ID: ${data.id}`);
        return data;
      }
    } catch (err) {
      console.error('Mailer: Resend error:', err.message);
    }
  }

  // ── 3. LOCAL FILE FALLBACK ──────────────────────────────────────────────────
  const timestamp = Date.now();
  const safeEmail = options.to.replace(/[^a-zA-Z0-9]/g, '_');
  const filename  = `email_${safeEmail}_${timestamp}.json`;
  const filepath  = path.join(sentEmailsDir, filename);

  fs.writeFileSync(filepath, JSON.stringify({
    timestamp: new Date().toISOString(),
    to:        options.to,
    subject:   options.subject,
    text:      options.text,
    html:      options.html,
    attachments: (options.attachments || []).map(att => ({
      filename: att.filename,
      path:     att.path,
      exists:   att.path ? fs.existsSync(att.path) : false,
    })),
  }, null, 2), 'utf8');

  console.log(`Mailer: [FILE FALLBACK] Saved to ${filepath}`);
  console.log(`Mailer: [FILE FALLBACK] Subject: "${options.subject}" → ${options.to}`);
  return { mock: true, filepath };
};

module.exports = { sendMail };
