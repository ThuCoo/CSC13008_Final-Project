import { Router } from "express";
import validateQuery from "../middlewares/validateQuery.js";
import authController from "../controllers/auth.js";
import {
  registerSchema,
  verifySchema,
  forgotSchema,
  resetSchema,
} from "../schemas/auth.js";
import recaptcha from "../middlewares/recaptcha.js";
import { loginSchema } from "../schemas/auth.js";

const route = new Router();
route.post(
  "/register",
  recaptcha,
  validateQuery(registerSchema, "body"),
  authController.register
);
route.post("/login", validateQuery(loginSchema, "body"), authController.login);
route.post(
  "/verify",
  validateQuery(verifySchema, "body"),
  authController.verify
);
route.post(
  "/forgot",
  validateQuery(forgotSchema, "body"),
  authController.forgot
);
route.post("/reset", validateQuery(resetSchema, "body"), authController.reset);
route.post("/resend", authController.resendOtp);

export default route;
