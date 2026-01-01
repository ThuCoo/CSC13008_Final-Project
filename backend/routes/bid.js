import { Router } from "express";
import validateQuery from "../middlewares/validateQuery.js";
import bidController from "../controllers/bid.js";
import { createBidSchema, listBidsQuery } from "../schemas/bid.js";
import { idParams } from "../schemas/common.js";

const route = new Router();
route.get("/", validateQuery(listBidsQuery, "query"), bidController.listAll);
route.get("/:id", validateQuery(idParams, "params"), bidController.listOne);
route.post("/", validateQuery(createBidSchema, "body"), bidController.create);
route.delete("/:id", validateQuery(idParams, "params"), bidController.remove);

export default route;
