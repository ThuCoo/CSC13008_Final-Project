import { ZodError } from "zod";

export default function (error, req, res, next) {
  console.error(error);
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      issues: error.issues,
    });
  } else {
    res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
}
