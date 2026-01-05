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

export async function sendAuctionEndedEmail(
  to,
  listingTitle,
  status,
  finalPrice
) {
  const subject =
    status === "won"
      ? `You won the auction: ${listingTitle}`
      : `Auction ended: ${listingTitle}`;
  const text =
    status === "won"
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

export async function sendSellerApprovalEmail(to, name) {
  const subject = `Your seller request has been approved!`;
  const text = `Congratulations ${name}! Your request to become a seller has been approved. You can now start listing items for auction. This approval is valid for 7 days.`;
  const html = `<p>${text}</p>`;
  return sendMail({ to, subject, text, html });
}

export async function sendSellerRejectionEmail(to, name, reason) {
  const subject = `Your seller request has been rejected`;
  const text = `Hello ${name}, unfortunately your request to become a seller has been rejected. Reason: ${reason}. You may submit a new request if you wish to try again.`;
  const html = `<p>${text}</p>`;
  return sendMail({ to, subject, text, html });
}

export async function sendUserBannedEmail(to, name) {
  const subject = `Your account has been suspended`;
  const text = `Hello ${name}, your account has been suspended by an administrator. If you believe this is an error, please contact support.`;
  const html = `<p>${text}</p>`;
  return sendMail({ to, subject, text, html });
}

export async function sendUserDeletedEmail(to, name) {
  const subject = `Your account has been deleted`;
  const text = `Hello ${name}, your account has been permanently deleted by an administrator. All your data has been removed from our system.`;
  const html = `<p>${text}</p>`;
  return sendMail({ to, subject, text, html });
}

export async function sendBidderRejectedEmail(to, name, listingTitle) {
  const subject = `You have been removed from auction: ${listingTitle}`;
  const text = `Hello ${name}, the seller has removed you from the auction "${listingTitle}". You will no longer be able to bid on this item.`;
  const html = `<p>${text}</p>`;
  return sendMail({ to, subject, text, html });
}

export default {
  sendOtpEmail,
  sendBidSuccessEmail,
  sendOutbidEmail,
  sendAuctionEndedEmail,
  sendQuestionEmail,
  sendPasswordResetAdminEmail,
  sendSellerApprovalEmail,
  sendSellerRejectionEmail,
  sendUserBannedEmail,
  sendUserDeletedEmail,
  sendBidderRejectedEmail,
};
