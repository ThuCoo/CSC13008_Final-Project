import { z } from "zod";

export const createRatingSchema = z.object({
  targetUserId: z.coerce.number().int().positive(),
  rating: z.union([z.literal(1), z.literal(-1)]),
  role: z.enum(["bidder", "seller"]),
  comment: z.string().max(1000).optional(),
});

export const idParams = z.object({ id: z.coerce.number().int().positive() });
