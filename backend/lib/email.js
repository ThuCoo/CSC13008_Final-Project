import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter.verify((error, success) => {
    if (error) {
      console.error("SMTP configuration error:", error.message);
    }
  });
} else {
  console.warn("SMTP credentials not set - email sending will fail");
}

async function sendMail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || "no-reply@example.com";
  const mailOptions = { from, to, subject, text, html };
  return transporter.sendMail(mailOptions);
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
