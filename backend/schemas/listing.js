import { z } from "zod";

const listingBaseSchema = z.object({
  sellerId: z.coerce.number().int().positive().optional(),
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  categoryId: z.coerce.number().int().positive().optional(),
  subcategoryId: z.coerce.number().int().positive().optional(),
  startingPrice: z.coerce
    .number()
    .nonnegative("Starting price must be a non-negative number."),
  currentBid: z.coerce.number().nonnegative().optional(),
  stepPrice: z.coerce
    .number()
    .positive("Step price must be a positive number."),
  buyNowPrice: z.coerce.number().nonnegative().optional(),
  status: z.enum(["active", "ended", "sold"]).optional(),
  createdAt: z.preprocess((arg) => {
    if (typeof arg === "string" || typeof arg === "number")
      return new Date(arg);
    return arg;
  }, z.date().optional()),
  endsAt: z.preprocess((arg) => {
    if (typeof arg === "string" || typeof arg === "number")
      return new Date(arg);
    return arg;
  }, z.date().optional()),
  itemCondition: z.string().optional(),
  shippingCost: z.coerce.number().nonnegative().optional(),
  returnPolicy: z.string().optional(),
  images: z.array(z.string()).optional(),
  autoExtendEnabled: z.coerce.boolean().optional(),
  allowUnratedBidders: z.coerce.boolean().optional(),
  autoExtendDates: z
    .array(
      z.preprocess(
        (arg) =>
          typeof arg === "string" || typeof arg === "number"
            ? new Date(arg)
            : arg,
        z.date()
      )
    )
    .optional(),
  rejectedBidders: z
    .array(z.union([z.string(), z.coerce.number().int()]))
    .optional(),
});

export const createListingSchema = listingBaseSchema
  .pick({
    sellerId: true,
    title: true,
    description: true,
    categoryId: true,
    subcategoryId: true,
    startingPrice: true,
    stepPrice: true,
    buyNowPrice: true,
    itemCondition: true,
    shippingCost: true,
    returnPolicy: true,
    autoExtendEnabled: true,
    allowUnratedBidders: true,
  })
  .extend({
    images: z.array(z.string()).min(3, "At least 3 images are required."),
    endsAt: z.preprocess(
      (arg) =>
        typeof arg === "string" || typeof arg === "number"
          ? new Date(arg)
          : arg,
      z.date().refine((d) => !isNaN(d.getTime()), {
        message: "endsAt must be a valid date/time",
      })
    ),
    createdAt: z.preprocess((arg) => {
      if (typeof arg === "string" || typeof arg === "number")
        return new Date(arg);
      return arg;
    }, z.date().optional()),
  })
  .refine(
    (obj) => obj.endsAt.getTime() > (obj.createdAt?.getTime() ?? Date.now()),
    { message: "endsAt must be after createdAt", path: ["endsAt"] }
  );

export const updateListingSchema = listingBaseSchema
  .partial()
  .superRefine((data, ctx) => {
    if (data.endsAt && data.createdAt) {
      const ends =
        data.endsAt instanceof Date ? data.endsAt : new Date(data.endsAt);
      const created =
        data.createdAt instanceof Date
          ? data.createdAt
          : new Date(data.createdAt);

      if (isNaN(ends.getTime()) || isNaN(created.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endsAt"],
          message: "endsAt and createdAt must be valid dates",
        });
        return;
      }

      if (ends.getTime() <= created.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endsAt"],
          message: "endsAt must be after createdAt",
        });
      }
    }
  });
