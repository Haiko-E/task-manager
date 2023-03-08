import nodemailer from 'nodemailer';

let transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true,
  host: 'smpt.gmail.com',
  secure: true, // use TLS
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendWelcomeEmail = (email, name) => {
  transporter.sendMail({
    from: process.env.EMAIL_ADDRESS,
    to: email,
    subject: 'Welcome',
    text: `Welcome to the application ${name}`,
  });
};
