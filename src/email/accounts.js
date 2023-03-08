import nodemailer from 'nodemailer';

let transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true,
  host: 'smpt.gmail.com',
  secure: false, // use TLS
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendWelcomeEmail = async (email, name) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_ADDRESS,
      to: email,
      subject: 'Welcome',
      text: `Welcome to the application ${name}`,
    });
  } catch (error) {
    console.log(error);
  }
};
