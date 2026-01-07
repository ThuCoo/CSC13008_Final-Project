import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  // optimise
  mode: z.enum(["full", "summary"]).optional(),
  cat: z.string().min(1).optional(),
  sub: z.string().min(1).optional(),
  sort: z
    .enum([
      "ending_desc",
      "ending_soon",
      "price_asc",
      "price_low",
      "price_high",
      "created_desc",
    ])
    .optional(),
});

export const searchSchema = paginationSchema.extend({
  q: z.string().min(1),
});

export const idParams = z.object({ id: z.coerce.number().int().positive() });
