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

const app = express();

app.use(cors({
  origin: "http://localhost:8080",
  credentials: true
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(authMiddleware);

app.use("/categories", categoryRoute);
app.use("/listings", listingRoute);
app.use("/subcategories", subcategoryRoute);
app.use("/bids", bidRoute);
app.use("/watchlists", watchlistRoute); 
app.use("/auto-bids", autoBidRoute);
app.use("/seller-requests", sellerRequestRoute);
app.use("/questions", questionRoute);
app.use("/users", userRoute);
app.use("/ratings", ratingRoute);
app.use("/auth", authRoute);

app.use(notFound);
app.use(errorHandler);

export default app;
