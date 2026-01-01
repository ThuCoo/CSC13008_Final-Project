import { eq, desc, sql } from "drizzle-orm";
import db from "../db/index.js";
import { listings, categories, subcategories } from "../db/schema.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const defaultSelection = {
  listingId: listings.listingId,
  sellerId: listings.sellerId,
  title: listings.title,
  description: listings.description,
  categoryId: listings.categoryId,
  subcategoryId: listings.subcategoryId,
  startingPrice: listings.startingPrice,
  currentBid: listings.currentBid,
  stepPrice: listings.stepPrice,
  buyNowPrice: listings.buyNowPrice,
  status: listings.status,
  createdAt: listings.createdAt,
  endsAt: listings.endsAt,
  itemCondition: listings.itemCondition,
  shippingCost: listings.shippingCost,
  returnPolicy: listings.returnPolicy,
  images: listings.images,
  autoExtendDates: listings.autoExtendDates,
  rejectedBidders: listings.rejectedBidders,
};

const service = {
  listAll: async function ({ page = 1, limit = DEFAULT_LIMIT } = {}) {
    limit = Math.min(Math.max(1, +limit), MAX_LIMIT);
    page = Math.max(1, +page);
    const offset = (page - 1) * limit;

    const result = await db
      .select(defaultSelection)
      .from(listings)
      .orderBy(desc(listings.createdAt), desc(listings.listingId))
      .limit(limit)
      .offset(offset);

    return { page, limit, data: result };
  },

  listOne: async function (listingId = null, title = null) {
    let query = db.select(defaultSelection).from(listings).limit(1);

    if (listingId != null) {
      query = query.where(eq(listings.listingId, listingId));
    }
    if (title != null) {
      query = query.where(eq(listings.title, title));
    }
    const result = await query;
    return result[0] || null;
  },

  // Full-text search across title, category name and subcategory name
  searchListings: async function ({
    query,
    page = 1,
    limit = DEFAULT_LIMIT,
  } = {}) {
    if (!query || String(query).trim().length === 0)
      return { page, limit: 0, data: [] };

    limit = Math.min(Math.max(1, +limit), MAX_LIMIT);
    page = Math.max(1, +page);
    const offset = (page - 1) * limit;

    const result = await db
      .select({
        ...defaultSelection,
        categoryName: categories.name,
        subcategoryName: subcategories.name,
      })
      .from(listings)
      .leftJoin(categories, eq(categories.categoryId, listings.categoryId))
      .leftJoin(
        subcategories,
        eq(subcategories.subcategoryId, listings.subcategoryId)
      )
      .where(
        sql`to_tsvector('english', ${listings.title} || ' ' || coalesce(${categories.name}, '') || ' ' || coalesce(${subcategories.name}, '')) @@ websearch_to_tsquery('english', ${query})`
      )
      .orderBy(desc(listings.createdAt), desc(listings.listingId))
      .limit(limit)
      .offset(offset);

    return { page, limit, data: result };
  },
  create: async function (listing) {
    const result = await db.insert(listings).values(listing).returning();
    return result[0];
  },

  update: async function (listing) {
    await db
      .update(listings)
      .set(listing)
      .where(eq(listings.listingId, listing.listingId));
    return this.listOne(listing.listingId);
  },

  // update current bid amount for a listing
  updateCurrentBid: async function (listingId, amount) {
    await db
      .update(listings)
      .set({ currentBid: amount })
      .where(eq(listings.listingId, listingId));
    return this.listOne(listingId);
  },

  remove: async function (listingId) {
    await db.delete(listings).where(eq(listings.listingId, listingId));
  },
};

export default service;
