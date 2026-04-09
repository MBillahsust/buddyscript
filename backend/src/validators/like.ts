import { z } from 'zod';

export const likeTargetSchema = z.enum(['post', 'comment', 'reply']);
export type LikeTarget = z.infer<typeof likeTargetSchema>;
