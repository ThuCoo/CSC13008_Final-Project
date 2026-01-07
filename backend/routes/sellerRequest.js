import { Router } from "express";
import validateQuery from "../middlewares/validateQuery.js";
import jwtAuth from "../middlewares/jwtAuth.js";
import adminOnly from "../middlewares/adminOnly.js";
import selfOrAdmin from "../middlewares/selfOrAdmin.js";
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
  jwtAuth,
  validateQuery(listSellerRequestsQuery, "query"),
  sellerRequestController.listAll
);
route.get(
  "/:id",
  jwtAuth,
  validateQuery(idParams, "params"),
  sellerRequestController.listOne
);
route.post(
  "/",
  jwtAuth,
  selfOrAdmin((req) => req.body.userId),
  validateQuery(createSellerRequestSchema, "body"),
  sellerRequestController.create
);
route.put(
  "/:id",
  jwtAuth,
  adminOnly,
  validateQuery(idParams, "params"),
  validateQuery(updateSellerRequestSchema, "body"),
  sellerRequestController.update
);
route.delete(
  "/:id",
  jwtAuth,
  adminOnly,
  validateQuery(idParams, "params"),
  sellerRequestController.remove
);

export default route;
