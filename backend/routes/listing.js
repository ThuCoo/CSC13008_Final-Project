import { Router } from "express";
import validateQuery from "../middlewares/validateQuery.js";
import listingController from "../controllers/listing.js";
import { paginationSchema, searchSchema, idParams } from "../schemas/common.js";

const route = new Router();

route.get(
  "/",
  validateQuery(paginationSchema, "query"),
  listingController.listAll
);
route.get(
  "/search",
  validateQuery(searchSchema, "query"),
  listingController.search
);
route.get("/:id", validateQuery(idParams, "params"), listingController.listOne);

export default route;
