import { Schema, model } from 'mongoose';

const LikeSchema = new Schema(
  {
    user:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    post:    { type: Schema.Types.ObjectId, ref: 'Post', default: null },
    comment: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    reply:   { type: Schema.Types.ObjectId, ref: 'Reply', default: null },
  },
  { timestamps: true },
);

// Prevent duplicate likes — one like per user per target
LikeSchema.index({ user: 1, post: 1 },    { unique: true, sparse: true });
LikeSchema.index({ user: 1, comment: 1 }, { unique: true, sparse: true });
LikeSchema.index({ user: 1, reply: 1 },   { unique: true, sparse: true });

// "Who liked this?" queries (LikesModal)
LikeSchema.index({ post: 1 });
LikeSchema.index({ comment: 1 });
LikeSchema.index({ reply: 1 });

export const Like = model('Like', LikeSchema);
