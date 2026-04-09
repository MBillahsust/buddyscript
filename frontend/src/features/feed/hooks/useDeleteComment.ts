"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { CommentDto } from "@/features/feed/types/comments"

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "Failed to delete comment")
      }

      return commentId
    },
    onMutate: async (commentId: string) => {
      const prev = queryClient.getQueryData<CommentDto[]>(["post-comments", postId])
      if (!prev) return { prev }

      queryClient.setQueryData<CommentDto[]>(
        ["post-comments", postId],
        prev.filter((comment) => comment.id !== commentId)
      )

      return { prev }
    },
    onError: (_err, _commentId, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["post-comments", postId], ctx.prev)
      }
    },
  })
}
