import { Schema, model } from 'mongoose';

const PostSchema = new Schema(
  {
    author:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content:       { type: String, required: false, maxlength: 5000, default: null },
    imageUrl:      { type: String, default: null },
    visibility:    { type: String, enum: ['PUBLIC', 'PRIVATE'], default: 'PUBLIC' },
    likesCount:    { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Feed query: filter by visibility + cursor on createdAt
PostSchema.index({ visibility: 1, createdAt: -1 });

// Author's own posts (private feed, profile page)
PostSchema.index({ author: 1, createdAt: -1 });

export const Post = model('Post', PostSchema);
