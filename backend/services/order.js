import { eq, desc } from "drizzle-orm";
import db from "../db/index.js";
import { orders, listings, users } from "../db/schema.js";
import listingService from "./listing.js";
import { maskName } from "../utils/mask.js";

const service = {
  create: async function ({ listingId, bidderId, sellerId, finalPrice, shippingAddress = null, status = "paid" }) {
    const result = await db.insert(orders).values({ listingId, bidderId, sellerId, finalPrice, status, shippingAddress }).returning();
    // mark listing sold and close
    await listingService.update({ listingId, status: "sold", endsAt: new Date() });
    return result[0];
  },

  listBySeller: async function (sellerId) {
    const result = await db
        .select({
            id: orders.id,
            finalPrice: orders.finalPrice,
            status: orders.status,
            createdAt: orders.createdAt,
            listingId: listings.listingId,
            listingTitle: listings.title,
            bidderName: users.name,
            bidderId: orders.bidderId
        })
        .from(orders)
        .leftJoin(listings, eq(listings.listingId, orders.listingId))
        .leftJoin(users, eq(users.userId, orders.bidderId))
        .where(eq(orders.sellerId, sellerId))
        .orderBy(desc(orders.createdAt));
    
    // Mask bidder name
    return result.map(o => ({
        ...o,
        bidderName: maskName(o.bidderName || "Unknown")
    }));
  },

  updateStatus: async function (orderId, data) {
      const result = await db
          .update(orders)
          .set(data)
          .where(eq(orders.id, orderId))
          .returning();
      return result[0];
  }
};

export default service;