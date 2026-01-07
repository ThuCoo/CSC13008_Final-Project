import { asc, eq } from "drizzle-orm";
import db from "../db/index.js";
import { orderMessages, users } from "../db/schema.js";

const service = {
  listByOrderId: async function (orderId) {
    const rows = await db
      .select({
        id: orderMessages.id,
        orderId: orderMessages.orderId,
        senderId: orderMessages.senderId,
        senderName: users.name,
        message: orderMessages.message,
        createdAt: orderMessages.createdAt,
      })
      .from(orderMessages)
      .leftJoin(users, eq(users.userId, orderMessages.senderId))
      .where(eq(orderMessages.orderId, orderId))
      .orderBy(asc(orderMessages.createdAt));

    return rows.map((m) => ({
      ...m,
      senderName: m.senderName || "Unknown",
    }));
  },

  create: async function ({ orderId, senderId, message }) {
    const result = await db
      .insert(orderMessages)
      .values({
        orderId,
        senderId,
        message,
      })
      .returning();
    return result[0];
  },
};

export default service;
