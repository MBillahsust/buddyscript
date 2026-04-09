import { Types } from 'mongoose';
import { Comment } from '@models/Comment';
import { Post } from '@models/Post';
import { Reply } from '@models/Reply';
import { Like } from '@models/Like';
import { AppError } from '@utils/errors';
import type { LeanAuthor } from '../types/lean';

const DEFAULT_LIMIT = 20;

interface LeanComment {
  _id: Types.ObjectId;
  content: string;
  likesCount: number;
  repliesCount: number;
  author: LeanAuthor;
  post: Types.ObjectId;
  createdAt: Date;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const shapeComment = (comment: LeanComment, likedIds: Set<string>) => ({
  id:           comment._id.toString(),
  content:      comment.content,
  likesCount:   comment.likesCount,
  repliesCount: comment.repliesCount,
  userLiked:    likedIds.has(comment._id.toString()),
  author: {
    id:        comment.author._id.toString(),
    firstName: comment.author.firstName,
    lastName:  comment.author.lastName,
    avatarUrl: comment.author.avatarUrl ?? null,
  },
  createdAt: comment.createdAt.toISOString(),
});

// ── Service ────────────────────────────────────────────────────────────────

/** Paginated comments for a post, newest first. */
const getComments = async (postId: string, userId: string, cursor?: string, limit = DEFAULT_LIMIT) => {
  const filter: Record<string, unknown> = { post: new Types.ObjectId(postId) };
  if (cursor) filter['createdAt'] = { $lt: new Date(cursor) };

  const comments = await Comment
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .populate<{ author: LeanAuthor }>('author', 'firstName lastName avatarUrl')
    .lean<LeanComment[]>();

  const hasMore = comments.length > limit;
  if (hasMore) comments.pop();

  const lastComment = comments[comments.length - 1];
  const nextCursor = hasMore && lastComment ? lastComment.createdAt.toISOString() : null;

  // Batch-fetch current user's likes for this page
  const commentIds = comments.map(c => c._id);
  const userLikes = await Like
    .find({ user: userId, comment: { $in: commentIds } })
    .select('comment')
    .lean<{ comment: Types.ObjectId }[]>();
  const likedIds = new Set(userLikes.map(l => l.comment.toString()));

  return {
    comments: comments.map(c => shapeComment(c, likedIds)),
    nextCursor,
    hasMore,
  };
};

/** Create a comment on a post; increments the post's commentsCount. */
const createComment = async (postId: string, authorId: string, content: string) => {
  const post = await Post.findById(postId);
  if (!post) throw AppError.forbidden('Not authorized to perform this action');

  const [comment] = await Promise.all([
    Comment.create({ post: new Types.ObjectId(postId), author: new Types.ObjectId(authorId), content }),
    Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } }),
  ]);

  await comment.populate<{ author: LeanAuthor }>('author', 'firstName lastName avatarUrl');

  return shapeComment(comment.toObject() as unknown as LeanComment, new Set<string>());
};

/**
 * Delete a comment — author only.
 * Cascades: deletes all replies and their likes, then the comment's own likes.
 * Decrements commentsCount on the parent post.
 */
const deleteComment = async (commentId: string, userId: string): Promise<void> => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw AppError.forbidden('Not authorized to perform this action');
  if (comment.author.toString() !== userId) throw AppError.forbidden('Not the author of this comment');

  const replies = await Reply.find({ comment: commentId }).select('_id').lean<{ _id: Types.ObjectId }[]>();
  const replyIds = replies.map(r => r._id);

  await Promise.all([
    Reply.deleteMany({ comment: commentId }),
    Like.deleteMany({ reply: { $in: replyIds } }),
    Like.deleteMany({ comment: commentId }),
    Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } }),
    comment.deleteOne(),
  ]);
};

export const CommentService = { getComments, createComment, deleteComment };
