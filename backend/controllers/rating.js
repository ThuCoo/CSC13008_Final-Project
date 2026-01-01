import ratingService from "../services/rating.js";

const controller = {
  createRating: async function (req, res, next) {
    try {
      const payload = { ...req.body };
      // basic check: rater and target should not be same
      if (payload.raterUserId === payload.targetUserId) {
        return res.status(400).json({ message: "Cannot rate yourself" });
      }

      const created = await ratingService.create(payload);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },

  listForUser: async function (req, res, next) {
    try {
      const userId = Number(req.params.id);
      const rows = await ratingService.listForUser(userId);
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  summaryForUser: async function (req, res, next) {
    try {
      const userId = Number(req.params.id);
      const summary = await ratingService.summaryForUser(userId);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  },
};

export default controller;
