import bidService from "../services/bid.js";
import ratingService from "../services/rating.js";

const controller = {
  listAll: function (req, res, next) {
    const listingId = req.query.listingId ? Number(req.query.listingId) : null;
    const bidderId = req.query.bidderId ? Number(req.query.bidderId) : null;
    bidService
      .listAll(listingId, bidderId)
      .then((rows) => res.json(rows))
      .catch(next);
  },

  listOne: function (req, res, next) {
    const id = Number(req.params.id);
    bidService
      .listOne(id)
      .then((item) => {
        if (!item) return res.status(404).json({ message: "Bid not found" });
        res.json(item);
      })
      .catch(next);
  },

  create: async function (req, res, next) {
    try {
      const { bidderId } = req.body;
      // configurable minimum positive ratio
      const minRatio = parseFloat(process.env.RATING_MIN_POSITIVE_RATIO) || 0.8;
      const summary = await ratingService.summaryForUserByRole(
        bidderId,
        "buyer"
      );
      if (summary.total > 0) {
        const ratio = summary.up / summary.total;
        if (ratio < minRatio) {
          return res.status(403).json({
            message: `Bid denied: bidder rating too low (required >= ${minRatio})`,
          });
        }
      }

      const row = await bidService.create(req.body);
      res.status(201).json(row);
    } catch (err) {
      next(err);
    }
  },

  remove: function (req, res, next) {
    const id = Number(req.params.id);
    bidService
      .remove(id)
      .then(() => res.json({}))
      .catch(next);
  },
};

export default controller;
