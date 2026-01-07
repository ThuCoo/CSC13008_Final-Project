import { eq, desc, asc, and, sql } from "drizzle-orm";
import db from "../db/index.js";
import {
  listings,
  categories,
  subcategories,
  users,
  bids,
  questions,
} from "../db/schema.js";
import bidService from "./bid.js";
import questionService from "./question.js";
import { maskName } from "../utils/mask.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function buildPrefixTsQuery(input) {
  const tokens = String(input || "")
    .toLowerCase()
    .trim()
    .match(/[a-z0-9]+/g);

  if (!tokens || tokens.length === 0) return null;

  return tokens.map((t) => `${t}:*`).join(" & ");
}

function buildListingOrderBy(sort) {
  const key = String(sort || "").trim();
  switch (key) {
    case "ending_desc":
    case "ending_soon":
      return [
        asc(sql`CASE WHEN ${listings.endsAt} < NOW() THEN 1 ELSE 0 END`),
        asc(listings.endsAt),
        desc(listings.listingId),
      ];
    case "price_asc":
    case "price_low":
      return [asc(listings.currentBid), desc(listings.listingId)];
    case "price_high":
      return [desc(listings.currentBid), desc(listings.listingId)];
    case "created_desc":
    default:
      return [desc(listings.createdAt), desc(listings.listingId)];
  }
}

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
  autoExtendEnabled: listings.autoExtendEnabled,
  autoExtendDates: listings.autoExtendDates,
  allowUnratedBidders: listings.allowUnratedBidders,
  rejectedBidders: listings.rejectedBidders,
};

function mapListingRowToSummary(row, requesterId = null, requesterRole = null) {
  const isSeller = requesterId && String(row.sellerId) === String(requesterId);
  const isAdmin = requesterRole === "admin";
  const shouldUnmask = isSeller || isAdmin;

  const categoryName = row.categoryName || "Unknown";
  const subcategoryName = row.subcategoryName || null;
  const topBidderNameRaw = row.topBidderName || null;

  return {
    id: String(row.listingId),
    sellerId: String(row.sellerId),
    sellerName: row.sellerName || "Unknown",
    title: row.title,
    description: row.description,
    categoryId: Number(row.categoryId),
    subcategoryId:
      row.subcategoryId != null ? Number(row.subcategoryId) : undefined,
    category: categoryName,
    subCategory: subcategoryName,
    categories: [categoryName],
    startingPrice: Number(row.startingPrice),
    currentBid: Number(row.currentBid),
    stepPrice: Number(row.stepPrice),
    buyNowPrice: row.buyNowPrice ? Number(row.buyNowPrice) : undefined,
    status: row.status,
    createdAt: row.createdAt ? new Date(row.createdAt).getTime() : Date.now(),
    endsAt: row.endsAt ? new Date(row.endsAt).getTime() : Date.now(),
    condition: row.itemCondition,
    shippingCost: Number(row.shippingCost),
    returns: row.returnPolicy,
    images: Array.isArray(row.images) ? row.images : [],
    autoExtendEnabled: row.autoExtendEnabled !== false,
    autoExtendedDates: Array.isArray(row.autoExtendDates)
      ? row.autoExtendDates.map((d) => new Date(d).getTime())
      : [],
    allowUnratedBidders: row.allowUnratedBidders !== false,
    rejectedBidders: Array.isArray(row.rejectedBidders)
      ? row.rejectedBidders.map((id) => String(id))
      : [],
    bids: [],
    questions: [],
    bidCount: Number(row.bidCount || 0),
    topBidderName:
      topBidderNameRaw == null
        ? undefined
        : shouldUnmask
        ? String(topBidderNameRaw)
        : maskName(String(topBidderNameRaw)),
  };
}

// Helper function to enrich listing with related data
async function enrichListing(
  listing,
  requesterId = null,
  requesterRole = null
) {
  if (!listing) return null;

  const isSeller =
    requesterId && String(listing.sellerId) === String(requesterId);
  const isAdmin = requesterRole === "admin";
  const shouldUnmask = isSeller || isAdmin;

  try {
    let sellerName = "Unknown";
    try {
      const seller = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.userId, listing.sellerId))
        .limit(1);
      sellerName = seller[0]?.name || "Unknown";
    } catch (err) {
      console.error(`Error fetching seller ${listing.sellerId}:`, err.message);
    }

    let categoryName = "Unknown";
    try {
      const category = await db
        .select({ name: categories.name })
        .from(categories)
        .where(eq(categories.categoryId, listing.categoryId))
        .limit(1);
      categoryName = category[0]?.name || "Unknown";
    } catch (err) {
      console.error(
        `Error fetching category ${listing.categoryId}:`,
        err.message
      );
    }

    let subcategoryName = null;
    if (listing.subcategoryId) {
      try {
        const subcategory = await db
          .select({ name: subcategories.name })
          .from(subcategories)
          .where(eq(subcategories.subcategoryId, listing.subcategoryId))
          .limit(1);
        subcategoryName = subcategory[0]?.name || null;
      } catch (err) {
        console.error(
          `Error fetching subcategory ${listing.subcategoryId}:`,
          err.message
        );
      }
    }

    let enrichedBids = [];
    try {
      const bidsData = await bidService.listAll(listing.listingId, null);
      const ratingService = (await import("./rating.js")).default;

      enrichedBids = await Promise.all(
        bidsData.map(async (bid) => {
          try {
            let bidderName = "Unknown";
            try {
              const bidder = await db
                .select({ name: users.name })
                .from(users)
                .where(eq(users.userId, bid.bidderId))
                .limit(1);
              bidderName = bidder[0]?.name || "Unknown";
            } catch (err) {
              console.error(
                `Error fetching bidder ${bid.bidderId}:`,
                err.message
              );
            }

            let bidderRating = undefined;
            try {
              const ratingSummary = await ratingService.summaryForUser(
                bid.bidderId
              );
              if (ratingSummary.total > 0) {
                bidderRating = Math.round(
                  (ratingSummary.up / ratingSummary.total) * 100
                );
              }
            } catch (ratingErr) {
              console.error(
                `Error fetching rating for bidder ${bid.bidderId}:`,
                ratingErr.message
              );
            }

            return {
              id: String(bid.bidId),
              bidderId: String(bid.bidderId),
              bidderName: shouldUnmask ? bidderName : maskName(bidderName),
              amount: Number(bid.amount),
              timestamp: bid.createdAt
                ? new Date(bid.createdAt).getTime()
                : Date.now(),
              bidderRating,
            };
          } catch (err) {
            console.error(`Error enriching bid ${bid.bidId}:`, err.message);
            return null;
          }
        })
      );
      enrichedBids = enrichedBids.filter((b) => b !== null);
    } catch (err) {
      console.error(
        `Error fetching bids for listing ${listing.listingId}:`,
        err
      );
    }
    let enrichedQuestions = [];
    try {
      const questionsData = await questionService.listAll(
        listing.listingId,
        null
      );
      enrichedQuestions = await Promise.all(
        questionsData.map(async (q) => {
          try {
            const user = await db
              .select({ name: users.name })
              .from(users)
              .where(eq(users.userId, q.userId))
              .limit(1);
            return {
              id: String(q.questionId),
              userId: String(q.userId),
              userName: shouldUnmask
                ? user[0]?.name || "Unknown"
                : maskName(user[0]?.name || "Unknown"),
              question: q.questionText,
              answer: q.answerText || undefined,
              timestamp: q.createdAt
                ? new Date(q.createdAt).getTime()
                : Date.now(),
            };
          } catch (err) {
            console.error(`Error enriching question ${q.questionId}:`, err);
            return null;
          }
        })
      );
      enrichedQuestions = enrichedQuestions.filter((q) => q !== null);
    } catch (err) {
      console.error(
        `Error fetching questions for listing ${listing.listingId}:`,
        err
      );
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
      buyNowPrice: listing.buyNowPrice
        ? Number(listing.buyNowPrice)
        : undefined,
      status: listing.status,
      createdAt: listing.createdAt
        ? new Date(listing.createdAt).getTime()
        : Date.now(),
      endsAt: listing.endsAt ? new Date(listing.endsAt).getTime() : Date.now(),
      condition: listing.itemCondition,
      shippingCost: Number(listing.shippingCost),
      returns: listing.returnPolicy,
      images: Array.isArray(listing.images) ? listing.images : [],
      autoExtendEnabled: listing.autoExtendEnabled !== false,
      autoExtendedDates: Array.isArray(listing.autoExtendDates)
        ? listing.autoExtendDates.map((d) => new Date(d).getTime())
        : [],
      rejectedBidders: Array.isArray(listing.rejectedBidders)
        ? listing.rejectedBidders.map((id) => String(id))
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
      sellerName: "Unknown",
      title: listing.title,
      description: listing.description,
      category: "Unknown",
      subCategory: null,
      categories: ["Unknown"],
      startingPrice: Number(listing.startingPrice),
      currentBid: Number(listing.currentBid),
      stepPrice: Number(listing.stepPrice),
      buyNowPrice: listing.buyNowPrice
        ? Number(listing.buyNowPrice)
        : undefined,
      status: listing.status,
      createdAt: listing.createdAt
        ? new Date(listing.createdAt).getTime()
        : Date.now(),
      endsAt: listing.endsAt ? new Date(listing.endsAt).getTime() : Date.now(),
      condition: listing.itemCondition,
      shippingCost: Number(listing.shippingCost),
      returns: listing.returnPolicy,
      images: Array.isArray(listing.images) ? listing.images : [],
      autoExtendEnabled: listing.autoExtendEnabled !== false,
      autoExtendedDates: [],
      rejectedBidders: [],
      bids: [],
      questions: [],
    };
  }
}

const service = {
  top5ClosingSoonSummary: async function ({
    limit = 5,
    requesterId = null,
    requesterRole = null,
  } = {}) {
    limit = Math.min(Math.max(1, +limit), 50);

    const bidCountExpr = sql`(
      SELECT count(*)
      FROM ${bids}
      WHERE ${bids.listingId} = ${listings.listingId}
    )`.mapWith(Number);

    const topBidderNameExpr = sql`(
      SELECT ${users.name}
      FROM ${bids}
      JOIN ${users} ON ${users.userId} = ${bids.bidderId}
      WHERE ${bids.listingId} = ${listings.listingId}
      ORDER BY ${bids.amount} DESC, ${bids.bidId} DESC
      LIMIT 1
    )`;

    const whereClause = and(
      eq(listings.status, "active"),
      sql`${listings.endsAt} > NOW()`
    );

    const result = await db
      .select({
        ...defaultSelection,
        sellerName: users.name,
        categoryName: categories.name,
        subcategoryName: subcategories.name,
        bidCount: bidCountExpr,
        topBidderName: topBidderNameExpr,
      })
      .from(listings)
      .leftJoin(users, eq(users.userId, listings.sellerId))
      .leftJoin(categories, eq(categories.categoryId, listings.categoryId))
      .leftJoin(
        subcategories,
        eq(subcategories.subcategoryId, listings.subcategoryId)
      )
      .where(whereClause)
      .orderBy(asc(listings.endsAt), desc(listings.listingId))
      .limit(limit);

    return result.map((row) =>
      mapListingRowToSummary(row, requesterId, requesterRole)
    );
  },

  top5HighestPriceSummary: async function ({
    limit = 5,
    requesterId = null,
    requesterRole = null,
  } = {}) {
    limit = Math.min(Math.max(1, +limit), 50);

    const bidCountExpr = sql`(
      SELECT count(*)
      FROM ${bids}
      WHERE ${bids.listingId} = ${listings.listingId}
    )`.mapWith(Number);

    const topBidderNameExpr = sql`(
      SELECT ${users.name}
      FROM ${bids}
      JOIN ${users} ON ${users.userId} = ${bids.bidderId}
      WHERE ${bids.listingId} = ${listings.listingId}
      ORDER BY ${bids.amount} DESC, ${bids.bidId} DESC
      LIMIT 1
    )`;

    const whereClause = and(
      eq(listings.status, "active"),
      sql`${listings.endsAt} > NOW()`
    );

    const result = await db
      .select({
        ...defaultSelection,
        sellerName: users.name,
        categoryName: categories.name,
        subcategoryName: subcategories.name,
        bidCount: bidCountExpr,
        topBidderName: topBidderNameExpr,
      })
      .from(listings)
      .leftJoin(users, eq(users.userId, listings.sellerId))
      .leftJoin(categories, eq(categories.categoryId, listings.categoryId))
      .leftJoin(
        subcategories,
        eq(subcategories.subcategoryId, listings.subcategoryId)
      )
      .where(whereClause)
      .orderBy(desc(listings.currentBid), desc(listings.listingId))
      .limit(limit);

    return result.map((row) =>
      mapListingRowToSummary(row, requesterId, requesterRole)
    );
  },

  top5MostBidsSummary: async function ({
    limit = 5,
    requesterId = null,
    requesterRole = null,
  } = {}) {
    limit = Math.min(Math.max(1, +limit), 50);

    const bidCountExpr = sql`(
      SELECT count(*)
      FROM ${bids}
      WHERE ${bids.listingId} = ${listings.listingId}
    )`.mapWith(Number);

    const topBidderNameExpr = sql`(
      SELECT ${users.name}
      FROM ${bids}
      JOIN ${users} ON ${users.userId} = ${bids.bidderId}
      WHERE ${bids.listingId} = ${listings.listingId}
      ORDER BY ${bids.amount} DESC, ${bids.bidId} DESC
      LIMIT 1
    )`;

    const whereClause = and(
      eq(listings.status, "active"),
      sql`${listings.endsAt} > NOW()`
    );

    const result = await db
      .select({
        ...defaultSelection,
        sellerName: users.name,
        categoryName: categories.name,
        subcategoryName: subcategories.name,
        bidCount: bidCountExpr,
        topBidderName: topBidderNameExpr,
      })
      .from(listings)
      .leftJoin(users, eq(users.userId, listings.sellerId))
      .leftJoin(categories, eq(categories.categoryId, listings.categoryId))
      .leftJoin(
        subcategories,
        eq(subcategories.subcategoryId, listings.subcategoryId)
      )
      .where(whereClause)
      .orderBy(desc(bidCountExpr), desc(listings.listingId))
      .limit(limit);

    return result.map((row) =>
      mapListingRowToSummary(row, requesterId, requesterRole)
    );
  },

  listAllSummary: async function ({
    page = 1,
    limit = DEFAULT_LIMIT,
    sort = undefined,
    cat = undefined,
    sub = undefined,
    requesterId = null,
    requesterRole = null,
  } = {}) {
    limit = Math.min(Math.max(1, +limit), MAX_LIMIT);
    page = Math.max(1, +page);
    const offset = (page - 1) * limit;

    const orderBy = buildListingOrderBy(sort);

    const whereParts = [];
    if (cat && String(cat).trim() && String(cat).trim() !== "All") {
      whereParts.push(eq(categories.name, String(cat).trim()));
    }
    if (sub && String(sub).trim()) {
      whereParts.push(eq(subcategories.name, String(sub).trim()));
    }
    const whereClause = whereParts.length ? and(...whereParts) : undefined;

    const countQuery = db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(listings)
      .leftJoin(categories, eq(categories.categoryId, listings.categoryId))
      .leftJoin(
        subcategories,
        eq(subcategories.subcategoryId, listings.subcategoryId)
      );
    const countRows = whereClause
      ? await countQuery.where(whereClause)
      : await countQuery;
    const totalItems = countRows?.[0]?.count ?? 0;

    const bidCountExpr = sql`(
      SELECT count(*)
      FROM ${bids}
      WHERE ${bids.listingId} = ${listings.listingId}
    )`.mapWith(Number);

    const topBidderNameExpr = sql`(
      SELECT ${users.name}
      FROM ${bids}
      JOIN ${users} ON ${users.userId} = ${bids.bidderId}
      WHERE ${bids.listingId} = ${listings.listingId}
      ORDER BY ${bids.amount} DESC, ${bids.bidId} DESC
      LIMIT 1
    )`;

    const result = await db
      .select({
        ...defaultSelection,
        sellerName: users.name,
        categoryName: categories.name,
        subcategoryName: subcategories.name,
        bidCount: bidCountExpr,
        topBidderName: topBidderNameExpr,
      })
      .from(listings)
      .leftJoin(users, eq(users.userId, listings.sellerId))
      .leftJoin(categories, eq(categories.categoryId, listings.categoryId))
      .leftJoin(
        subcategories,
        eq(subcategories.subcategoryId, listings.subcategoryId)
      )
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    const data = result.map((row) =>
      mapListingRowToSummary(row, requesterId, requesterRole)
    );

    return { page, limit, totalItems, data };
  },

  searchListingsSummary: async function ({
    query,
    page = 1,
    limit = DEFAULT_LIMIT,
    sort = undefined,
    requesterId = null,
    requesterRole = null,
  } = {}) {
    const tsQuery = buildPrefixTsQuery(query);
    if (!tsQuery) return { page, limit, totalItems: 0, data: [] };

    limit = Math.min(Math.max(1, +limit), MAX_LIMIT);
    page = Math.max(1, +page);
    const offset = (page - 1) * limit;

    const orderBy = buildListingOrderBy(sort);
    const searchWhere = sql`to_tsvector('english', ${listings.title} || ' ' || coalesce(${categories.name}, '') || ' ' || coalesce(${subcategories.name}, '')) @@ to_tsquery('english', ${tsQuery})`;

    const countRows = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(listings)
      .leftJoin(categories, eq(categories.categoryId, listings.categoryId))
      .leftJoin(
        subcategories,
        eq(subcategories.subcategoryId, listings.subcategoryId)
      )
      .where(searchWhere);
    const totalItems = countRows?.[0]?.count ?? 0;

    const bidCountExpr = sql`(
      SELECT count(*)
      FROM ${bids}
      WHERE ${bids.listingId} = ${listings.listingId}
    )`.mapWith(Number);

    const topBidderNameExpr = sql`(
      SELECT ${users.name}
      FROM ${bids}
      JOIN ${users} ON ${users.userId} = ${bids.bidderId}
      WHERE ${bids.listingId} = ${listings.listingId}
      ORDER BY ${bids.amount} DESC, ${bids.bidId} DESC
      LIMIT 1
    )`;

    const result = await db
      .select({
        ...defaultSelection,
        sellerName: users.name,
        categoryName: categories.name,
        subcategoryName: subcategories.name,
        bidCount: bidCountExpr,
        topBidderName: topBidderNameExpr,
      })
      .from(listings)
      .leftJoin(users, eq(users.userId, listings.sellerId))
      .leftJoin(categories, eq(categories.categoryId, listings.categoryId))
      .leftJoin(
        subcategories,
        eq(subcategories.subcategoryId, listings.subcategoryId)
      )
      .where(searchWhere)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    const data = result.map((row) =>
      mapListingRowToSummary(row, requesterId, requesterRole)
    );
    return { page, limit, totalItems, data };
  },

  listAll: async function ({
    page = 1,
    limit = DEFAULT_LIMIT,
    sort = undefined,
    cat = undefined,
    sub = undefined,
    requesterId = null,
    requesterRole = null,
  } = {}) {
    limit = Math.min(Math.max(1, +limit), MAX_LIMIT);
    page = Math.max(1, +page);
    const offset = (page - 1) * limit;

    const orderBy = buildListingOrderBy(sort);

    const whereParts = [];
    if (cat && String(cat).trim() && String(cat).trim() !== "All") {
      whereParts.push(eq(categories.name, String(cat).trim()));
    }
    if (sub && String(sub).trim()) {
      whereParts.push(eq(subcategories.name, String(sub).trim()));
    }
    const whereClause = whereParts.length ? and(...whereParts) : undefined;

    const countQuery = db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(listings)
      .leftJoin(categories, eq(categories.categoryId, listings.categoryId))
      .leftJoin(
        subcategories,
        eq(subcategories.subcategoryId, listings.subcategoryId)
      );
    const countRows = whereClause
      ? await countQuery.where(whereClause)
      : await countQuery;
    const totalItems = countRows?.[0]?.count ?? 0;

    const result = await db
      .select(defaultSelection)
      .from(listings)
      .leftJoin(categories, eq(categories.categoryId, listings.categoryId))
      .leftJoin(
        subcategories,
        eq(subcategories.subcategoryId, listings.subcategoryId)
      )
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    const enrichedData = await Promise.all(
      result.map((listing) =>
        enrichListing(listing, requesterId, requesterRole)
      )
    );
    const validListings = enrichedData.filter((l) => l !== null);

    return { page, limit, totalItems, data: validListings };
  },

  listOne: async function (
    listingId = null,
    title = null,
    requesterId = null,
    requesterRole = null
  ) {
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
    return await enrichListing(listing, requesterId, requesterRole);
  },

  // Full-text search across title, category name and subcategory name
  searchListings: async function ({
    query,
    page = 1,
    limit = DEFAULT_LIMIT,
    sort = undefined,
    requesterId = null,
    requesterRole = null,
  } = {}) {
    const tsQuery = buildPrefixTsQuery(query);
    if (!tsQuery) return { page, limit, totalItems: 0, data: [] };

    limit = Math.min(Math.max(1, +limit), MAX_LIMIT);
    page = Math.max(1, +page);
    const offset = (page - 1) * limit;

    const orderBy = buildListingOrderBy(sort);

    const searchWhere = sql`to_tsvector('english', ${listings.title} || ' ' || coalesce(${categories.name}, '') || ' ' || coalesce(${subcategories.name}, '')) @@ to_tsquery('english', ${tsQuery})`;

    const countRows = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(listings)
      .leftJoin(categories, eq(categories.categoryId, listings.categoryId))
      .leftJoin(
        subcategories,
        eq(subcategories.subcategoryId, listings.subcategoryId)
      )
      .where(searchWhere);
    const totalItems = countRows?.[0]?.count ?? 0;

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
      .where(searchWhere)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    const enrichedData = await Promise.all(
      result.map((listing) =>
        enrichListing(listing, requesterId, requesterRole)
      )
    );
    return { page, limit, totalItems, data: enrichedData };
  },
  create: async function (listing) {
    const result = await db.insert(listings).values(listing).returning();
    const newListing = result[0];
    return await enrichListing(newListing, newListing.sellerId, "seller");
  },

  update: async function (listing) {
    await db
      .update(listings)
      .set(listing)
      .where(eq(listings.listingId, listing.listingId));
    const updated = await db
      .select(defaultSelection)
      .from(listings)
      .where(eq(listings.listingId, listing.listingId))
      .limit(1);
    return await enrichListing(updated[0], updated[0].sellerId, "seller");
  },

  // update current bid amount for a listing
  updateCurrentBid: async function (
    listingId,
    amount,
    requesterId = null,
    requesterRole = null
  ) {
    await db
      .update(listings)
      .set({ currentBid: amount })
      .where(eq(listings.listingId, listingId));
    return this.listOne(listingId, null, requesterId, requesterRole);
  },

  remove: async function (listingId) {
    await db.delete(listings).where(eq(listings.listingId, listingId));
  },

  listParticipating: async function (bidderId, requesterRole = null) {
    const bidService = (await import("./bid.js")).default;
    const allBids = await bidService.listAll(null, bidderId);

    const listingIds = [...new Set(allBids.map((b) => b.listingId))];

    if (listingIds.length === 0) return [];

    const result = await db
      .select(defaultSelection)
      .from(listings)
      .where(
        sql`${listings.listingId} IN (${sql.join(
          listingIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );

    const enrichedData = await Promise.all(
      result.map((listing) => enrichListing(listing, bidderId, requesterRole))
    );

    return enrichedData;
  },

  listWon: async function (bidderId, requesterRole = null) {
    const orderService = (await import("./order.js")).default;
    const orders = await orderService.listByBidder(bidderId);

    if (orders.length === 0) return [];

    const listingIds = orders.map((o) => o.listingId);

    const result = await db
      .select(defaultSelection)
      .from(listings)
      .where(
        sql`${listings.listingId} IN (${sql.join(
          listingIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );

    const enrichedData = await Promise.all(
      result.map((listing) => enrichListing(listing, bidderId, requesterRole))
    );

    return enrichedData;
  },

  // Periodic sweep: close auctions that ended
  sweepEndedAuctions: async function () {
    const userService = (await import("./user.js")).default;
    const orderService = (await import("./order.js")).default;
    const emailLib = (await import("../lib/email.js")).default;

    const endedRows = await db
      .select({
        listingId: listings.listingId,
        sellerId: listings.sellerId,
        title: listings.title,
        startingPrice: listings.startingPrice,
        status: listings.status,
        endsAt: listings.endsAt,
      })
      .from(listings)
      .where(
        and(eq(listings.status, "active"), sql`${listings.endsAt} < NOW()`)
      );

    if (!endedRows || endedRows.length === 0) return { processed: 0 };

    let processed = 0;
    for (const row of endedRows) {
      try {
        const listingId = Number(row.listingId);
        const sellerId = Number(row.sellerId);

        const existingOrder = await orderService.getByListingId(listingId);
        if (existingOrder) {
          await db
            .update(listings)
            .set({ status: "sold" })
            .where(eq(listings.listingId, listingId));
          processed++;
          continue;
        }

        const allBids = await bidService.listAll(listingId);
        const top = allBids.length > 0 ? allBids[0] : null;

        if (!top) {
          // No winner
          await db
            .update(listings)
            .set({ status: "ended" })
            .where(eq(listings.listingId, listingId));

          const seller = await userService.listOne(sellerId);
          if (seller?.email) {
            await emailLib.sendAuctionEndedSellerEmail(
              seller.email,
              row.title,
              "no_winner",
              Number(row.startingPrice || 0),
              null
            );
          }
          processed++;
          continue;
        }

        // Winner exists: create order
        await orderService.create({
          listingId,
          bidderId: Number(top.bidderId),
          sellerId,
          finalPrice: Number(top.amount),
          shippingAddress: null,
          status: "paid",
        });

        processed++;
      } catch (e) {
        console.error("Auction sweep item failed", e);
      }
    }

    return { processed };
  },
};

export default service;
