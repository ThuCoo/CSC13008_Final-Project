import ratingService from "../services/rating.js";

const controller = {
  createRating: async function (req, res, next) {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const payload = {
        ...req.body,
        raterUserId: req.user.userId,
      };

      // basic check: rater and target should not be same
      if (Number(payload.raterUserId) === Number(payload.targetUserId)) {
        return res.status(400).json({ message: "Cannot rate yourself" });
      }

      const allowed = await ratingService.canRateTransaction({
        targetUserId: payload.targetUserId,
        raterUserId: payload.raterUserId,
        role: payload.role,
      });
      if (!allowed) {
        return res.status(403).json({
          message:
            "You can only rate after a successful delivered/completed transaction.",
        });
      }

      const { row, created } = await ratingService.upsert(payload);
      res.status(created ? 201 : 200).json(row);
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
