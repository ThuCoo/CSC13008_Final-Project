import listingService from "../services/listing.js";

const controller = {
  listAll: function (req, res, next) {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    listingService
      .listAll({ page, limit })
      .then((result) => {
        console.log(`Listings API: Returning ${result.data?.length || 0} listings`);
        res.json(result);
      })
      .catch((err) => {
        console.error("Error in listAll controller:", err);
        next(err);
      });
  },

  listOne: function (req, res, next) {
    const id = Number(req.params.id);
    listingService
      .listOne(id)
      .then((item) => {
        if (!item)
          return res.status(404).json({ message: "Listing not found" });
        res.json(item);
      })
      .catch(next);
  },

  search: function (req, res, next) {
    const q = req.query.q;
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    listingService
      .searchListings({ query: q, page, limit })
      .then((result) => res.json(result))
      .catch(next);
  },

  create: function (req, res, next) {
    listingService
      .create(req.body)
      .then((row) => res.status(201).json(row))
      .catch(next);
  },

  update: async function (req, res, next) {
    try {
      const id = Number(req.params.id);
      const existing = await listingService.listOne(id);
      if (!existing)
        return res.status(404).json({ message: "Listing not found" });

      const updates = { ...existing, ...req.body, listingId: id };
      const updated = await listingService.update(updates);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  remove: function (req, res, next) {
    const id = Number(req.params.id);
    listingService
      .remove(id)
      .then(() => res.json({}))
      .catch(next);
  },
};

export default controller;
