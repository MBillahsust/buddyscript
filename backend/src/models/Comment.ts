import { Schema, model } from 'mongoose';

const CommentSchema = new Schema(
  {
    post:         { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    author:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content:      { type: String, required: true, maxlength: 2000 },
    likesCount:   { type: Number, default: 0 },
    repliesCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Paginated comments per post
CommentSchema.index({ post: 1, createdAt: -1 });

export const Comment = model('Comment', CommentSchema);
