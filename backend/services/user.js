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
  create: async function (user) {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  },
  remove: async function (userId) {
    await db.delete(users).where(eq(users.userId, userId));
  },
};

export default service;
