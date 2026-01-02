import { Router } from "express";
import autoBidController from "../controllers/autoBid.js";
import validateQuery from "../middlewares/validateQuery.js";
import { createAutoBidSchema, updateAutoBidSchema } from "../schemas/autoBid.js";
import { idParams } from "../schemas/common.js";

const route = new Router();

route.get("/", autoBidController.listAll);
route.post(
  "/", 
  validateQuery(createAutoBidSchema, "body"), 
  autoBidController.create
);
route.put(
  "/:id", 
  validateQuery(idParams, "params"),
  validateQuery(updateAutoBidSchema, "body"),
  autoBidController.update
);
route.delete(
  "/:id", 
  validateQuery(idParams, "params"),
  autoBidController.remove
);

export default route;
