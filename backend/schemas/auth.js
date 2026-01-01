import { z } from "zod";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8).optional(),
  name: z.string().min(1),
  address: z.string().optional(),
  birthday: z.preprocess((arg) => {
    if (typeof arg === "string" || typeof arg === "number")
      return new Date(arg);
    return arg;
  }, z.date().optional()),
});

export const verifySchema = z.object({
  email: z.email(),
  code: z.string().length(6),
});
export const forgotSchema = z.object({ email: z.email() });
export const resetSchema = z.object({
  email: z.email(),
  code: z.string().length(6),
  newPassword: z.string().min(8),
});
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});
