import sgMail from "@sendgrid/mail";

// Use SendGrid API key
if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY not set - email sending will fail");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

async function sendMail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || "no-reply@example.com";
  const msg = { to, from, subject, text, html };
  return sgMail.send(msg);
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
