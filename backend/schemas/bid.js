import { z } from "zod";

export const createBidSchema = z.object({
  listingId: z.coerce.number().int().positive(),
  bidderId: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive("Amount must be a positive number"),
});

export const listBidsQuery = z.object({
  listingId: z.coerce.number().int().positive().optional(),
  bidderId: z.coerce.number().int().positive().optional(),
});
