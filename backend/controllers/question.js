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

  create: function (req, res, next) {
    questionService
      .create(req.body)
      .then((row) => res.status(201).json(row))
      .catch(next);
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
