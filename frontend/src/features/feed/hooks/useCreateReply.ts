"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { CommentDto, ReplyDto } from "@/features/feed/types/comments"

export function useCreateReply(postId: string, commentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch("/api/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, content }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "Failed to create reply")
      }

      return response.json()
    },
    onSuccess: (createdReply: ReplyDto) => {
      queryClient.setQueryData<CommentDto[]>(["post-comments", postId], (current = []) =>
        current.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                replies: [...comment.replies, createdReply],
              }
            : comment
        )
      )
    },
  })
}
