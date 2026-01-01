import sellerRequestService from "../services/sellerRequest.js";

const controller = {
  listAll: function (req, res, next) {
    const userId = req.query.userId ? Number(req.query.userId) : null;
    const reviewedBy = req.query.reviewedBy
      ? Number(req.query.reviewedBy)
      : null;
    sellerRequestService
      .listAll(userId, reviewedBy)
      .then((rows) => res.json(rows))
      .catch(next);
  },

  listOne: function (req, res, next) {
    const id = Number(req.params.id);
    sellerRequestService
      .listOne(id)
      .then((item) => {
        if (!item)
          return res.status(404).json({ message: "Seller request not found" });
        res.json(item);
      })
      .catch(next);
  },

  create: function (req, res, next) {
    sellerRequestService
      .create(req.body)
      .then((row) => res.status(201).json(row))
      .catch(next);
  },

  update: async function (req, res, next) {
    try {
      const id = Number(req.params.id);
      const existing = await sellerRequestService.listOne(id);
      if (!existing)
        return res.status(404).json({ message: "Seller request not found" });

      const updates = { ...existing, ...req.body, requestId: id };
      const updated = await sellerRequestService.update(updates);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  remove: function (req, res, next) {
    const id = Number(req.params.id);
    sellerRequestService
      .remove(id)
      .then(() => res.json({}))
      .catch(next);
  },
};

export default controller;
