import { eq } from "drizzle-orm";
import db from "../db/index.js";
import { watchlists } from "../db/schema.js";

const defaultSelection = {
  userId: watchlists.userId,
  listingId: watchlists.listingId,
  addedAt: watchlists.addedAt,
};

const service = {
  listAll: async function (userId = null) {
    let query = db.select(defaultSelection).from(watchlists);
    if (userId != null) {
      query = query.where(eq(watchlists.userId, userId));
    }
    const result = await query;
    return result;
  },
  create: async function (watchlist) {
    const result = await db.insert(watchlists).values(watchlist).returning();
    return result[0];
  },
  remove: async function (userId, listingId) {
    await db
      .delete(watchlists)
      .where(eq(watchlists.userId, userId))
      .where(eq(watchlists.listingId, listingId));
  },
};

export default service;
