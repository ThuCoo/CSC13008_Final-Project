import { and, eq } from "drizzle-orm";
import db from "../db/index.js";
import { orders, ratings, users } from "../db/schema.js";

const defaultSelection = {
  ratingId: ratings.ratingId,
  targetUserId: ratings.targetUserId,
  raterUserId: ratings.raterUserId,
  rating: ratings.rating,
  role: ratings.role,
  comment: ratings.comment,
  createdAt: ratings.createdAt,
};

const service = {
  canRateTransaction: async function ({ targetUserId, raterUserId, role }) {
    const normalizedRole = String(role);
    const targetId = Number(targetUserId);
    const raterId = Number(raterUserId);

    if (!targetId || !raterId) return false;
    if (targetId === raterId) return false;
    const whereClause =
      normalizedRole === "seller"
        ? and(eq(orders.bidderId, raterId), eq(orders.sellerId, targetId))
        : and(eq(orders.sellerId, raterId), eq(orders.bidderId, targetId));

    const rows = await db
      .select({ status: orders.status })
      .from(orders)
      .where(whereClause)
      .limit(50);

    const allowedStatuses =
      normalizedRole === "seller"
        ? ["delivered", "completed"]
        : ["delivered", "completed", "cancelled"];

    return rows.some((r) => allowedStatuses.includes(String(r.status)));
  },

  hasRating: async function ({ targetUserId, raterUserId, role }) {
    const targetId = Number(targetUserId);
    const raterId = Number(raterUserId);
    const normalizedRole = String(role);

    const rows = await db
      .select({ ratingId: ratings.ratingId })
      .from(ratings)
      .where(
        and(
          eq(ratings.targetUserId, targetId),
          eq(ratings.raterUserId, raterId),
          eq(ratings.role, normalizedRole)
        )
      )
      .limit(1);

    return Boolean(rows[0]?.ratingId);
  },

  hasMutualRatings: async function ({ sellerId, bidderId }) {
    const seller = Number(sellerId);
    const bidder = Number(bidderId);
    if (!seller || !bidder) return false;

    const bidderRatedSeller = await service.hasRating({
      targetUserId: seller,
      raterUserId: bidder,
      role: "seller",
    });
    const sellerRatedBidder = await service.hasRating({
      targetUserId: bidder,
      raterUserId: seller,
      role: "bidder",
    });

    return bidderRatedSeller && sellerRatedBidder;
  },

  upsert: async function (payload) {
    const lookup = await db
      .select({ ratingId: ratings.ratingId })
      .from(ratings)
      .where(
        and(
          eq(ratings.targetUserId, payload.targetUserId),
          eq(ratings.raterUserId, payload.raterUserId),
          eq(ratings.role, payload.role)
        )
      )
      .limit(1);

    if (lookup[0]?.ratingId) {
      const updated = await db
        .update(ratings)
        .set({ rating: payload.rating, comment: payload.comment })
        .where(eq(ratings.ratingId, lookup[0].ratingId))
        .returning();
      return { row: updated[0], created: false };
    }

    const inserted = await db.insert(ratings).values(payload).returning();
    return { row: inserted[0], created: true };
  },

  listForUser: async function (userId) {
    const rows = await db
      .select({ ...defaultSelection, raterName: users.name })
      .from(ratings)
      .leftJoin(users, eq(users.userId, ratings.raterUserId))
      .where(eq(ratings.targetUserId, userId));
    return rows;
  },

  summaryForUser: async function (userId) {
    const rows = await db
      .select()
      .from(ratings)
      .where(eq(ratings.targetUserId, userId));
    const up = rows.filter((r) => Number(r.rating) === 1).length;
    const down = rows.filter((r) => Number(r.rating) === -1).length;
    const score = up - down;
    return { up, down, score, total: rows.length };
  },

  // filters ratings by role context
  summaryForUserByRole: async function (userId, role) {
    const rows = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.targetUserId, userId), eq(ratings.role, role)));
    const up = rows.filter((r) => Number(r.rating) === 1).length;
    const down = rows.filter((r) => Number(r.rating) === -1).length;
    const score = up - down;
    return { up, down, score, total: rows.length };
  },
};

export default service;
