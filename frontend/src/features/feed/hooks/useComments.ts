"use client"

import { useQuery } from "@tanstack/react-query"
import type { CommentDto } from "@/features/feed/types/comments"

async function fetchComments(postId: string): Promise<CommentDto[]> {
  const response = await fetch(`/api/posts/${postId}/comments`)
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.error ?? "Failed to fetch comments")
  }

  const data = await response.json()
  return data.comments ?? []
}

export function useComments(postId: string, enabled = true) {
  return useQuery({
    queryKey: ["post-comments", postId],
    queryFn: () => fetchComments(postId),
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  })
}
