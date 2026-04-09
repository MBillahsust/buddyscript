"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { CommentDto } from "@/features/feed/types/comments"

type LikeResult = { liked: boolean; likeCount: number }

export function useLikeReply(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (replyId: string) => {
      const response = await fetch(`/api/replies/${replyId}/like`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "Failed to toggle reply like")
      }

      return (await response.json()) as LikeResult
    },
    onMutate: async (replyId: string) => {
      const prev = queryClient.getQueryData<CommentDto[]>(["post-comments", postId])
      if (!prev) return { prev }

      queryClient.setQueryData<CommentDto[]>(
        ["post-comments", postId],
        prev.map((comment) => ({
          ...comment,
          replies: comment.replies.map((reply) =>
            reply.id === replyId
              ? {
                  ...reply,
                  likedByMe: !reply.likedByMe,
                  likeCount: reply.likedByMe ? Math.max(reply.likeCount - 1, 0) : reply.likeCount + 1,
                }
              : reply
          ),
        }))
      )

      return { prev }
    },
    onError: (_err, _replyId, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["post-comments", postId], ctx.prev)
      }
    },
    onSuccess: (result, replyId) => {
      queryClient.setQueryData<CommentDto[]>(["post-comments", postId], (current = []) =>
        current.map((comment) => ({
          ...comment,
          replies: comment.replies.map((reply) =>
            reply.id === replyId
              ? { ...reply, likedByMe: result.liked, likeCount: result.likeCount }
              : reply
          ),
        }))
      )
    },
  })
}
