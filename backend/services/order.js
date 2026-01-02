import db from "../db/index.js";
import { orders } from "../db/schema.js";
import listingService from "./listing.js";

const service = {
  create: async function ({ listingId, bidderId, sellerId, finalPrice, shippingAddress = null, status = "paid" }) {
    const result = await db.insert(orders).values({ listingId, bidderId, sellerId, finalPrice, status, shippingAddress }).returning();
    // mark listing sold and close
    await listingService.update({ listingId, status: "sold", endsAt: new Date() });
    return result[0];
  },
};

export default service;