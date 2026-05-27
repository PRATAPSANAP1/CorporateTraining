const nodemailer = require('nodemailer');
const config = require('../config/env');

/**
 * Send an email using Nodemailer.
 *
 * Creates a reusable SMTP transporter from environment config and sends
 * an HTML email to the specified recipient.
 *
 * @param {Object} options - Email options.
 * @param {string} options.to - Recipient email address.
 * @param {string} options.subject - Email subject line.
 * @param {string} options.html - HTML body content of the email.
 * @returns {Promise<Object>} Nodemailer send result with messageId, etc.
 * @throws {Error} If email sending fails (logged and re-thrown).
 *
 * @example
 * await sendEmail({
 *   to: 'student@oitstack.com',
 *   subject: 'Password Reset',
 *   html: '<p>Click <a href="...">here</a> to reset your password.</p>',
 * });
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });

    const mailOptions = {
      from: `"OITSTACK" <${config.email.user}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Email sending failed: ${error.message}`);
    throw new Error(`Email could not be sent: ${error.message}`);
  }
};

module.exports = sendEmail;
