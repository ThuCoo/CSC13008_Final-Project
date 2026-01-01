import { eq } from "drizzle-orm";
import db from "../db/index.js";
import { ratings, users } from "../db/schema.js";

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
  create: async function (payload) {
    const result = await db.insert(ratings).values(payload).returning();
    return result[0];
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
};

export default service;
