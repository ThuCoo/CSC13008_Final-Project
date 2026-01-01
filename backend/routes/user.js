import { Router } from "express";
import validateQuery from "../middlewares/validateQuery.js";
import userController from "../controllers/user.js";
import {
  createUserSchema,
  updateUserSchema,
  listUsersQuery,
} from "../schemas/user.js";
import { idParams } from "../schemas/common.js";

const route = new Router();
route.get("/", validateQuery(listUsersQuery, "query"), userController.listAll);
route.get("/:id", validateQuery(idParams, "params"), userController.listOne);
route.post("/", validateQuery(createUserSchema, "body"), userController.create);
route.put(
  "/:id",
  validateQuery(idParams, "params"),
  validateQuery(updateUserSchema, "body"),
  userController.update
);
route.delete("/:id", validateQuery(idParams, "params"), userController.remove);

export default route;
