-- Phase 2 performance indexes for feed reads and recent-like lookups
CREATE INDEX IF NOT EXISTS "Post_visibility_createdAt_idx"
ON "Post"("visibility", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Post_authorId_visibility_createdAt_idx"
ON "Post"("authorId", "visibility", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Like_postId_createdAt_idx"
ON "Like"("postId", "createdAt" DESC);
