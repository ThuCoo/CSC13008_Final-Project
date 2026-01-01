import db from "../db/index.js";
import { orders } from "../db/schema.js";
import listingService from "./listing.js";

const service = {
  create: async function ({ listingId, buyerId, sellerId, finalPrice, shippingAddress = null, status = "paid" }) {
    const result = await db.insert(orders).values({ listingId, buyerId, sellerId, finalPrice, status, shippingAddress }).returning();
    // mark listing sold and close
    await listingService.update({ listingId, status: "sold", endsAt: new Date() });
    return result[0];
  },
};

export default service;