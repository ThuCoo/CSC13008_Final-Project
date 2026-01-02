import autoBidService from "../services/autoBid.js";

const controller = {
  listAll: function (req, res, next) {
    const userId = req.query.userId ? Number(req.query.userId) : null;
    const listingId = req.query.listingId ? Number(req.query.listingId) : null;
    autoBidService
      .listAll(userId, listingId)
      .then((rows) => res.json(rows))
      .catch(next);
  },

  create: async function (req, res, next) {
    try {
        const { listingId, userId } = req.body;
        const existing = await autoBidService.getByListingAndUser(listingId, userId);
        if (existing) {
             return res.status(400).json({ message: "Auto bid already exists for this listing" });
        }
        
        const row = await autoBidService.create(req.body);
        res.status(201).json(row);
    } catch(err) { next(err) }
  },
  
  update: function (req, res, next) {
      const id = Number(req.params.id);
      autoBidService.update(id, req.body)
        .then(row => res.json(row))
        .catch(next);
  },

  remove: function (req, res, next) {
    const id = Number(req.params.id);
    autoBidService
      .remove(id)
      .then(() => res.json({}))
      .catch(next);
  },
};

export default controller;
