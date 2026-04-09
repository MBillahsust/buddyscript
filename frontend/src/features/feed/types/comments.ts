export type ReplyDto = {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
  }
  likedByMe: boolean
  likeCount: number
}

export type CommentDto = {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
  }
  likedByMe: boolean
  likeCount: number
  replies: ReplyDto[]
}
