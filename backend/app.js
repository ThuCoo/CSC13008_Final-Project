import express from "express";
import morgan from "morgan";
import cors from "cors";
import authMiddleware from "./middlewares/auth.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(authMiddleware);

app.use(notFound);
app.use(errorHandler);

export default app;
