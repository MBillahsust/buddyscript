import { Types } from 'mongoose';
import { Reply } from '@models/Reply';
import { Comment } from '@models/Comment';
import { Like } from '@models/Like';
import { AppError } from '@utils/errors';
import type { LeanAuthor } from '../types/lean';

const DEFAULT_LIMIT = 20;

interface LeanReply {
  _id: Types.ObjectId;
  content: string;
  likesCount: number;
  author: LeanAuthor;
  comment: Types.ObjectId;
  createdAt: Date;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const shapeReply = (reply: LeanReply, likedIds: Set<string>) => ({
  id:         reply._id.toString(),
  content:    reply.content,
  likesCount: reply.likesCount,
  userLiked:  likedIds.has(reply._id.toString()),
  author: {
    id:        reply.author._id.toString(),
    firstName: reply.author.firstName,
    lastName:  reply.author.lastName,
    avatarUrl: reply.author.avatarUrl ?? null,
  },
  createdAt: reply.createdAt.toISOString(),
});

// ── Service ────────────────────────────────────────────────────────────────

/** Paginated replies for a comment, oldest first (natural thread order). */
const getReplies = async (commentId: string, userId: string, cursor?: string, limit = DEFAULT_LIMIT) => {
  const filter: Record<string, unknown> = { comment: new Types.ObjectId(commentId) };
  if (cursor) filter['createdAt'] = { $gt: new Date(cursor) };

  const replies = await Reply
    .find(filter)
    .sort({ createdAt: 1 })
    .limit(limit + 1)
    .populate<{ author: LeanAuthor }>('author', 'firstName lastName avatarUrl')
    .lean<LeanReply[]>();

  const hasMore = replies.length > limit;
  if (hasMore) replies.pop();

  const lastReply = replies[replies.length - 1];
  const nextCursor = hasMore && lastReply ? lastReply.createdAt.toISOString() : null;

  // Batch-fetch current user's likes for this page
  const replyIds = replies.map(r => r._id);
  const userLikes = await Like
    .find({ user: userId, reply: { $in: replyIds } })
    .select('reply')
    .lean<{ reply: Types.ObjectId }[]>();
  const likedIds = new Set(userLikes.map(l => l.reply.toString()));

  return {
    replies: replies.map(r => shapeReply(r, likedIds)),
    nextCursor,
    hasMore,
  };
};

/** Create a reply on a comment; increments the comment's repliesCount. */
const createReply = async (commentId: string, authorId: string, content: string) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw AppError.forbidden('Not authorized to perform this action');

  const [reply] = await Promise.all([
    Reply.create({ comment: new Types.ObjectId(commentId), author: new Types.ObjectId(authorId), content }),
    Comment.findByIdAndUpdate(commentId, { $inc: { repliesCount: 1 } }),
  ]);

  await reply.populate<{ author: LeanAuthor }>('author', 'firstName lastName avatarUrl');

  return shapeReply(reply.toObject() as unknown as LeanReply, new Set<string>());
};

/** Delete a reply — author only. Decrements repliesCount on parent comment. */
const deleteReply = async (replyId: string, userId: string): Promise<void> => {
  const reply = await Reply.findById(replyId);
  if (!reply) throw AppError.forbidden('Not authorized to perform this action');
  if (reply.author.toString() !== userId) throw AppError.forbidden('Not the author of this reply');

  await Promise.all([
    reply.deleteOne(),
    Like.deleteMany({ reply: replyId }),
    Comment.findByIdAndUpdate(reply.comment, { $inc: { repliesCount: -1 } }),
  ]);
};

export const ReplyService = { getReplies, createReply, deleteReply };
