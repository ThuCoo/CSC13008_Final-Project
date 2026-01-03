import { eq } from "drizzle-orm";
import db from "../db/index.js";
import { users } from "../db/schema.js";

const defaultSelection = {
  userId: users.userId,
  email: users.email,
  name: users.name,
  avatarUrl: users.avatarUrl,
  role: users.role,
  sellerApproved: users.seller_approved,
  address: users.address,
  birthday: users.birthday,
  isVerified: users.isVerified,
  verifiedAt: users.verifiedAt,
};

const service = {
  listAll: async function () {
    return db.select(defaultSelection).from(users);
  },
  listOne: async function (userId = null, email = null) {
    let query = db.select(defaultSelection).from(users);
    if (userId != null) {
      query = query.where(eq(users.userId, userId));
    }
    if (email != null) {
      query = query.where(eq(users.email, email));
    }
    const result = await query;
    return result[0] || null;
  },
  // returns full user row including passwordHash for authentication checks
  getByEmailWithHash: async function (email) {
    const result = await db
      .select({
        ...defaultSelection,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, email));
    return result[0] || null;
  },
  create: async function (user) {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  },
  update: async function (user) {
    await db.update(users).set(user).where(eq(users.userId, user.userId));
    return this.listOne(user.userId);
  },
  remove: async function (userId) {
    await db.delete(users).where(eq(users.userId, userId));
  },
};

export default service;
