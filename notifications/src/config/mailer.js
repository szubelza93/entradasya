const nodemailer = require('nodemailer');

const mailerConfig = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true'
};

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  mailerConfig.auth = {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  };
}

const transporter = nodemailer.createTransport(mailerConfig);

module.exports = transporter;