"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { CommentDto } from "@/features/feed/types/comments"

type LikeResult = { liked: boolean; likeCount: number }

export function useLikeComment(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "Failed to toggle comment like")
      }

      return (await response.json()) as LikeResult
    },
    onMutate: async (commentId: string) => {
      const prev = queryClient.getQueryData<CommentDto[]>(["post-comments", postId])
      if (!prev) return { prev }

      queryClient.setQueryData<CommentDto[]>(
        ["post-comments", postId],
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                likedByMe: !comment.likedByMe,
                likeCount: comment.likedByMe ? Math.max(comment.likeCount - 1, 0) : comment.likeCount + 1,
              }
            : comment
        )
      )

      return { prev }
    },
    onError: (_err, _commentId, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["post-comments", postId], ctx.prev)
      }
    },
    onSuccess: (result, commentId) => {
      queryClient.setQueryData<CommentDto[]>(["post-comments", postId], (current = []) =>
        current.map((comment) =>
          comment.id === commentId
            ? { ...comment, likedByMe: result.liked, likeCount: result.likeCount }
            : comment
        )
      )
    },
  })
}
