import express from "express";
import morgan from "morgan";
import cors from "cors";
import authMiddleware from "./middlewares/auth.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";

import categoryRoute from "./routes/category.js";
import listingRoute from "./routes/listing.js";
import subcategoryRoute from "./routes/subcategory.js";
import bidRoute from "./routes/bid.js";
import watchlistRoute from "./routes/watchlist.js";
import sellerRequestRoute from "./routes/sellerRequest.js";
import questionRoute from "./routes/question.js";
import userRoute from "./routes/user.js";
import ratingRoute from "./routes/rating.js";
import authRoute from "./routes/auth.js";
import autoBidRoute from "./routes/autoBid.js";
import orderRoute from "./routes/orders.js";

const app = express();

const defaultDevOrigins = ["http://localhost:8080", "http://127.0.0.1:8080"];

function normalizeOrigin(value) {
  const s = String(value || "").trim();
  if (!s) return "";
  try {
    const url = new URL(s);
    return url.origin;
  } catch {
    return s.replace(/\/+$/, "");
  }
}

const configuredFrontendUrlsRaw = String(process.env.FRONTEND_URL || "").trim();
const configuredFrontendUrls = configuredFrontendUrlsRaw
  ? configuredFrontendUrlsRaw
      .split(",")
      .map((s) => normalizeOrigin(s))
      .filter(Boolean)
  : [];

const allowVercelAppOrigins =
  String(process.env.ALLOW_VERCEL_APP_ORIGINS || "")
    .trim()
    .toLowerCase() === "true";

const allowedOrigins = new Set(
  [...defaultDevOrigins.map(normalizeOrigin), ...configuredFrontendUrls].filter(
    Boolean
  )
);

function isAllowedOrigin(origin) {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  if (allowedOrigins.has(normalized)) return true;
  if (!allowVercelAppOrigins) return false;
  try {
    const url = new URL(normalized);
    return url.protocol === "https:" && url.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      return callback(null, isAllowedOrigin(origin));
    },
    allowedHeaders: ["Content-Type", "Authorization", "apikey"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    optionsSuccessStatus: 204,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(authMiddleware);

app.use("/categories", categoryRoute);
app.use("/listings", listingRoute);
app.use("/subcategories", subcategoryRoute);
app.use("/bids", bidRoute);
app.use("/watchlists", watchlistRoute);

// Auto Bid System
app.use("/auto-bids", autoBidRoute);

app.use("/seller-requests", sellerRequestRoute);
app.use("/questions", questionRoute);
app.use("/users", userRoute);
app.use("/ratings", ratingRoute);
app.use("/auth", authRoute);
app.use("/orders", orderRoute);

app.use(notFound);
app.use(errorHandler);

export default app;
