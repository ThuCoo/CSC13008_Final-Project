import { eq } from "drizzle-orm";
import db from "../db/index.js";
import { categories, subcategories, listings } from "../db/schema.js";

const defaultSelection = {
  categoryId: categories.categoryId,
  name: categories.name,
  description: categories.description,
  icon: categories.icon,
};

const service = {
  listAll: async function () {
    return db.select(defaultSelection).from(categories);
  },
  listOne: async function (categoryId = null) {
    let query = db.select(defaultSelection).from(categories);
    if (categoryId != null) {
      query = query.where(eq(categories.categoryId, categoryId));
    }
    const result = await query;
    return result[0] || null;
  },
  create: async function (category) {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  },
  update: async function (category) {
    await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, category.id));
    return this.listOne(category.id);
  },
  remove: async function (categoryId) {
    const existingListings = await db
      .select()
      .from(listings)
      .where(eq(listings.categoryId, categoryId));

    if ((existingListings || []).length > 0) {
      const err = new Error("Cannot delete category with existing listings");
      err.code = "CATEGORY_HAS_LISTINGS";
      throw err;
    }

    // delete subcategories
    await db
      .delete(subcategories)
      .where(eq(subcategories.categoryId, categoryId));

    await db.delete(categories).where(eq(categories.categoryId, categoryId));
  },
};

export default service;
