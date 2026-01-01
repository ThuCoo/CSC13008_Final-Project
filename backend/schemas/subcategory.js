import { z } from "zod";

export const createSubcategorySchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  name: z.string().min(1, "Name is required"),
});

export const updateSubcategorySchema = createSubcategorySchema.partial();

export const listSubcategoriesQuery = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
});
