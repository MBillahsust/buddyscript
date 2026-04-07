import { z } from "zod"

export const signupSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }).max(50),
  lastName: z.string().min(1, { message: "Last name is required" }).max(50),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
})

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
})

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, { message: "Post cannot be empty" })
    .max(5000, { message: "Post is too long" }),
  imageUrl: z.string().url().optional().nullable(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
})

export const createCommentSchema = z.object({
  postId: z.string().cuid({ message: "Invalid post ID" }),
  content: z
    .string()
    .min(1, { message: "Comment cannot be empty" })
    .max(2000),
})

export const createReplySchema = z.object({
  commentId: z.string().cuid({ message: "Invalid comment ID" }),
  content: z
    .string()
    .min(1, { message: "Reply cannot be empty" })
    .max(2000),
})
