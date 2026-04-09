"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { CommentDto } from "@/features/feed/types/comments"

export function useDeleteReply(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (replyId: string) => {
      const response = await fetch(`/api/replies/${replyId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "Failed to delete reply")
      }

      return replyId
    },
    onMutate: async (replyId: string) => {
      const prev = queryClient.getQueryData<CommentDto[]>(["post-comments", postId])
      if (!prev) return { prev }

      queryClient.setQueryData<CommentDto[]>(
        ["post-comments", postId],
        prev.map((comment) => ({
          ...comment,
          replies: comment.replies.filter((reply) => reply.id !== replyId),
        }))
      )

      return { prev }
    },
    onError: (_err, _replyId, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["post-comments", postId], ctx.prev)
      }
    },
  })
}
