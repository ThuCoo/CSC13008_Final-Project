import { z } from "zod";

export const createWatchlistSchema = z.object({
  userId: z.coerce.number().int().positive(),
  listingId: z.coerce.number().int().positive(),
});

export const listWatchlistQuery = z.object({
  userId: z.coerce.number().int().positive().optional(),
});

export const watchlistParams = z.object({
  userId: z.coerce.number().int().positive(),
  listingId: z.coerce.number().int().positive(),
});
