"use client"

import { useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { UserAvatar } from "@/components/ui/UserAvatar"

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
  recentLikers?: PostAuthor[]
}
type PostsPage = { posts: Post[]; nextCursor: string | null }

export function PostComposer() {
  const MAX_UPLOAD_SIZE = 5 * 1024 * 1024
  const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"])

  const { data: session } = useSession()
  const qc = useQueryClient()
  const [content, setContent] = useState("")
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.has(file.type)) {
      toast.error("Only JPG, PNG, and WEBP images are allowed")
      if (fileRef.current) fileRef.current.value = ""
      return
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      toast.error("Image must be 5MB or smaller")
      if (fileRef.current) fileRef.current.value = ""
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function uploadImage(file: File): Promise<string> {
    const sigRes = await fetch("/api/upload-signature")
    if (!sigRes.ok) {
      let message = "Failed to prepare image upload"
      try {
        const data = await sigRes.json()
        if (data?.error) {
          message = data.error
        }
      } catch {
        // keep default message when response is not JSON
      }
      throw new Error(message)
    }
    const { timestamp, signature, apiKey, cloudName, folder, allowedFormats } = await sigRes.json()

    const fd = new FormData()
    fd.append("file", file)
    fd.append("timestamp", String(timestamp))
    fd.append("signature", signature)
    fd.append("api_key", apiKey)
    fd.append("folder", folder)
    fd.append("allowed_formats", allowedFormats)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: fd,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message ?? "Image upload failed")
    return data.secure_url as string
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() && !imageFile) return
    setLoading(true)

    try {
      let imageUrl: string | null = null
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), imageUrl, visibility }),
      })

      if (!res.ok) {
        let message = "Failed to post"
        try {
          const data = await res.json()
          if (data?.error) {
            message = data.error
          }
        } catch {
          // keep default message when response is not JSON
        }
        toast.error(message)
        return
      }

      const createdPost = (await res.json()) as Post

      setContent("")
      setVisibility("PUBLIC")
      setImageFile(null)
      setImagePreview(null)
      if (fileRef.current) fileRef.current.value = ""

      qc.setQueryData(
        ["posts"],
        (old: { pages: PostsPage[]; pageParams: Array<string | null> } | undefined) => {
          if (!old || !old.pages.length) return old

          const [firstPage, ...restPages] = old.pages
          const exists = firstPage.posts.some((post) => post.id === createdPost.id)
          if (exists) return old

          return {
            ...old,
            pages: [
              {
                ...firstPage,
                posts: [createdPost, ...firstPage.posts],
              },
              ...restPages,
            ],
          }
        }
      )

      toast.success("Posted!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="_feed_inner_text_area _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24 _mar_b16" style={{ paddingTop: 28, paddingBottom: 28 }}>
      <form onSubmit={handleSubmit}>
        <div className="_feed_inner_text_area_box" style={{ minHeight: 64 }}>
          <div className="_feed_inner_text_area_box_image">
            <UserAvatar avatarUrl={session?.user?.image} name={session?.user?.name} alt="Profile" className="_txt_img" size={40} />
          </div>
          <div className="_feed_inner_text_area_box_form" style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44 }}>
              <input
                type="text"
                className="form-control"
                placeholder="Write something ..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ border: "none", boxShadow: "none", background: "transparent", paddingLeft: 0, fontSize: 20, lineHeight: "28px" }}
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 23 24">
                <path fill="#666" d="M19.504 19.209c.332 0 .601.289.601.646 0 .326-.226.596-.52.64l-.081.005h-6.276c-.332 0-.602-.289-.602-.645 0-.327.227-.597.52-.64l.082-.006h6.276zM13.4 4.417c1.139-1.223 2.986-1.223 4.125 0l1.182 1.268c1.14 1.223 1.14 3.205 0 4.427L9.82 19.649a2.619 2.619 0 01-1.916.85h-3.64c-.337 0-.61-.298-.6-.66l.09-3.941a3.019 3.019 0 01.794-1.982l8.852-9.5zm-.688 2.562l-7.313 7.85a1.68 1.68 0 00-.441 1.101l-.077 3.278h3.023c.356 0 .698-.133.968-.376l.098-.096 7.35-7.887-3.608-3.87zm3.962-1.65a1.633 1.633 0 00-2.423 0l-.688.737 3.606 3.87.688-.737c.631-.678.666-1.755.105-2.477l-.105-.124-1.183-1.268z" />
              </svg>
            </div>
          </div>
        </div>

        {imagePreview && (
          <div style={{ position: "relative", marginTop: "12px", display: "inline-block" }}>
            <img src={imagePreview} alt="Preview" style={{ maxHeight: 220, borderRadius: 8, maxWidth: "100%" }} />
            <button
              type="button"
              onClick={() => {
                setImageFile(null)
                setImagePreview(null)
                if (fileRef.current) fileRef.current.value = ""
              }}
              style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.65)", color: "#fff", border: "none", borderRadius: "50%", width: 26, height: 26, cursor: "pointer" }}
            >
              ×
            </button>
          </div>
        )}

        <div className="_feed_inner_text_area_bottom" style={{ background: "#eaf0f6", borderRadius: 8, padding: "7px 9px 7px 4px", marginTop: 14, gap: 6 }}>
          <div className="_feed_inner_text_area_item" style={{ alignItems: "center", flex: 1, minWidth: 0, marginRight: 12, marginLeft: -4 }}>
            <div className="_feed_inner_text_area_bottom_photo _feed_common">
              <button type="button" className="_feed_inner_text_area_bottom_photo_link" onClick={() => fileRef.current?.click()} style={{ fontSize: 12, gap: 6, padding: "6px 7px" }}>
                <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#666" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
                    <circle cx="9" cy="10" r="2" />
                    <path d="m21 16-5-5L5 20" />
                  </svg>
                </span>
                Photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
            </div>

            <div className="_feed_inner_text_area_bottom_video _feed_common">
              <button type="button" className="_feed_inner_text_area_bottom_photo_link" style={{ fontSize: 12, gap: 6, padding: "6px 7px" }}>
                <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#666" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="6" width="15" height="12" rx="2" ry="2" />
                    <polygon points="10,10 10,14 14,12" />
                    <path d="M18 10 21 8v8l-3-2" />
                  </svg>
                </span>
                Video
              </button>
            </div>

            <div className="_feed_inner_text_area_bottom_event _feed_common">
              <button type="button" className="_feed_inner_text_area_bottom_photo_link" style={{ fontSize: 12, gap: 6, padding: "6px 7px" }}>
                <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#666" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="16" rx="2" ry="2" />
                    <path d="M16 3v4M8 3v4M3 10h18" />
                  </svg>
                </span>
                Event
              </button>
            </div>

            <div className="_feed_inner_text_area_bottom_article _feed_common" style={{ marginLeft: -8, marginRight: 24 }}>
              <button type="button" className="_feed_inner_text_area_bottom_photo_link" style={{ fontSize: 12, gap: 6, padding: "6px 7px" }}>
                <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#666" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <path d="M14 3v6h6" />
                    <path d="M8 13h8M8 17h5" />
                  </svg>
                </span>
                Article
              </button>
            </div>
          </div>

          <div className="_feed_inner_text_area_btn" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: "auto", paddingLeft: 12 }}>
            <button
              type="button"
              className="_feed_inner_text_area_bottom_photo_link"
              onClick={() => setVisibility((v) => (v === "PUBLIC" ? "PRIVATE" : "PUBLIC"))}
              title={visibility === "PUBLIC" ? "Public" : "Private"}
              style={{ minWidth: 88, justifyContent: "center", fontSize: 12, gap: 5, padding: "6px 8px" }}
            >
              {visibility === "PUBLIC" ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#666" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#666" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
              <span>{visibility === "PUBLIC" ? "Public" : "Private"}</span>
            </button>

            <button
              type="submit"
              className="_feed_inner_text_area_btn_link"
              disabled={loading || (!content.trim() && !imageFile)}
              style={{ minWidth: 112, padding: "9px 14px" }}
            >
              <svg className="_mar_img" xmlns="http://www.w3.org/2000/svg" width="14" height="13" fill="none" viewBox="0 0 14 13">
                <path fill="#fff" fillRule="evenodd" d="M6.37 7.879l2.438 3.955a.335.335 0 00.34.162c.068-.01.23-.05.289-.247l3.049-10.297a.348.348 0 00-.09-.35.341.341 0 00-.34-.088L1.75 4.03a.34.34 0 00-.247.289.343.343 0 00.16.347L5.666 7.17 9.2 3.597a.5.5 0 01.712.703L6.37 7.88zM9.097 13c-.464 0-.89-.236-1.14-.641L5.372 8.165l-4.237-2.65a1.336 1.336 0 01-.622-1.331c.074-.536.441-.96.957-1.112L11.774.054a1.347 1.347 0 011.67 1.682l-3.05 10.296A1.332 1.332 0 019.098 13z" clipRule="evenodd" />
              </svg>
              <span>{loading ? "Posting..." : "Post"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
