import { Router } from "express";
import validateQuery from "../middlewares/validateQuery.js";
import ratingController from "../controllers/rating.js";
import { createRatingSchema, idParams } from "../schemas/rating.js";

const route = new Router();
route.post(
  "/",
  validateQuery(createRatingSchema, "body"),
  ratingController.createRating
);
route.get(
  "/:id",
  validateQuery(idParams, "params"),
  ratingController.listForUser
);
route.get(
  "/summary/:id",
  validateQuery(idParams, "params"),
  ratingController.summaryForUser
);

export default route;
