import { z } from "zod";

export const createQuestionSchema = z.object({
  listingId: z.coerce.number().int().positive(),
  userId: z.coerce.number().int().positive(),
  questionText: z.string().min(1, "Question is required"),
});

export const updateQuestionSchema = z.object({
  questionId: z.coerce.number().int().positive(),
  answerText: z.string().min(1, "Answer is required"),
});

export const listQuestionsQuery = z.object({
  listingId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
});
