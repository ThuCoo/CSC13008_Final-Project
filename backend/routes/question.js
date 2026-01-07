import { Router } from "express";
import validateQuery from "../middlewares/validateQuery.js";
import questionController from "../controllers/question.js";
import jwtAuth from "../middlewares/jwtAuth.js";
import {
  createQuestionSchema,
  updateQuestionSchema,
  listQuestionsQuery,
} from "../schemas/question.js";
import { idParams } from "../schemas/common.js";

const route = new Router();
route.get(
  "/",
  validateQuery(listQuestionsQuery, "query"),
  questionController.listAll
);
route.get(
  "/:id",
  validateQuery(idParams, "params"),
  questionController.listOne
);
route.post(
  "/",
  jwtAuth,
  validateQuery(createQuestionSchema, "body"),
  questionController.create
);
route.put(
  "/:id",
  jwtAuth,
  validateQuery(idParams, "params"),
  validateQuery(updateQuestionSchema, "body"),
  questionController.answer
);
route.delete(
  "/:id",
  jwtAuth,
  validateQuery(idParams, "params"),
  questionController.remove
);

export default route;
