import { Schema, model } from 'mongoose';

const UserSchema = new Schema(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    firstName:    { type: String, required: true, trim: true },
    lastName:     { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    avatarUrl:    { type: String, default: null },
  },
  { timestamps: true },
);

export const User = model('User', UserSchema);
