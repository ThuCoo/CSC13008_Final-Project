import userService from "../services/user.js";

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

  create: function (req, res, next) {
    userService
      .create(req.body)
      .then((row) => res.status(201).json(row))
      .catch(next);
  },

  update: async function (req, res, next) {
    try {
      const id = Number(req.params.id);
      const existing = await userService.listOne(id);
      if (!existing) return res.status(404).json({ message: "User not found" });

      const updates = { ...existing, ...req.body, userId: id };
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
