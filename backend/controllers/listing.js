import listingService from "../services/listing.js";

const controller = {
  listAll: function (req, res, next) {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    listingService
      .listPage({ page, limit })
      .then((result) => res.json(result))
      .catch(next);
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
};

export default controller;
