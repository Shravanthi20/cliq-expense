const nodemailer = require('nodemailer');
const twilio = require('twilio');

function createEmailTransport() {
  if (!process.env.SMTP_HOST) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });
}

function createSmsClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

async function sendEmail({ to, subject, text, html }) {
  const transport = createEmailTransport();
  if (!transport) {
    console.log('[Notification] Email transport not configured. Simulating send to', to);
    return { simulated: true };
  }
  const from = process.env.FROM_EMAIL || 'no-reply@example.com';
  await transport.sendMail({ from, to, subject, text, html });
  return { success: true };
}

async function sendSms({ to, text }) {
  const client = createSmsClient();
  if (!client) {
    console.log('[Notification] SMS client not configured. Simulating send to', to);
    return { simulated: true };
  }
  const from = process.env.TWILIO_FROM;
  if (!from) throw new Error('TWILIO_FROM not set');
  await client.messages.create({ from, to, body: text });
  return { success: true };
}

async function sendNotification({ channel, email, phone, subject, text, html }) {
  if (channel === 'email') return sendEmail({ to: email, subject, text, html });
  if (channel === 'sms') return sendSms({ to: phone, text });
  return { skipped: true };
}

module.exports = { sendEmail, sendSms, sendNotification };


