const nodemailer = require('nodemailer');
const config = require('../config/env');

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!config.email.user || !config.email.pass) {
      console.warn(`[Mock Email] To: ${to} | Subject: ${subject}`);
      console.warn(`[Mock Email] Content: \n${html}`);
      return { messageId: 'mock-id-1234' };
    }

    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });

    transporter.verify((error, success) => {
      if (error) {
        console.error("SMTP ERROR:", error);
      } else {
        console.log("SMTP READY");
      }
    });

    const mailOptions = {
      from: `"OIT_STACK" <${config.email.user}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Email sending failed: ${error.message}`);
    throw new Error(`Email could not be sent: ${error.message}`);
  }
};

module.exports = sendEmail;

