"use client"

import { useState } from "react"
import { useLikeComment, useCreateReply, useDeleteComment } from "@/features/feed/hooks"
import { timeAgo } from "@/lib/utils"
import type { CommentDto } from "@/features/feed/types"
import { UserAvatar } from "@/components/ui/UserAvatar"
import { ReplyItem } from "./ReplyItem"
import { LikersModal } from "./LikersModal"
import toast from "react-hot-toast"

type CommentItemProps = {
  postId: string
  comment: CommentDto
  currentUserId?: string
}

export function CommentItem({ postId, comment, currentUserId }: CommentItemProps) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [likersOpen, setLikersOpen] = useState(false)

  const likeComment = useLikeComment(postId)
  const createReply = useCreateReply(postId, comment.id)
  const deleteComment = useDeleteComment(postId)
  const isOwnComment = currentUserId === comment.author.id

  async function handleReplySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const value = replyContent.trim()
    if (!value) return

    await createReply.mutateAsync(value)
    setReplyContent("")
    setReplyOpen(false)
  }

  async function handleDeleteComment() {
    if (!confirm("Delete this comment?")) return

    try {
      await deleteComment.mutateAsync(comment.id)
      toast.success("Comment deleted")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete comment")
    }
  }

  return (
    <div className="mt-3">
      <div className="d-flex gap-2">
        <UserAvatar
          avatarUrl={comment.author.avatarUrl}
          firstName={comment.author.firstName}
          lastName={comment.author.lastName}
          alt={`${comment.author.firstName} ${comment.author.lastName}`}
          style={{ width: 34, height: 34, fontSize: 13 }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ background: "#f5f5f5", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              {comment.author.firstName} {comment.author.lastName}
            </div>
            <div style={{ fontSize: 14 }}>{comment.content}</div>
          </div>

          <div className="d-flex align-items-center gap-3 mt-1" style={{ fontSize: 12, color: "#666" }}>
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none"
              onClick={() => likeComment.mutate(comment.id)}
              style={{ fontSize: 12 }}
            >
              {comment.likedByMe ? "Unlike" : "Like"}
            </button>
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none"
              onClick={() => setReplyOpen((v) => !v)}
              style={{ fontSize: 12 }}
            >
              Reply
            </button>
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none"
              onClick={() => setLikersOpen(true)}
              style={{ fontSize: 12 }}
            >
              {comment.likeCount} {comment.likeCount === 1 ? "like" : "likes"}
            </button>
            {isOwnComment && (
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none"
                onClick={handleDeleteComment}
                disabled={deleteComment.isPending}
                style={{ fontSize: 12 }}
              >
                {deleteComment.isPending ? "Deleting..." : "Delete"}
              </button>
            )}
            <span>{timeAgo(comment.createdAt)}</span>
          </div>

          {replyOpen && (
            <form className="mt-2" onSubmit={handleReplySubmit}>
              <div className="d-flex gap-2">
                <input
                  className="form-control"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                />
                <button className="btn btn-primary" type="submit" disabled={createReply.isPending}>
                  {createReply.isPending ? "Posting..." : "Reply"}
                </button>
              </div>
            </form>
          )}

          {comment.replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              postId={postId}
              reply={reply}
              currentUserId={currentUserId}
            />
          ))}

          <LikersModal
            open={likersOpen}
            onClose={() => setLikersOpen(false)}
            title="Likes"
            queryKey={["comment-likers", comment.id]}
            endpoint={`/api/comments/${comment.id}/likes`}
          />
        </div>
      </div>
    </div>
  )
}
