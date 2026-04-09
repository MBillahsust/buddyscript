"use client"

import dynamic from "next/dynamic"
import { memo, useState } from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { LikeButton } from "./LikeButton"
import { UserAvatar } from "@/components/ui/UserAvatar"

const LikedByModal = dynamic(() => import("./LikedByModal").then((mod) => mod.LikedByModal), {
  loading: () => null,
})

const CommentSection = dynamic(() => import("./CommentSection").then((mod) => mod.CommentSection), {
  loading: () => null,
})

type PostAuthor = {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
}

type PostData = {
  id: string
  content: string
  imageUrl: string | null
  visibility: string
  createdAt: string
  author: PostAuthor
  _count: { likes: number; comments: number }
  likedByMe?: boolean
  recentLikers?: PostAuthor[]
}

function getOptimizedCloudinaryUrl(imageUrl: string) {
  if (!imageUrl.includes("res.cloudinary.com")) return imageUrl

  const marker = "/upload/"
  const markerIndex = imageUrl.indexOf(marker)
  if (markerIndex === -1) return imageUrl

  const transform = "f_auto,q_auto:good,w_1200,c_limit"
  return `${imageUrl.slice(0, markerIndex + marker.length)}${transform}/${imageUrl.slice(markerIndex + marker.length)}`
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
}

function PostCardImpl({ post }: { post: PostData }) {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [likersOpen, setLikersOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)

  const authorName = `${post.author.firstName} ${post.author.lastName}`
  const isOwn = session?.user?.id === post.author.id
  const recentLikers = post.recentLikers ?? []

  function handleMenuPlaceholder() {
    setMenuOpen(false)
  }

  async function handleDelete() {
    if (!confirm("Delete this post?")) return
    setMenuOpen(false)
    setDeleting(true)
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" })
    if (res.ok) {
      qc.invalidateQueries({ queryKey: ["posts"] })
      toast.success("Post deleted")
    } else {
      toast.error("Failed to delete")
      setDeleting(false)
    }
  }

  return (
    <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
      <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
        {/* Post header */}
        <div className="_feed_inner_timeline_post_top">
          <div className="_feed_inner_timeline_post_box">
            <div className="_feed_inner_timeline_post_box_image">
              <UserAvatar
                avatarUrl={post.author.avatarUrl}
                firstName={post.author.firstName}
                lastName={post.author.lastName}
                alt={authorName}
                className="_post_img"
                size={44}
              />
            </div>
            <div className="_feed_inner_timeline_post_box_txt">
              <h4 className="_feed_inner_timeline_post_box_title">{authorName}</h4>
              <p className="_feed_inner_timeline_post_box_para">
                {timeAgo(post.createdAt)} . <a href="#0">{post.visibility === "PUBLIC" ? "Public" : "Private"}</a>
              </p>
            </div>
          </div>

          {/* 3-dot menu */}
          <div className="_feed_inner_timeline_post_box_dropdown">
            <div className="_feed_timeline_post_dropdown">
              <button
                className="_feed_timeline_post_dropdown_link"
                onClick={() => setMenuOpen(o => !o)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="4" height="17" fill="none" viewBox="0 0 4 17">
                  <circle cx="2" cy="2" r="2" fill="#C4C4C4" />
                  <circle cx="2" cy="8" r="2" fill="#C4C4C4" />
                  <circle cx="2" cy="15" r="2" fill="#C4C4C4" />
                </svg>
              </button>
            </div>
            <div className={`_feed_timeline_dropdown _timeline_dropdown${menuOpen ? " show" : ""}`}>
              <ul className="_feed_timeline_dropdown_list">
                <li className="_feed_timeline_dropdown_item">
                  <button
                    type="button"
                    className="_feed_timeline_dropdown_link"
                    style={{ width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                    onClick={handleMenuPlaceholder}
                  >
                    <span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                        <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M14.25 15.75L9 12l-5.25 3.75v-12a1.5 1.5 0 011.5-1.5h7.5a1.5 1.5 0 011.5 1.5v12z"/>
                      </svg>
                    </span>
                    Save Post
                  </button>
                </li>
                {!isOwn && (
                  <li className="_feed_timeline_dropdown_item">
                    <button
                      type="button"
                      className="_feed_timeline_dropdown_link"
                      style={{ width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                      onClick={handleMenuPlaceholder}
                    >
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                          <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M9 16.5a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                          <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M9 5.25v3.75l2.25 1.5" />
                        </svg>
                      </span>
                      Turn On Notification
                    </button>
                  </li>
                )}
                <li className="_feed_timeline_dropdown_item">
                  <button
                    type="button"
                    className="_feed_timeline_dropdown_link"
                    style={{ width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                    onClick={handleMenuPlaceholder}
                  >
                    <span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                        <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M14.25 2.25H3.75a1.5 1.5 0 00-1.5 1.5v10.5a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5V3.75a1.5 1.5 0 00-1.5-1.5zM6.75 6.75l4.5 4.5M11.25 6.75l-4.5 4.5"/>
                      </svg>
                    </span>
                    Hide
                  </button>
                </li>
                {isOwn && (
                  <li className="_feed_timeline_dropdown_item">
                    <button
                      type="button"
                      className="_feed_timeline_dropdown_link"
                      style={{ width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                      onClick={handleMenuPlaceholder}
                    >
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                          <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M12.75 2.25l3 3L6 15l-3.75.75L3 12l9.75-9.75z" />
                        </svg>
                      </span>
                      Edit Post
                    </button>
                  </li>
                )}
                {isOwn && (
                  <li className="_feed_timeline_dropdown_item">
                    <button
                      type="button"
                      className="_feed_timeline_dropdown_link"
                      style={{ width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                          <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M2.25 4.5h13.5M6 4.5V3a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0112 3v1.5m2.25 0V15a1.5 1.5 0 01-1.5 1.5h-7.5a1.5 1.5 0 01-1.5-1.5V4.5h10.5z"/>
                        </svg>
                      </span>
                      {deleting ? "Deleting..." : "Delete Post"}
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Post content */}
        {post.content && (
          <h4 className="_feed_inner_timeline_post_title">{post.content}</h4>
        )}

        {/* Post image */}
        {post.imageUrl && (
          <div className="_feed_inner_timeline_image">
            <img
              src={getOptimizedCloudinaryUrl(post.imageUrl)}
              alt="Post"
              className="_time_img"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}
      </div>

      {/* Reaction counts */}
      <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
        <div className="_feed_inner_timeline_total_reacts_image">
          {post._count.likes > 0 && (
            <>
              {recentLikers.slice(0, 2).map((liker, index) => (
                <UserAvatar
                  key={`${post.id}-${liker.id}`}
                  avatarUrl={liker.avatarUrl}
                  firstName={liker.firstName}
                  lastName={liker.lastName}
                  alt={`${liker.firstName} ${liker.lastName}`}
                  className={index === 0 ? "_react_img1" : "_react_img"}
                  size={32}
                  style={{
                    objectFit: "cover",
                    border: "1px solid var(--bg2)",
                    background: "var(--color3)",
                  }}
                />
              ))}
              <button
                type="button"
                className="_feed_inner_timeline_total_reacts_para btn btn-link p-0 text-decoration-none"
                onClick={() => setLikersOpen(true)}
                style={{ color: "inherit" }}
              >
                {post._count.likes}
              </button>
            </>
          )}
        </div>
        <div className="_feed_inner_timeline_total_reacts_txt">
          <p className="_feed_inner_timeline_total_reacts_para1">
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none"
              onClick={() => setCommentsOpen(true)}
              style={{ color: "inherit" }}
            >
              <span>{post._count.comments}</span> Comment
            </button>
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="_feed_inner_timeline_reaction">
        <LikeButton
          postId={post.id}
          initialLiked={post.likedByMe ?? false}
          initialLikeCount={post._count.likes}
        />
        <button
          type="button"
          className="_feed_inner_timeline_reaction_comment _feed_reaction"
          onClick={() => setCommentsOpen((v) => !v)}
        >
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="none" viewBox="0 0 21 21">
                <path stroke="#000" d="M1 10.5c0-.464 0-.696.009-.893A9 9 0 019.607 1.01C9.804 1 10.036 1 10.5 1v0c.464 0 .696 0 .893.009a9 9 0 018.598 8.598c.009.197.009.429.009.893v6.046c0 1.36 0 2.041-.317 2.535a2 2 0 01-.602.602c-.494.317-1.174.317-2.535.317H10.5c-.464 0-.696 0-.893-.009a9 9 0 01-8.598-8.598C1 11.196 1 10.964 1 10.5v0z"/>
                <path stroke="#000" strokeLinecap="round" strokeLinejoin="round" d="M6.938 9.313h7.125M10.5 14.063h3.563"/>
              </svg>
              {commentsOpen ? "Hide" : "Comment"}
            </span>
          </span>
        </button>
        <button type="button" className="_feed_inner_timeline_reaction_share _feed_reaction">
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="24" height="21" fill="none" viewBox="0 0 24 21">
                <path stroke="#000" strokeLinejoin="round" d="M23 10.5L12.917 1v5.429C3.267 6.429 1 13.258 1 20c2.785-3.52 5.248-5.429 11.917-5.429V20L23 10.5z"/>
              </svg>
              Share
            </span>
          </span>
        </button>
      </div>

      {likersOpen && (
        <LikedByModal
          postId={post.id}
          open={likersOpen}
          onClose={() => setLikersOpen(false)}
        />
      )}

      {commentsOpen && <CommentSection postId={post.id} open={commentsOpen} />}
    </div>
  )
}

export const PostCard = memo(PostCardImpl)
