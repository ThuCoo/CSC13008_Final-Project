import { eq } from "drizzle-orm";
import db from "../db/index.js";
import { pgTable, serial, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { users, listings } from "../db/schema.js";

export const autoBids = pgTable("auto_bids", {
  autoBidId: serial("auto_bid_id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => listings.listingId),
  userId: integer("user_id").notNull().references(() => users.userId),
  maxBidAmount: decimal("max_bid_amount").notNull(),
  currentBidAmount: decimal("current_bid_amount").default("0"),
  incrementAmount: decimal("increment_amount").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

const service = {
  listAll: async function (userId = null, listingId = null) {
    let query = db.select().from(autoBids);
    if (userId) {
      query = query.where(eq(autoBids.userId, userId));
    }
    if (listingId) {
       query = query.where(eq(autoBids.listingId, listingId));
    }
    return await query;
  },
  create: async function (data) {
    const result = await db.insert(autoBids).values(data).returning();
    return result[0];
  },
  update: async function (id, data) {
      const result = await db.update(autoBids).set(data).where(eq(autoBids.autoBidId, id)).returning();
      return result[0];
  },
  remove: async function (id) {
    await db.delete(autoBids).where(eq(autoBids.autoBidId, id));
  },
  getByListingAndUser: async function (listingId, userId) {
      const result = await db.select().from(autoBids)
        .where(eq(autoBids.listingId, listingId))
        .where(eq(autoBids.userId, userId));
        return result[0];
  }
};

export default service;
