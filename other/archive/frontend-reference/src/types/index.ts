export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

export interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  likesCount: number;
  commentsCount: number;
  userLiked: boolean;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  likesCount: number;
  userLiked: boolean;
  repliesCount: number;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  createdAt: string;
}

export interface Reply {
  id: string;
  content: string;
  likesCount: number;
  userLiked: boolean;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  createdAt: string;
}

export interface LikeUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface FeedResponse {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CommentsResponse {
  comments: Comment[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface RepliesResponse {
  replies: Reply[];
}

export interface LikersResponse {
  likers: LikeUser[];
  nextCursor: string | null;
}

export type LikeTarget = 'post' | 'comment' | 'reply';
