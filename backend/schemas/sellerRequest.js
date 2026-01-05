import { z } from "zod";

export const createSellerRequestSchema = z.object({
  userId: z.coerce.number().int().positive(),
  businessName: z.string().min(1, "Business name is required"),
  businessDescription: z.string().optional(),
});

export const updateSellerRequestSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  reviewedBy: z.coerce.number().int().positive().optional(),
  reviewedAt: z
    .preprocess(
      (arg) =>
        typeof arg === "string" || typeof arg === "number"
          ? new Date(arg)
          : arg,
      z.date()
    )
    .optional(),
  rejectionReason: z.string().optional(),
});

export const listSellerRequestsQuery = z.object({
  userId: z.coerce.number().int().positive().optional(),
  reviewedBy: z.coerce.number().int().positive().optional(),
});
