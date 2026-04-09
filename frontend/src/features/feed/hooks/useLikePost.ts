"use client"

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { useState } from "react"

type PostsCache = {
  pages: Array<{
    posts: Array<{
      id: string
      likedByMe?: boolean
      _count: { likes: number; comments: number }
    }>
    nextCursor: string | null
  }>
  pageParams: Array<string | null>
}

type LikeResult = {
  liked: boolean
  likeCount: number
}

function updatePostsCache(queryClient: QueryClient, postId: string, liked: boolean, likeCount: number) {
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
                likedByMe: liked,
                _count: {
                  ...post._count,
                  likes: likeCount,
                },
              }
            : post
        ),
      })),
    }
  })
}

export function useLikePost(postId: string, initialLiked = false, initialLikeCount = 0) {
  const queryClient = useQueryClient()
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)

  const mutation = useMutation({
    mutationFn: async (nextLiked: boolean) => {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: nextLiked ? "POST" : "DELETE",
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "Failed to update like")
      }

      return (await response.json()) as LikeResult
    },
    onMutate: async (nextLiked: boolean) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] })

      const previousLiked = liked
      const previousLikeCount = likeCount

      const optimisticCount = nextLiked ? previousLikeCount + 1 : Math.max(previousLikeCount - 1, 0)
      setLiked(nextLiked)
      setLikeCount(optimisticCount)
      updatePostsCache(queryClient, postId, nextLiked, optimisticCount)

      return { previousLiked, previousLikeCount }
    },
    onError: (_error, _nextLiked, context) => {
      if (!context) return
      setLiked(context.previousLiked)
      setLikeCount(context.previousLikeCount)
      updatePostsCache(queryClient, postId, context.previousLiked, context.previousLikeCount)
    },
    onSuccess: (data) => {
      setLiked(data.liked)
      setLikeCount(data.likeCount)
      updatePostsCache(queryClient, postId, data.liked, data.likeCount)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["post-likers", postId] })
    },
  })

  function toggleLike() {
    if (mutation.isPending) return
    mutation.mutate(!liked)
  }

  return {
    liked,
    likeCount,
    isPending: mutation.isPending,
    toggleLike,
  }
}
