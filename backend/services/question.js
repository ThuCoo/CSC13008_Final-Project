import { eq } from "drizzle-orm";
import db from "../db/index.js";
import { questions } from "../db/schema.js";

const defaultSelection = {
  questionId: questions.questionId,
  listingId: questions.listingId,
  userId: questions.userId,
  questionText: questions.questionText,
  answerText: questions.answerText,
  createdAt: questions.createdAt,
};

const service = {
  listAll: async function (listingId = null, userId = null) {
    let query = db.select(defaultSelection).from(questions);
    if (listingId != null) {
      query = query.where(eq(questions.listingId, listingId));
    }
    if (userId != null) {
      query = query.where(eq(questions.userId, userId));
    }
    const result = await query;
    return result;
  },
  listOne: async function (questionId = null) {
    let query = db.select(defaultSelection).from(questions);
    if (questionId != null) {
      query = query.where(eq(questions.questionId, questionId));
    }
    const result = await query;
    return result[0] || null;
  },
  create: async function (question) {
    const result = await db.insert(questions).values(question).returning();
    return result[0];
  },
  remove: async function (questionId) {
    await db.delete(questions).where(eq(questions.questionId, questionId));
  },
};

export default service;
