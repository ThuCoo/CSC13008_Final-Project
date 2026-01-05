import userService from "../services/user.js";
import emailLib from "../lib/email.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 10;

const controller = {
  listAll: function (req, res, next) {
    userService
      .listAll()
      .then((rows) => res.json(rows))
      .catch(next);
  },

  listOne: function (req, res, next) {
    const id = Number(req.params.id);
    userService
      .listOne(id)
      .then((item) => {
        if (!item) return res.status(404).json({ message: "User not found" });
        res.json(item);
      })
      .catch(next);
  },

  me: async function (req, res, next) {
    try {
      if (!req.user || !req.user.userId)
        return res.status(401).json({ message: "Unauthorized" });
      const user = await userService.listOne(req.user.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      delete user.passwordHash;
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  login: async function (req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await userService.getByEmailWithHash(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

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

  create: async function (req, res, next) {
    try {
      const body = { ...req.body };
      if (body.password) {
        const hash = await bcrypt.hash(body.password, SALT_ROUNDS);
        body.passwordHash = hash;
        delete body.password;
      }

      const row = await userService.create(body);
      // do not return passwordHash to client
      const safe = { ...row };
      delete safe.passwordHash;
      res.status(201).json(safe);
    } catch (err) {
      next(err);
    }
  },

  update: async function (req, res, next) {
    try {
      const id = Number(req.params.id);
      const existing = await userService.listOne(id);
      if (!existing) return res.status(404).json({ message: "User not found" });

      const updatesBody = { ...req.body };
      if (updatesBody.password) {
        const hash = await bcrypt.hash(updatesBody.password, SALT_ROUNDS);
        updatesBody.passwordHash = hash;
        delete updatesBody.password;
      }

      const updates = { ...existing, ...updatesBody, userId: id };
      const updated = await userService.update(updates);

      // Send email notification if user is being banned
      if (updatesBody.status === "banned" && existing.status !== "banned") {
        try {
          await emailLib.sendUserBannedEmail(existing.email, existing.name);
        } catch (emailErr) {
          console.error("Failed to send ban email:", emailErr);
        }
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  remove: async function (req, res, next) {
    try {
      const id = Number(req.params.id);
      const user = await userService.listOne(id);
      if (user) {
        try {
          await emailLib.sendUserDeletedEmail(user.email, user.name);
        } catch (emailErr) {
          console.error("Failed to send deletion email:", emailErr);
        }
      }
      await userService.remove(id);
      res.json({});
    } catch (err) {
      next(err);
    }
  },

  adminResetPassword: async function (req, res, next) {
    try {
      if (req.user?.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Forbidden: Admin access only" });
      }

      const id = Number(req.params.id);
      const user = await userService.listOne(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const newPassword = Math.random().toString(36).slice(-8);
      const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

      await userService.update({ ...user, passwordHash: hash, userId: id });

      const emailLib = (await import("../lib/email.js")).default;
      await emailLib.sendPasswordResetAdminEmail(user.email, newPassword);

      res.json({ message: "Password reset and email sent", newPassword });
    } catch (err) {
      next(err);
    }
  },
};

export default controller;
