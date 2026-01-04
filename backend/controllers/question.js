import questionService from "../services/question.js";

const controller = {
  listAll: function (req, res, next) {
    const listingId = req.query.listingId ? Number(req.query.listingId) : null;
    const userId = req.query.userId ? Number(req.query.userId) : null;
    questionService
      .listAll(listingId, userId)
      .then((rows) => res.json(rows))
      .catch(next);
  },

  listOne: function (req, res, next) {
    const id = Number(req.params.id);
    questionService
      .listOne(id)
      .then((item) => {
        if (!item)
          return res.status(404).json({ message: "Question not found" });
        res.json(item);
      })
      .catch(next);
  },

  create: async function (req, res, next) {
    try {
        const { listingId, questionText } = req.body;
        const row = await questionService.create(req.body);
        
        // Notify seller
        const listingService = (await import("../services/listing.js")).default;
        const userService = (await import("../services/user.js")).default;
        const emailLib = (await import("../lib/email.js")).default;
        
        const listing = await listingService.listOne(listingId);
        if (listing) {
            const seller = await userService.listOne(listing.sellerId);
            if (seller) {
                emailLib.sendQuestionEmail(seller.email, listing.title, questionText).catch(console.error);
            }
        }
        
        res.status(201).json(row);
    } catch(err) {
        next(err);
    }
  },

  answer: async function (req, res, next) {
    try {
      const id = Number(req.params.id);
      const existing = await questionService.listOne(id);
      if (!existing)
        return res.status(404).json({ message: "Question not found" });

      const updates = { ...existing, ...req.body, questionId: id };
      const updated = await questionService.update(updates);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  remove: function (req, res, next) {
    const id = Number(req.params.id);
    questionService
      .remove(id)
      .then(() => res.json({}))
      .catch(next);
  },
};

export default controller;
