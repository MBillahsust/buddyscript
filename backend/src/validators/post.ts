import { z } from 'zod';

export const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .max(5000, 'Post content must be 5000 characters or less')
    .optional(),

  imageUrl: z
    .string()
    .optional(),

  visibility: z
    .enum(['PUBLIC', 'PRIVATE'], {
      error: "Visibility must be 'PUBLIC' or 'PRIVATE'",
    })
    .default('PUBLIC'),
}).refine(
  (data) => data.content || data.imageUrl,
  {
    message: 'Post must have either content or an image',
    path: ['content'],
  }
);

export type CreatePostInput = z.infer<typeof createPostSchema>;
