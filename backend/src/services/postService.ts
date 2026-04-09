import { Types } from 'mongoose';
import { Post } from '@models/Post';
import { Like } from '@models/Like';
import { AppError } from '@utils/errors';
import type { LeanAuthor } from '../types/lean';

const DEFAULT_LIMIT = 10;

interface LeanPost {
  _id: Types.ObjectId;
  content: string;
  imageUrl: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  likesCount: number;
  commentsCount: number;
  author: LeanAuthor;
  createdAt: Date;
  updatedAt: Date;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const shapePost = (post: LeanPost, likedIds: Set<string>) => ({
  id:            post._id.toString(),
  content:       post.content,
  imageUrl:      post.imageUrl ?? null,
  visibility:    post.visibility,
  likesCount:    post.likesCount,
  commentsCount: post.commentsCount,
  userLiked:     likedIds.has(post._id.toString()),
  author: {
    id:        post.author._id.toString(),
    firstName: post.author.firstName,
    lastName:  post.author.lastName,
    avatarUrl: post.author.avatarUrl ?? null,
  },
  createdAt: post.createdAt.toISOString(),
});

// ── Service ────────────────────────────────────────────────────────────────

/**
 * Cursor-paginated feed.
 * Returns PUBLIC posts + the current user's own PRIVATE posts, newest first.
 */
const getFeed = async (userId: string, cursor?: string, limit = DEFAULT_LIMIT) => {
  const filter: Record<string, unknown> = {
    $or: [
      { visibility: 'PUBLIC' },
      { visibility: 'PRIVATE', author: new Types.ObjectId(userId) },
    ],
  };
  if (cursor) filter['createdAt'] = { $lt: new Date(cursor) };

  const posts = await Post
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .populate<{ author: LeanAuthor }>('author', 'firstName lastName avatarUrl')
    .lean<LeanPost[]>();

  const hasMore = posts.length > limit;
  if (hasMore) posts.pop();

  const lastPost = posts[posts.length - 1];
  const nextCursor = hasMore && lastPost ? lastPost.createdAt.toISOString() : null;

  // Batch-fetch current user's likes for this page (avoids N+1)
  const postIds = posts.map(p => p._id);
  const userLikes = await Like
    .find({ user: userId, post: { $in: postIds } })
    .select('post')
    .lean<{ post: Types.ObjectId }[]>();
  const likedIds = new Set(userLikes.map(l => l.post.toString()));

  return {
    posts: posts.map(p => shapePost(p, likedIds)),
    nextCursor,
    hasMore,
  };
};

/** Create a post. */
const createPost = async (
  authorId: string,
  data: { content?: string | undefined; imageUrl?: string | undefined; visibility?: 'PUBLIC' | 'PRIVATE' | undefined },
) => {
  const post = await Post.create({
    author:     new Types.ObjectId(authorId),
    content:    data.content ?? null,
    imageUrl:   data.imageUrl ?? null,
    visibility: data.visibility ?? 'PUBLIC',
  });

  await post.populate<{ author: LeanAuthor }>('author', 'firstName lastName avatarUrl');

  return shapePost(post.toObject() as unknown as LeanPost, new Set<string>());
};

/** Delete a post — author only. */
const deletePost = async (postId: string, userId: string): Promise<void> => {
  const post = await Post.findById(postId);
  if (!post) throw AppError.forbidden('Not authorized to perform this action');
  if (post.author.toString() !== userId) throw AppError.forbidden('Not the author of this post');
  await post.deleteOne();
};

export const PostService = { getFeed, createPost, deletePost };
