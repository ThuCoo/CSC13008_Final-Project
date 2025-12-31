import { eq } from "drizzle-orm";
import db from "../db/index.js";
import { categories, subcategories } from "../db/schema.js";

const defaultSelection = {
  subcategoryId: subcategories.subcategoryId,
  categoryId: subcategories.categoryId,
  name: subcategories.name,
};

const service = {
  listAll: async function (categoryId = null) {
    let query = db.select(defaultSelection).from(subcategories);
    if (categoryId != null) {
      query = query.where(eq(subcategories.categoryId, categoryId));
    }
    const result = await query;
    return result;
  },
  listOne: async function (subcategoryId = null) {
    let query = db.select(defaultSelection).from(subcategories);
    if (subcategoryId != null) {
      query = query.where(eq(subcategories.subcategoryId, subcategoryId));
    }
    const result = await query;
    return result[0] || null;
  },
  create: async function (subcategory) {
    const result = await db
      .insert(subcategories)
      .values(subcategory)
      .returning();
    return result[0];
  },
  remove: async function (subcategoryId) {
    await db
      .delete(subcategories)
      .where(eq(subcategories.subcategoryId, subcategoryId));
  },
};

export default service;
