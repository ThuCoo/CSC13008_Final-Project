import { eq, and } from "drizzle-orm";
import db from "../db/index.js";
import { otps } from "../db/schema.js";

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

const service = {
  createOtp: async function (userId, purpose, ttlMinutes = 15) {
    const code = generateCode();
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    const row = await db
      .insert(otps)
      .values({ userId, code, purpose, expiresAt })
      .returning();
    return row[0];
  },
  getValidOtp: async function (userId, code, purpose) {
    const now = new Date();
    const result = await db
      .select()
      .from(otps)
      .where(
        and(
          eq(otps.userId, userId),
          eq(otps.code, code),
          eq(otps.purpose, purpose)
        )
      );
    const otp = result[0] || null;
    if (!otp) return null;
    if (new Date(otp.expiresAt) < now) return null;
    return otp;
  },
  consumeOtp: async function (otpId) {
    await db.delete(otps).where(eq(otps.otpId, otpId));
  },
  purgeExpired: async function () {
    const now = new Date();
    await db.delete(otps).where(otps.expiresAt.lt(now));
  },
};

export default service;
