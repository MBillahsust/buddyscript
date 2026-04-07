"use client"

import { useEffect, useRef } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { PostCard } from "./PostCard"

type PostAuthor = { id: string; firstName: string; lastName: string; avatarUrl: string | null }
type Post = {
  id: string
  content: string
  imageUrl: string | null
  visibility: string
  createdAt: string
  author: PostAuthor
  _count: { likes: number; comments: number }
  likedByMe?: boolean
}
type PostsPage = { posts: Post[]; nextCursor: string | null }

async function fetchPosts({ pageParam }: { pageParam: string | null }): Promise<PostsPage> {
  const url = pageParam ? `/api/posts?cursor=${pageParam}` : "/api/posts"
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch posts")
  return res.json()
}

export function PostFeed() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (status === "pending") {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
        Loading posts...
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="alert alert-danger" role="alert">
        Failed to load posts.
      </div>
    )
  }

  const allPosts = data.pages.flatMap((p) => p.posts)

  if (allPosts.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
        No posts yet. Be the first to post!
      </div>
    )
  }

  return (
    <>
      {allPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      <div ref={sentinelRef} style={{ height: 1 }} />
      {isFetchingNextPage && (
        <div style={{ textAlign: "center", padding: "16px", color: "#666" }}>
          Loading more...
        </div>
      )}
      {!hasNextPage && allPosts.length > 0 && (
        <div style={{ textAlign: "center", padding: "16px", color: "#aaa", fontSize: 13 }}>
          You&apos;re all caught up!
        </div>
      )}
    </>
  )
}
