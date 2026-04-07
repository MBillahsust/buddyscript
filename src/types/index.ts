export type PostWithDetails = {
  id: string
  content: string
  imageUrl: string | null
  visibility: "PUBLIC" | "PRIVATE"
  createdAt: Date
  author: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
  }
  likes: { userId: string; user: { firstName: string; lastName: string } }[]
  _count: { comments: number; likes: number }
  isLiked?: boolean
}

export type CommentWithDetails = {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
  }
  likes: { userId: string }[]
  replies: ReplyWithDetails[]
  _count: { likes: number; replies: number }
  isLiked?: boolean
}

export type ReplyWithDetails = {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
  }
  likes: { userId: string }[]
  _count: { likes: number }
  isLiked?: boolean
}

export type FeedPage = {
  posts: PostWithDetails[]
  nextCursor: string | null
}
