import bidService from "../services/bid.js";

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

  create: function (req, res, next) {
    bidService
      .create(req.body)
      .then((row) => res.status(201).json(row))
      .catch(next);
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
