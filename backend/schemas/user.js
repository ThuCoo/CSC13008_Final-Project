import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  passwordHash: z.string().min(60).optional(), // assume hashed externally; optional for social-login
  name: z.string().min(1),
  avatarUrl: z.string().url().optional(),
  role: z.enum(["buyer", "seller", "admin"]).optional(),
  sellerApproved: z.boolean().optional(),
  address: z.string().optional(),
  birthday: z.preprocess((arg) => {
    if (typeof arg === "string" || typeof arg === "number")
      return new Date(arg);
    return arg;
  }, z.date().optional()),
});

export const updateUserSchema = createUserSchema.partial();

export const listUsersQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
