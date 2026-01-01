import watchlistService from "../services/watchlist.js";

const controller = {
  listAll: function (req, res, next) {
    const userId = req.query.userId ? Number(req.query.userId) : null;
    watchlistService
      .listAll(userId)
      .then((rows) => res.json(rows))
      .catch(next);
  },

  create: function (req, res, next) {
    watchlistService
      .create(req.body)
      .then((row) => res.status(201).json(row))
      .catch(next);
  },

  remove: function (req, res, next) {
    const userId = Number(req.params.userId);
    const listingId = Number(req.params.listingId);
    watchlistService
      .remove(userId, listingId)
      .then(() => res.json({}))
      .catch(next);
  },
};

export default controller;
