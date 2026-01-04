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

export async function sendBidSuccessEmail(to, listingTitle, amount) {
  const subject = `Your bid on "${listingTitle}" was successful!`;
  const text = `Congratulations! Your bid of ${amount.toLocaleString()}₫ for "${listingTitle}" has been placed successfully.`;
  const html = `<p>${text}</p>`;
  return sendMail({ to, subject, text, html });
}

export async function sendOutbidEmail(to, listingTitle, newCurrentBid) {
  const subject = `You've been outbid on "${listingTitle}"`;
  const text = `Someone just placed a higher bid on "${listingTitle}". The current bid is now ${newCurrentBid.toLocaleString()}₫. You might want to increase your bid!`;
  const html = `<p>${text}</p>`;
  return sendMail({ to, subject, text, html });
}

export async function sendAuctionEndedEmail(to, listingTitle, status, finalPrice) {
  const subject = status === 'won' ? `You won the auction: ${listingTitle}` : `Auction ended: ${listingTitle}`;
  const text = status === 'won' 
    ? `Congratulations! You won the auction for "${listingTitle}" with a final price of ${finalPrice.toLocaleString()}₫. Please complete the payment soon.`
    : `The auction for "${listingTitle}" has ended. Final price: ${finalPrice.toLocaleString()}₫.`;
  const html = `<p>${text}</p>`;
  return sendMail({ to, subject, text, html });
}

export async function sendQuestionEmail(to, listingTitle, questionText) {
  const subject = `New question on your listing: ${listingTitle}`;
  const text = `Someone asked a question on "${listingTitle}":\n\n"${questionText}"\n\nPlease log in to answer it.`;
  const html = `<p>${text}</p>`;
  return sendMail({ to, subject, text, html });
}

export async function sendPasswordResetAdminEmail(to, newPassword) {
  const subject = `Your password has been reset by an administrator`;
  const text = `An administrator has reset your password. Your new temporary password is: ${newPassword}\n\nPlease change it after logging in.`;
  const html = `<p>${text}</p>`;
  return sendMail({ to, subject, text, html });
}

export default { 
  sendOtpEmail, 
  sendBidSuccessEmail, 
  sendOutbidEmail, 
  sendAuctionEndedEmail,
  sendQuestionEmail,
  sendPasswordResetAdminEmail
};
