import { eq } from "drizzle-orm";
import db from "../db/index.js";
import { sellerRequests } from "../db/schema.js";

const defaultSelection = {
  requestId: sellerRequests.requestId,
  userId: sellerRequests.userId,
  businessName: sellerRequests.businessName,
  businessDescription: sellerRequests.businessDescription,
  status: sellerRequests.status,
  reviewedBy: sellerRequests.reviewedBy,
  reviewedAt: sellerRequests.reviewedAt,
  rejectionReason: sellerRequests.rejectionReason,
  createdAt: sellerRequests.createdAt,
};

const service = {
  listAll: async function (userId = null, reviewedBy = null) {
    let query = db.select(defaultSelection).from(sellerRequests);
    if (userId != null) {
      query = query.where(eq(sellerRequests.userId, userId));
    }
    if (reviewedBy != null) {
      query = query.where(eq(sellerRequests.reviewedBy, reviewedBy));
    }
    const result = await query;
    return result;
  },
  listOne: async function (requestId = null) {
    let query = db.select(defaultSelection).from(sellerRequests);
    if (requestId != null) {
      query = query.where(eq(sellerRequests.requestId, requestId));
    }
    const result = await query;
    return result[0] || null;
  },
  create: async function (request) {
    const result = await db.insert(sellerRequests).values(request).returning();
    return result[0];
  },
  update: async function (request) {
    await db
      .update(sellerRequests)
      .set(request)
      .where(eq(sellerRequests.requestId, request.requestId));
    return this.listOne(request.requestId);
  },
  remove: async function (requestId) {
    await db
      .delete(sellerRequests)
      .where(eq(sellerRequests.requestId, requestId));
  },
};

export default service;
