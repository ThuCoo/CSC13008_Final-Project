import { and, asc, desc, eq } from "drizzle-orm";
import db from "../db/index.js";
import { bids } from "../db/schema.js";

const defaultSelection = {
  bidId: bids.bidId,
  listingId: bids.listingId,
  bidderId: bids.bidderId,
  amount: bids.amount,
  createdAt: bids.createdAt,
};

const service = {
  listAll: async function (listingId = null, bidderId = null) {
    let query = db.select(defaultSelection).from(bids);
    if (listingId != null) {
      query = query.where(eq(bids.listingId, listingId));
    }
    if (bidderId != null) {
      query = query.where(eq(bids.bidderId, bidderId));
    }
    query = query.orderBy(
      desc(bids.amount),
      asc(bids.createdAt),
      asc(bids.bidId)
    );

    const result = await query;
    return result;
  },
  listOne: async function (bidId = null) {
    let query = db.select(defaultSelection).from(bids);
    if (bidId != null) {
      query = query.where(eq(bids.bidId, bidId));
    }
    const result = await query;
    return result[0] || null;
  },
  create: async function (bid) {
    const result = await db.insert(bids).values(bid).returning();
    return result[0];
  },
  remove: async function (bidId) {
    await db.delete(bids).where(eq(bids.bidId, bidId));
  },

  removeForListingBidder: async function (listingId, bidderId) {
    await db
      .delete(bids)
      .where(and(eq(bids.listingId, listingId), eq(bids.bidderId, bidderId)));
  },
};

export default service;
