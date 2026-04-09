import type { Metadata } from "next"
import { FeedStories } from "@/components/feed/FeedStories"
import { PostComposer } from "@/components/feed/PostComposer"
import { PostFeed } from "@/components/feed/PostFeed"

export const metadata: Metadata = { title: "Feed — Buddy Script" }

export default function FeedPage() {
  return (
    <>
      <FeedStories />
      <PostComposer />
      <PostFeed />
    </>
  )
}
