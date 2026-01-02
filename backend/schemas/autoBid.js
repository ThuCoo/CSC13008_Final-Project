import { z } from "zod";

export const createAutoBidSchema = z.object({
  listingId: z.number({ required_error: "listingId is required" }),
  userId: z.number({ required_error: "userId is required" }),
  maxBidAmount: z
    .number()
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount"))
    .transform((val) => Number(val)),
  incrementAmount: z
    .number()
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount"))
    .transform((val) => Number(val)),
});

export const updateAutoBidSchema = createAutoBidSchema.partial();
