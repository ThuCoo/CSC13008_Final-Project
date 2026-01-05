import { Router } from "express";
import validateQuery from "../middlewares/validateQuery.js";
import optionalJwtAuth from "../middlewares/optionalJwtAuth.js";
import listingController from "../controllers/listing.js";
import { paginationSchema, searchSchema, idParams } from "../schemas/common.js";

import {
  createListingSchema,
  updateListingSchema,
} from "../schemas/listing.js";

const route = new Router();

// Apply optional JWT auth to all routes to identify the requester
route.use(optionalJwtAuth);

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
route.post(
  "/",
  validateQuery(createListingSchema, "body"),
  listingController.create
);
route.put(
  "/:id",
  validateQuery(idParams, "params"),
  validateQuery(updateListingSchema, "body"),
  listingController.update
);
route.delete(
  "/:id",
  validateQuery(idParams, "params"),
  listingController.remove
);

export default route;
