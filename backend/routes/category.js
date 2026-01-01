import { Router } from "express";
import validateQuery from "../middlewares/validateQuery.js";
import categoryController from "../controllers/category.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../schemas/category.js";
import { idParams, paginationSchema } from "../schemas/common.js";

const route = new Router();
route.get(
  "/",
  validateQuery(paginationSchema, "query"),
  categoryController.listCategory
);
route.get(
  "/:id",
  validateQuery(idParams, "params"),
  categoryController.getCategory
);
route.post(
  "/",
  validateQuery(createCategorySchema, "body"),
  categoryController.createCategory
);
route.put(
  "/:id",
  validateQuery(idParams, "params"),
  validateQuery(updateCategorySchema, "body"),
  categoryController.updateCategory
);
route.delete(
  "/:id",
  validateQuery(idParams, "params"),
  categoryController.removeCategory
);

export default route;
