import { Router } from "express";
import validateQuery from "../middlewares/validateQuery.js";
import sellerRequestController from "../controllers/sellerRequest.js";
import {
  createSellerRequestSchema,
  updateSellerRequestSchema,
  listSellerRequestsQuery,
} from "../schemas/sellerRequest.js";
import { idParams } from "../schemas/common.js";

const route = new Router();
route.get(
  "/",
  validateQuery(listSellerRequestsQuery, "query"),
  sellerRequestController.listAll
);
route.get(
  "/:id",
  validateQuery(idParams, "params"),
  sellerRequestController.listOne
);
route.post(
  "/",
  validateQuery(createSellerRequestSchema, "body"),
  sellerRequestController.create
);
route.put(
  "/:id",
  validateQuery(idParams, "params"),
  validateQuery(updateSellerRequestSchema, "body"),
  sellerRequestController.update
);
route.delete(
  "/:id",
  validateQuery(idParams, "params"),
  sellerRequestController.remove
);

export default route;
