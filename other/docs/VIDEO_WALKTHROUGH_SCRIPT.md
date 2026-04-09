# BuddyScript Video Walkthrough Script (Appifylab Submission)

Use this script as a read-and-record guide for your YouTube walkthrough (unlisted/private).

## 0) Pre-Recording Checklist

1. Start app from workspace root:
   - `npm run dev`
2. Ensure DB and Redis are reachable.
3. Keep two browser accounts ready:
   - User A (author)
   - User B (another user)
4. Open tabs before recording:
   - App at `http://localhost:3000`
   - Repo root
   - `README.md`
5. Use 1080p recording and increase browser zoom to 110% if text looks small.

## 1) Intro (00:00 - 00:30)

Say:

"Hi, I am presenting BuddyScript, my submission for the Appifylab Full Stack Engineer task. This is a Next.js full-stack social feed app with authentication, protected feed, public/private posts, likes, comments, replies, and performance plus security improvements. I will show the required features first, then architecture and engineering decisions."

## 2) Requirement Recap (00:30 - 01:00)

Say:

"The assignment required converting the provided Login, Register, and Feed design into a React or Next.js application, implementing secure auth, protected feed, create post with text and image, like/unlike for posts/comments/replies, showing who liked each item, and private/public post visibility."

## 3) Project Structure (01:00 - 01:40)

Show root folders.

Say:

"I refactored the codebase into clear domains: frontend, backend, database, and other. The active application is in the frontend folder. Prisma schema and migrations are in database/prisma. I also modularized feed logic under frontend/src/features/feed for cleaner architecture and maintainability."

## 4) Authentication Flow (01:40 - 03:10)

### 4.1 Registration

1. Open Register page.
2. Fill first name, last name, email, password.
3. Submit.

Say:

"Registration includes the required fields: first name, last name, email, and password. Inputs are validated and password storage is secured with hashing."

### 4.2 Login

1. Go to Login page.
2. Log in as User A.

Say:

"After login, users are authorized into the protected feed route. Unauthenticated access to feed is blocked by middleware and server-side checks."

## 5) Feed Core Features (03:10 - 06:30)

### 5.1 Create Public Post

1. In composer, type text.
2. Optionally upload an image.
3. Keep visibility Public.
4. Post.

Say:

"Users can create text and image posts. The post appears instantly with optimistic update, then remains synchronized with server state."

### 5.2 Create Private Post

1. Toggle visibility to Private.
2. Create post.

Say:

"Private posts are visible only to the author. Public posts are visible to all authenticated users."

### 5.3 Newest First Ordering

1. Refresh feed.
2. Point to latest post at top.

Say:

"Posts are sorted newest first using database order by createdAt descending and cursor pagination."

## 6) Interactions: Likes, Comments, Replies (06:30 - 09:30)

### 6.1 Post Like/Unlike + Likers Modal

1. Like a post.
2. Unlike it.
3. Open likers modal.

Say:

"Like and unlike state is consistent and optimistic. The likers modal shows exactly who liked the post."

### 6.2 Comments

1. Open comment section.
2. Add a comment.
3. Like/unlike the comment.
4. Open comment likers modal.

Say:

"Comments are fully supported with like/unlike and who-liked visibility."

### 6.3 Replies

1. Reply to a comment.
2. Like/unlike reply.
3. Open reply likers modal.

Say:

"Replies are nested under comments and include the same interaction model."

## 7) Private/Public Visibility Proof (Two Users) (09:30 - 10:45)

1. Keep User A session showing private post exists.
2. Open another browser/incognito as User B.
3. Log in as User B.
4. Show public posts visible.
5. Show User A private post not visible.

Say:

"This confirms authorization logic: private content is author-only while public content is globally visible to authenticated users."

## 8) Security Highlights (10:45 - 11:45)

Show README security section quickly.

Say:

"Security was a top priority. I implemented input validation, password hashing, API authorization checks, rate limiting, security-focused headers, and structured security event logging. Sensitive internal failures return safe user messages while detailed diagnostics stay in logs."

## 9) Performance and Scalability Highlights (11:45 - 13:00)

Show README performance section and mention real optimizations.

Say:

"For performance and scale, I implemented cursor pagination, Redis feed caching with invalidation, optimized React Query cache behavior, optimistic updates, Cloudinary image transformation and lazy decoding, selective dynamic imports, and database composite indexes for feed-heavy access patterns. I also added performance telemetry to track API timings and cache hit/miss behavior."

## 10) Database + Prisma (13:00 - 13:40)

Say:

"Database design follows normalized relational modeling with Prisma. The schema includes User, Post, Comment, Reply, and polymorphic Like relationships with indexes aligned to high-read feed queries. Migrations are tracked in database/prisma/migrations."

Optional quick command demo:

- `npm run prisma:migrate`

## 11) API Overview (13:40 - 14:20)

Say:

"API routes are implemented in Next.js route handlers under frontend/src/app/api, including auth signup, posts, comments, replies, like endpoints, upload signature generation, and Redis health checks."

## 12) Conclusion (14:20 - 15:00)

Say:

"To summarize, this submission meets all required Appifylab features with a production-minded architecture focused on security, UX responsiveness, and scalability. The repository includes detailed documentation, modularized structure, and clear setup instructions. Thank you for reviewing."

## 13) Suggested Final Video Description (Copy-Paste)

Title:

`BuddyScript - Appifylab Full Stack Engineer Task Walkthrough`

Description:

`This video demonstrates my Appifylab assignment submission: secure auth, protected feed, public/private posts, likes, comments, replies, likers list, and performance/security/scalability improvements. Repo and documentation are included in the submission package.`

## 14) Recording Tips (Quick)

1. Keep cursor steady; zoom browser to keep text readable.
2. Avoid long dead time between actions.
3. If any route loads slowly, narrate what is expected while it loads.
4. End by showing README and project structure one last time.
