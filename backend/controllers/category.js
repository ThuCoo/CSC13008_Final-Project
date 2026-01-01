import categoryService from "../services/category.js";

const controller = {
  listCategory: function (req, res, next) {
    categoryService
      .listAll()
      .then((categories) => res.json(categories))
      .catch(next);
  },

  getCategory: function (req, res, next) {
    const id = parseInt(req.params.id);
    categoryService
      .listById(id)
      .then((category) => {
        if (!category)
          return res.status(404).json({ message: "Category not found" });
        res.json(category);
      })
      .catch(next);
  },

  createCategory: async function (req, res, next) {
    categoryService
      .create(req.body)
      .then((category) => res.status(201).json(category))
      .catch(next);
  },

  updateCategory: async function (req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const existingCategory = await categoryService.listById(id);
      if (!existingCategory)
        return res.status(404).json({ message: "Category not found" });

      const updates = { ...existingCategory, ...req.body, id };
      const updatedCategory = await categoryService.update(updates);
      res.json(updatedCategory);
    } catch (error) {
      next(error);
    }
  },

  removeCategory: async function (req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const category = await categoryService.listById(id);
      if (!category)
        return res.status(404).json({ message: "Category not found" });

      await categoryService.removeById(id);
      res.json({});
    } catch (error) {
      if (error && error.code === "CATEGORY_HAS_LISTINGS")
        return res
          .status(400)
          .json({ message: "Cannot delete category with listings" });
      next(error);
    }
  },
};

export default controller;
