import { Router } from "express";
import orderController from "../controllers/order.js";
import jwtAuth from "../middlewares/jwtAuth.js";

const route = new Router();

route.get("/seller", jwtAuth, orderController.listForSeller);
route.get("/bidder", jwtAuth, orderController.listForBidder);
route.put("/:id/status", jwtAuth, orderController.updateStatus);

export default route;
