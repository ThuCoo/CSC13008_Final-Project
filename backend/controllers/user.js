import userService from "../services/user.js";
import bcrypt from "bcrypt";

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

  login: async function (req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await userService.getByEmailWithHash(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ message: "Invalid credentials" });

      const safe = { ...user };
      delete safe.passwordHash;
      res.json(safe);
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
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  remove: function (req, res, next) {
    const id = Number(req.params.id);
    userService
      .remove(id)
      .then(() => res.json({}))
      .catch(next);
  },
};

export default controller;
