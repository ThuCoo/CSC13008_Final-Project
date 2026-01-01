import userService from "../services/user.js";
import otpService from "../services/otp.js";
import emailLib from "../lib/email.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 10;

const controller = {
  login: async function (req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await userService.getByEmailWithHash(email);
      if (!user || !user.passwordHash)
        return res.status(401).json({ message: "Invalid credentials" });

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ message: "Invalid credentials" });

      if (!user.isVerified)
        return res.status(403).json({ message: "Email not verified" });

      const payload = { userId: user.userId, role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      });

      const safe = { ...user };
      delete safe.passwordHash;
      res.json({ token, user: safe });
    } catch (err) {
      next(err);
    }
  },

  register: async function (req, res, next) {
    try {
      const { email, password, name, address, birthday } = req.body;
      // check existing
      const existing = await userService.listOne(null, email);
      if (existing)
        return res.status(400).json({ message: "Email already taken" });

      const body = { email, name, address, birthday };
      if (password) {
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        body.passwordHash = hash;
      }
      body.isVerified = false;
      const user = await userService.create(body);

      // create and send OTP
      const otp = await otpService.createOtp(user.userId, "verify");
      await emailLib.sendOtpEmail(user.email, otp.code, "verify");

      const safe = { ...user };
      delete safe.passwordHash;
      res.status(201).json({
        message: "User created. Verification code sent to email.",
        user: safe,
      });
    } catch (err) {
      next(err);
    }
  },

  verify: async function (req, res, next) {
    try {
      const { email, code } = req.body;
      const user = await userService.listOne(null, email);
      if (!user) return res.status(404).json({ message: "User not found" });
      const otp = await otpService.getValidOtp(user.userId, code, "verify");
      if (!otp)
        return res.status(400).json({ message: "Invalid or expired code" });

      // mark verified
      await userService.update({
        ...user,
        isVerified: true,
        verifiedAt: new Date(),
        userId: user.userId,
      });
      await otpService.consumeOtp(otp.otpId);
      res.json({ message: "Email verified" });
    } catch (err) {
      next(err);
    }
  },

  forgot: async function (req, res, next) {
    try {
      const { email } = req.body;
      const user = await userService.listOne(null, email);
      if (!user) return res.status(404).json({ message: "User not found" });
      const otp = await otpService.createOtp(user.userId, "reset");
      await emailLib.sendOtpEmail(user.email, otp.code, "reset");
      res.json({ message: "Password reset code sent to email" });
    } catch (err) {
      next(err);
    }
  },

  reset: async function (req, res, next) {
    try {
      const { email, code, newPassword } = req.body;
      const user = await userService.listOne(null, email);
      if (!user) return res.status(404).json({ message: "User not found" });
      const otp = await otpService.getValidOtp(user.userId, code, "reset");
      if (!otp)
        return res.status(400).json({ message: "Invalid or expired code" });

      const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await userService.update({
        ...user,
        passwordHash: hash,
        userId: user.userId,
      });
      await otpService.consumeOtp(otp.otpId);
      res.json({ message: "Password updated" });
    } catch (err) {
      next(err);
    }
  },
};

export default controller;
