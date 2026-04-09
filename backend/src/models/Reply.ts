import { Schema, model } from 'mongoose';

const ReplySchema = new Schema(
  {
    comment:    { type: Schema.Types.ObjectId, ref: 'Comment', required: true },
    author:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content:    { type: String, required: true, maxlength: 2000 },
    likesCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Paginated replies per comment
ReplySchema.index({ comment: 1, createdAt: -1 });

export const Reply = model('Reply', ReplySchema);
