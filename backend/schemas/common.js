import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const searchSchema = paginationSchema.extend({
  q: z.string().min(1),
});

export const idParams = z.object({ id: z.coerce.number().int().positive() });
