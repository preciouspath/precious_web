import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

export const sendMail = async (to: string, subject: string, html: string) => {
  await transporter.sendMail({
    from: process.env.MAIL_USERNAME,
    to,
    subject,
    html,
  });
  console.log("✅ Email sent to:", to);
};
