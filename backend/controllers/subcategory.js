import subcategoryService from "../services/subcategory.js";

const controller = {
  listAll: function (req, res, next) {
    const categoryId = req.query.categoryId
      ? Number(req.query.categoryId)
      : null;
    subcategoryService
      .listAll(categoryId)
      .then((rows) => res.json(rows))
      .catch(next);
  },

  listOne: function (req, res, next) {
    const id = Number(req.params.id);
    subcategoryService
      .listOne(id)
      .then((rows) => {
        const item = Array.isArray(rows) ? rows[0] : rows;
        if (!item)
          return res.status(404).json({ message: "Subcategory Not found" });
        res.json(item);
      })
      .catch(next);
  },
};

export default controller;
