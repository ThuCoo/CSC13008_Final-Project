import { Router } from "express";
import validateQuery from "../middlewares/validateQuery.js";
import subcategoryController from "../controllers/subcategory.js";
import { listSubcategoriesQuery } from "../schemas/subcategory.js";
import { idParams } from "../schemas/common.js";

const route = new Router();
route.get(
  "/",
  validateQuery(listSubcategoriesQuery, "query"),
  subcategoryController.listAll
);
route.get(
  "/:id",
  validateQuery(idParams, "params"),
  subcategoryController.listOne
);

export default route;
