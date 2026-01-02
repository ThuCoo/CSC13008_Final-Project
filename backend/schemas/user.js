import { z } from "zod";

export const createUserSchema = z
  .object({
    email: z.email(),
    // accept plaintext password on create
    password: z.string().min(8).optional(),
    passwordHash: z.string().min(60).optional(),
    name: z.string().min(1),
    avatarUrl: z.url().optional(),
    role: z.enum(["bidder", "seller", "admin"]).optional(),
    sellerApproved: z.boolean().optional(),
    address: z.string().optional(),
    birthday: z.preprocess((arg) => {
      if (typeof arg === "string" || typeof arg === "number")
        return new Date(arg);
      return arg;
    }, z.date().optional()),
    isVerified: z.boolean().optional(),
  })
  .refine((data) => !!(data.password || data.passwordHash), {
    message: "password or passwordHash is required",
    path: ["password"],
  });

export const updateUserSchema = z.object({
  email: z.email().optional(),
  password: z.string().min(8).optional(),
  passwordHash: z.string().min(60).optional(),
  name: z.string().min(1).optional(),
  avatarUrl: z.url().optional(),
  role: z.enum(["bidder", "seller", "admin"]).optional(),
  sellerApproved: z.boolean().optional(),
  address: z.string().optional(),
  birthday: z.preprocess((arg) => {
    if (typeof arg === "string" || typeof arg === "number")
      return new Date(arg);
    return arg;
  }, z.date().optional()),
});

export const listUsersQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});
