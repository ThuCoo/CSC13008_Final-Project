import { Router } from "express";
import validateQuery from "../middlewares/validateQuery.js";
import watchlistController from "../controllers/watchlist.js";
import {
  createWatchlistSchema,
  listWatchlistQuery,
  watchlistParams,
} from "../schemas/watchlist.js";

const route = new Router();
route.get(
  "/",
  validateQuery(listWatchlistQuery, "query"),
  watchlistController.listAll
);
route.post(
  "/",
  validateQuery(createWatchlistSchema, "body"),
  watchlistController.create
);
route.delete(
  "/:userId/:listingId",
  validateQuery(watchlistParams, "params"),
  watchlistController.remove
);

export default route;
