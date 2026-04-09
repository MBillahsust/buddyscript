import { Types } from 'mongoose';

export interface LeanAuthor {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface LeanLikeUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface LeanLike {
  _id: Types.ObjectId;
  user: LeanLikeUser;
  createdAt: Date;
}
