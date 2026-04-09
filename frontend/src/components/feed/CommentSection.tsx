"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import { useComments, useCreateComment } from "@/features/feed/hooks"
import { UserAvatar } from "@/components/ui/UserAvatar"
import { CommentItem } from "./CommentItem"

type CommentSectionProps = {
  postId: string
  open: boolean
}

export function CommentSection({ postId, open }: CommentSectionProps) {
  const { data: session } = useSession()
  const [newComment, setNewComment] = useState("")
  const { data: comments = [], isPending, isError } = useComments(postId, open)
  const createComment = useCreateComment(postId)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const content = newComment.trim()
    if (!content) return

    try {
      await createComment.mutateAsync(content)
      setNewComment("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create comment")
    }
  }

  if (!open) return null

  return (
    <div className="_feed_inner_timeline_cooment_area">
      <div className="_feed_inner_comment_box">
        <form className="_feed_inner_comment_box_form" onSubmit={handleSubmit}>
          <div className="_feed_inner_comment_box_content">
            <div className="_feed_inner_comment_box_content_image">
              <UserAvatar
                avatarUrl={session?.user?.image}
                name={session?.user?.name}
                alt="Profile"
                className="_comment_img"
                size={26}
              />
            </div>
            <div className="_feed_inner_comment_box_content_txt" style={{ width: "100%" }}>
              <textarea
                className="form-control _comment_textarea"
                placeholder="Write a comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
            </div>
            <button className="_feed_inner_text_area_btn_link" type="submit" disabled={createComment.isPending}>
              {createComment.isPending ? "Posting..." : "Comment"}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-3">
        {isPending && <p style={{ color: "#666" }}>Loading comments...</p>}
        {isError && <p style={{ color: "#dc3545" }}>Failed to load comments.</p>}
        {!isPending && !isError && comments.length === 0 && (
          <p style={{ color: "#666" }}>No comments yet.</p>
        )}
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            postId={postId}
            comment={comment}
            currentUserId={session?.user?.id}
          />
        ))}
      </div>
    </div>
  )
}
