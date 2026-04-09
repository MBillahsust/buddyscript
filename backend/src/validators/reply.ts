import { z } from 'zod';

export const createReplySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Reply cannot be empty')
    .max(2000, 'Reply must be 2000 characters or less'),
});

export const updateReplySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Reply cannot be empty')
    .max(2000, 'Reply must be 2000 characters or less'),
});

export type CreateReplyInput = z.infer<typeof createReplySchema>;
export type UpdateReplyInput = z.infer<typeof updateReplySchema>;
