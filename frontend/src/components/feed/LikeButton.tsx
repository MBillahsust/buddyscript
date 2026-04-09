"use client"

import { useLikePost } from "@/features/feed/hooks"

type LikeButtonProps = {
  postId: string
  initialLiked: boolean
  initialLikeCount: number
}

export function LikeButton({ postId, initialLiked, initialLikeCount }: LikeButtonProps) {
  const { liked, isPending, toggleLike } = useLikePost(postId, initialLiked, initialLikeCount)

  return (
    <button
      type="button"
      className={`_feed_inner_timeline_reaction_emoji _feed_reaction${liked ? " _feed_reaction_active" : ""}`}
      onClick={toggleLike}
      disabled={isPending}
      aria-label={liked ? "Unlike" : "Like"}
    >
      <span className="_feed_inner_timeline_reaction_link">
        <span style={{ display: "inline-flex", color: liked ? "#1890FF" : "#666" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path
              d="M7 10v10M14 10l2-6a2 2 0 00-2-2h-1l-3 6v12h8a2 2 0 001.94-1.51l1.5-6A2 2 0 0019.5 10H14zM7 10H4a1 1 0 00-1 1v8a1 1 0 001 1h3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
    </button>
  )
}
