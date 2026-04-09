"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { CommentDto } from "@/features/feed/types/comments"

type PostsCache = {
  pages: Array<{
    posts: Array<{
      id: string
      _count: { likes: number; comments: number }
    }>
    nextCursor: string | null
  }>
  pageParams: Array<string | null>
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "Failed to create comment")
      }

      return response.json()
    },
    onSuccess: (createdComment: CommentDto) => {
      queryClient.setQueryData<CommentDto[]>(["post-comments", postId], (current = []) => [
        ...current,
        createdComment,
      ])

      queryClient.setQueryData<PostsCache>(["posts"], (current) => {
        if (!current) return current
        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            posts: page.posts.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    _count: {
                      ...post._count,
                      comments: post._count.comments + 1,
                    },
                  }
                : post
            ),
          })),
        }
      })
    },
  })
}
