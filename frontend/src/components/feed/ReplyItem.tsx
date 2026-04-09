"use client"

import { useLikeReply, useDeleteReply } from "@/features/feed/hooks"
import { timeAgo } from "@/lib/utils"
import type { ReplyDto } from "@/features/feed/types"
import { useState } from "react"
import { UserAvatar } from "@/components/ui/UserAvatar"
import { LikersModal } from "./LikersModal"
import toast from "react-hot-toast"

type ReplyItemProps = {
  postId: string
  reply: ReplyDto
  currentUserId?: string
}

export function ReplyItem({ postId, reply, currentUserId }: ReplyItemProps) {
  const [likersOpen, setLikersOpen] = useState(false)
  const likeReply = useLikeReply(postId)
  const deleteReply = useDeleteReply(postId)
  const isOwnReply = currentUserId === reply.author.id

  async function handleDeleteReply() {
    if (!confirm("Delete this reply?")) return

    try {
      await deleteReply.mutateAsync(reply.id)
      toast.success("Reply deleted")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete reply")
    }
  }

  return (
    <div className="d-flex gap-2 mt-2" style={{ marginLeft: 36 }}>
      <UserAvatar
        avatarUrl={reply.author.avatarUrl}
        firstName={reply.author.firstName}
        lastName={reply.author.lastName}
        alt={`${reply.author.firstName} ${reply.author.lastName}`}
        style={{ width: 28, height: 28, fontSize: 11 }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ background: "#f5f5f5", borderRadius: 12, padding: "8px 12px" }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>
            {reply.author.firstName} {reply.author.lastName}
          </div>
          <div style={{ fontSize: 14 }}>{reply.content}</div>
        </div>
        <div className="d-flex align-items-center gap-3 mt-1" style={{ fontSize: 12, color: "#666" }}>
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none"
            onClick={() => likeReply.mutate(reply.id)}
            style={{ fontSize: 12 }}
          >
            {reply.likedByMe ? "Unlike" : "Like"}
          </button>
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none"
            onClick={() => setLikersOpen(true)}
            style={{ fontSize: 12 }}
          >
            {reply.likeCount} {reply.likeCount === 1 ? "like" : "likes"}
          </button>
          {isOwnReply && (
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none"
              onClick={handleDeleteReply}
              disabled={deleteReply.isPending}
              style={{ fontSize: 12 }}
            >
              {deleteReply.isPending ? "Deleting..." : "Delete"}
            </button>
          )}
          <span>{timeAgo(reply.createdAt)}</span>
        </div>
      </div>

      <LikersModal
        open={likersOpen}
        onClose={() => setLikersOpen(false)}
        title="Likes"
        queryKey={["reply-likers", reply.id]}
        endpoint={`/api/replies/${reply.id}/likes`}
      />
    </div>
  )
}
