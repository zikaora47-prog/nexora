import nodemailer from 'nodemailer';

// Create transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your Gmail address
    pass: process.env.EMAIL_PASS, // your Gmail app password
  },
});

export const sendEmail = async (options) => {
  const mailOptions = {
    from: `"Nexora Support" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent: %s', info.messageId);
  return info;
};