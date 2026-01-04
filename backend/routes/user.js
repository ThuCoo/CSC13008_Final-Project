import { Router } from "express";
import validateQuery from "../middlewares/validateQuery.js";
import userController from "../controllers/user.js";
import {
  createUserSchema,
  updateUserSchema,
  listUsersQuery,
  loginSchema,
} from "../schemas/user.js";
import { idParams } from "../schemas/common.js";
import jwtAuth from "../middlewares/jwtAuth.js";

const route = new Router();
route.get("/", validateQuery(listUsersQuery, "query"), userController.listAll);
route.get("/me", jwtAuth, userController.me);
route.get("/:id", validateQuery(idParams, "params"), userController.listOne);
route.post("/login", validateQuery(loginSchema, "body"), userController.login);
route.post("/", validateQuery(createUserSchema, "body"), userController.create);
route.put(
  "/:id",
  validateQuery(idParams, "params"),
  validateQuery(updateUserSchema, "body"),
  userController.update
);
route.delete("/:id", validateQuery(idParams, "params"), userController.remove);
route.post("/:id/reset-password", jwtAuth, userController.adminResetPassword);

export default route;
