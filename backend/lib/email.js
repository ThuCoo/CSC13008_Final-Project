import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendMail({ to, subject, text, html }) {
  const from =
    process.env.EMAIL_FROM ||
    `no-reply@${process.env.SMTP_HOST || "example.com"}`;
  return transporter.sendMail({ from, to, subject, text, html });
}

export async function sendOtpEmail(to, code, purpose) {
  const subject =
    purpose === "verify"
      ? "Your verification code"
      : "Your password reset code";
  const text = `Your code is: ${code}. It expires in 15 minutes.`;
  const html = `<p>${text}</p>`;
  return sendMail({ to, subject, text, html });
}

export default { sendOtpEmail };
