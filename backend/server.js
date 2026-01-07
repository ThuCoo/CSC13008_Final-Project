import app from "./app.js";
import dotenv from "dotenv";

// Load ENV from .env
dotenv.config();

// Bind to port
app.listen(process.env.PORT, () => {
  console.log(`Server is listening on port ${process.env.PORT}`);
});

// Periodic auction end sweep
const sweepEnabled = process.env.AUCTION_SWEEP_ENABLED !== "false";
const sweepIntervalSeconds = Number(
  process.env.AUCTION_SWEEP_INTERVAL_SECONDS || "60"
);

if (sweepEnabled) {
  const intervalMs = Math.max(10, sweepIntervalSeconds) * 1000;
  setInterval(async () => {
    try {
      const listingService = (await import("./services/listing.js")).default;
      await listingService.sweepEndedAuctions();
    } catch (e) {
      console.error("Auction sweep failed", e);
    }
  }, intervalMs);
}
