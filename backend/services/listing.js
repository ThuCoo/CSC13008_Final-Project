import { eq, desc, sql } from "drizzle-orm";
import db from "../db/index.js";
import { listings, categories, subcategories, users, bids, questions } from "../db/schema.js";
import bidService from "./bid.js";
import questionService from "./question.js";

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

// Helper function to enrich listing with related data
async function enrichListing(listing) {
  if (!listing) return null;

  try {
    const seller = await db.select({ name: users.name }).from(users).where(eq(users.userId, listing.sellerId)).limit(1);
    const sellerName = seller[0]?.name || 'Unknown';
    const category = await db.select({ name: categories.name }).from(categories).where(eq(categories.categoryId, listing.categoryId)).limit(1);
    const categoryName = category[0]?.name || 'Unknown';
    let subcategoryName = null;
    if (listing.subcategoryId) {
      const subcategory = await db.select({ name: subcategories.name }).from(subcategories).where(eq(subcategories.subcategoryId, listing.subcategoryId)).limit(1);
      subcategoryName = subcategory[0]?.name || null;
    }
    let enrichedBids = [];
    try {
      const bidsData = await bidService.listAll(listing.listingId, null);
      enrichedBids = await Promise.all(bidsData.map(async (bid) => {
        try {
          const bidder = await db.select({ name: users.name }).from(users).where(eq(users.userId, bid.bidderId)).limit(1);
          return {
            id: String(bid.bidId),
            bidderId: String(bid.bidderId),
            bidderName: bidder[0]?.name || 'Unknown',
            amount: Number(bid.amount),
            timestamp: bid.createdAt ? new Date(bid.createdAt).getTime() : Date.now(),
          };
        } catch (err) {
          console.error(`Error enriching bid ${bid.bidId}:`, err);
          return null;
        }
      }));
      enrichedBids = enrichedBids.filter(b => b !== null);
    } catch (err) {
      console.error(`Error fetching bids for listing ${listing.listingId}:`, err);
    }
    let enrichedQuestions = [];
    try {
      const questionsData = await questionService.listAll(listing.listingId, null);
      enrichedQuestions = await Promise.all(questionsData.map(async (q) => {
        try {
          const user = await db.select({ name: users.name }).from(users).where(eq(users.userId, q.userId)).limit(1);
          return {
            id: String(q.questionId),
            userId: String(q.userId),
            userName: user[0]?.name || 'Unknown',
            question: q.questionText,
            answer: q.answerText || undefined,
            timestamp: q.createdAt ? new Date(q.createdAt).getTime() : Date.now(),
          };
        } catch (err) {
          console.error(`Error enriching question ${q.questionId}:`, err);
          return null;
        }
      }));
      enrichedQuestions = enrichedQuestions.filter(q => q !== null);
    } catch (err) {
      console.error(`Error fetching questions for listing ${listing.listingId}:`, err);
    }

    return {
      id: String(listing.listingId),
      sellerId: String(listing.sellerId),
      sellerName,
      title: listing.title,
      description: listing.description,
      category: categoryName,
      subCategory: subcategoryName,
      categories: [categoryName],
      startingPrice: Number(listing.startingPrice),
      currentBid: Number(listing.currentBid),
      stepPrice: Number(listing.stepPrice),
      buyNowPrice: listing.buyNowPrice ? Number(listing.buyNowPrice) : undefined,
      status: listing.status,
      createdAt: listing.createdAt ? new Date(listing.createdAt).getTime() : Date.now(),
      endsAt: listing.endsAt ? new Date(listing.endsAt).getTime() : Date.now(),
      condition: listing.itemCondition,
      shippingCost: Number(listing.shippingCost),
      returns: listing.returnPolicy,
      images: Array.isArray(listing.images) ? listing.images : [],
      autoExtendedDates: Array.isArray(listing.autoExtendDates) 
        ? listing.autoExtendDates.map(d => new Date(d).getTime())
        : [],
      rejectedBidders: Array.isArray(listing.rejectedBidders) 
        ? listing.rejectedBidders.map(id => String(id))
        : [],
      bids: enrichedBids.sort((a, b) => b.amount - a.amount), // Sort by amount descending
      questions: enrichedQuestions.sort((a, b) => a.timestamp - b.timestamp), // Sort by time ascending
    };
  } catch (error) {
    console.error(`Error enriching listing ${listing.listingId}:`, error);
    // Return a basic listing even if enrichment fails
    return {
      id: String(listing.listingId),
      sellerId: String(listing.sellerId),
      sellerName: 'Unknown',
      title: listing.title,
      description: listing.description,
      category: 'Unknown',
      subCategory: null,
      categories: ['Unknown'],
      startingPrice: Number(listing.startingPrice),
      currentBid: Number(listing.currentBid),
      stepPrice: Number(listing.stepPrice),
      buyNowPrice: listing.buyNowPrice ? Number(listing.buyNowPrice) : undefined,
      status: listing.status,
      createdAt: listing.createdAt ? new Date(listing.createdAt).getTime() : Date.now(),
      endsAt: listing.endsAt ? new Date(listing.endsAt).getTime() : Date.now(),
      condition: listing.itemCondition,
      shippingCost: Number(listing.shippingCost),
      returns: listing.returnPolicy,
      images: Array.isArray(listing.images) ? listing.images : [],
      autoExtendedDates: [],
      rejectedBidders: [],
      bids: [],
      questions: [],
    };
  }
}

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

    const enrichedData = await Promise.all(result.map(listing => enrichListing(listing)));
    const validListings = enrichedData.filter(l => l !== null);

    return { page, limit, data: validListings };
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
    const listing = result[0] || null;
    if (!listing) return null;
    return await enrichListing(listing);
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

    const enrichedData = await Promise.all(result.map(listing => enrichListing(listing)));
    return { page, limit, data: enrichedData };
  },
  create: async function (listing) {
    const result = await db.insert(listings).values(listing).returning();
    const newListing = result[0];
    return await enrichListing(newListing);
  },

  update: async function (listing) {
    await db
      .update(listings)
      .set(listing)
      .where(eq(listings.listingId, listing.listingId));
    const updated = await db.select(defaultSelection).from(listings).where(eq(listings.listingId, listing.listingId)).limit(1);
    return await enrichListing(updated[0]);
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
