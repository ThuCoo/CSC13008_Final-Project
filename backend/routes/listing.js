import { Router } from "express";
import validateQuery from "../middlewares/validateQuery.js";
import optionalJwtAuth from "../middlewares/optionalJwtAuth.js";
import jwtAuth from "../middlewares/jwtAuth.js";
import listingController from "../controllers/listing.js";
import { paginationSchema, searchSchema, idParams } from "../schemas/common.js";

import {
  createListingSchema,
  updateListingSchema,
} from "../schemas/listing.js";

const route = new Router();

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
route.get("/top5-closing-soon", listingController.getTop5ClosingSoon);
route.get("/top5-most-bids", listingController.getTop5MostBids);
route.get("/top5-highest-price", listingController.getTop5HighestPrice);
route.get("/participating", jwtAuth, listingController.listParticipating);
route.get("/won", jwtAuth, listingController.listWon);
route.get("/:id", validateQuery(idParams, "params"), listingController.listOne);
route.post(
  "/",
  jwtAuth,
  validateQuery(createListingSchema, "body"),
  listingController.create
);
route.put(
  "/:id",
  jwtAuth,
  validateQuery(idParams, "params"),
  validateQuery(updateListingSchema, "body"),
  listingController.update
);
route.delete(
  "/:id",
  jwtAuth,
  validateQuery(idParams, "params"),
  listingController.remove
);

export default route;
