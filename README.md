# BuddyScript

> Full-stack social feed application — Appifylab Full Stack Engineer Assignment

---

## Links

| | |
|---|---|
| **Live App** | https://buddyscript-mbillahcsesust20-gmailcoms-projects.vercel.app |
| **GitHub** | https://github.com/MBillahsust/buddyscript |

---

## What Was Built

BuddyScript is a production-ready social feed application that converts the provided Login, Register, and Feed HTML/CSS pages into a full Next.js application. Every feature listed in the assignment is implemented, and the provided designs are preserved exactly as given.

### Assignment Requirements — Fulfilled

| Requirement | Status | Notes |
|---|---|---|
| React / Next.js frontend | ✅ | Next.js 16 App Router + React 19 |
| Registration (first name, last name, email, password) | ✅ | `signupSchema` enforces all four fields |
| Secure login | ✅ | NextAuth v5 Credentials provider, bcryptjs hashing |
| Session-based auth with JWT | ✅ | JWT stored in HttpOnly cookie via NextAuth |
| Protected feed route | ✅ | Middleware redirects unauthenticated users |
| Posts from all users, newest first | ✅ | `orderBy: { createdAt: "desc" }`, cursor-paginated |
| Create post with text and/or image | ✅ | Cloudinary upload; text-only or image-only both valid |
| Post like / unlike with correct state | ✅ | Optimistic toggle, per-user like state resolved server-side |
| Comments and replies | ✅ | Two-level threading: post → comment → reply |
| Like / unlike on comments and replies | ✅ | Identical toggle pattern to posts |
| Show who has liked a post / comment / reply | ✅ | "Liked by" modal for every likeable entity |
| Public posts visible to all authenticated users | ✅ | `visibility: PUBLIC` filter in feed query |
| Private posts visible to author only | ✅ | `visibility: PRIVATE` filtered to `authorId === userId` |
| Original design preserved | ✅ | Static HTML in `other/static-html/` is the direct source |

---

## Tech Stack

### Frontend & Runtime
- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **NextAuth v5** — credentials provider, JWT strategy, edge-safe middleware
- **TanStack React Query v5** — server-state management, optimistic updates
- **Zod v4** — schema-first input validation on both client and server
- **date-fns** — timestamp formatting
- **react-hot-toast** — non-blocking user feedback

### Data
- **PostgreSQL** — primary database
- **Prisma v6** — type-safe ORM, migrations, generated client
- **Redis (ioredis)** — rate limiting, feed page caching

### Media
- **Cloudinary** — image upload, transformation, and CDN delivery. Images are uploaded directly from the browser via a signed upload signature issued by the server; the raw API secret never leaves the server.

### Infrastructure
- **Vercel** — deployment, Node.js 22.x runtime
- **Neon / Supabase** (PostgreSQL) + **Upstash** (Redis TLS) — recommended managed services

---

## Architecture

### Repository Structure

```
buddyscript/
├── frontend/                   # Next.js application (UI + API layer)
│   └── src/
│       ├── app/
│       │   ├── (auth)/         # Login and Register pages (route group)
│       │   ├── (main)/feed/    # Protected feed page (route group)
│       │   └── api/            # Thin Next.js route wrappers → re-export backend handlers
│       ├── components/
│       │   ├── auth/           # LoginForm, RegisterForm
│       │   └── feed/           # FeedStories, CommentItem, CommentSection,
│       │                       # LikeButton, LikedByModal
│       ├── features/feed/      # Domain hooks and types (posts, comments, replies, likes)
│       ├── hooks/              # Re-export barrel for feature hooks
│       └── lib/
│           ├── auth.ts         # NextAuth configuration + login brute-force guard
│           ├── auth.config.ts  # Edge-safe auth config (used by middleware)
│           ├── prisma.ts       # Singleton Prisma client
│           ├── redis.ts        # ioredis client (graceful null if unavailable)
│           ├── cloudinary.ts   # Signed upload-signature helper
│           ├── validations.ts  # Zod schemas (signup, login, post, comment, reply)
│           └── security/
│               ├── rate-limit.ts    # Redis-first, in-memory fallback rate limiter
│               ├── feed-cache.ts    # Per-user cursor-keyed Redis cache
│               ├── audit.ts         # Structured security event logger
│               └── performance.ts   # Structured performance event logger
├── backend/src/api/            # Real API handler implementations
│   ├── auth/signup/
│   ├── posts/ + posts/[id]/{like,likes,comments}
│   ├── comments/ + comments/[commentId]/{like,likes}
│   ├── replies/ + replies/[replyId]/{like,likes}
│   ├── upload-signature/
│   └── health/{db,redis}
├── database/prisma/
│   ├── schema.prisma
│   └── migrations/
│       ├── 20260401195211_init/
│       └── 20260410000100_phase2_perf_indexes/
└── other/
    ├── docs/
    ├── scripts/
    └── static-html/            # Original HTML/CSS pages from the assignment
```

### Request Flow

```
Browser
  │
  ├─ Static assets ──────────────────────────────► Next.js (Edge / CDN)
  │
  ├─ Page navigation ────────────────────────────► Next.js Middleware
  │                                                 (edge-safe NextAuth check)
  │                                                 └─ Unauthenticated → /login
  │
  └─ API call (e.g. GET /api/posts)
       │
       ├─ frontend/src/app/api/posts/route.ts      ← thin re-export wrapper
       │         │  { export * from "@/...backend.../posts/route" }
       │
       └─ backend/src/api/posts/route.ts           ← real implementation
               ├─ 1. auth()                         session check
               ├─ 2. hitRateLimit()                 Redis → in-memory fallback
               ├─ 3. getCachedFeedPage()            Redis cache lookup
               ├─ 4. prisma.post.findMany()         DB query (on cache MISS)
               ├─ 5. setCachedFeedPage()            populate cache
               └─ 6. NextResponse.json(payload)     with X-Cache, RateLimit headers
```

---

## Data Model

```
User
 ├── id          (cuid)
 ├── firstName, lastName, email (unique), password (bcrypt hash)
 ├── avatarUrl?
 ├── Post[]
 ├── Comment[]
 ├── Reply[]
 └── Like[]

Post
 ├── id, content, imageUrl?, visibility (PUBLIC|PRIVATE)
 ├── createdAt, updatedAt
 ├── authorId → User
 ├── Comment[]
 └── Like[]

Comment
 ├── id, content, createdAt
 ├── authorId → User
 ├── postId → Post
 ├── Reply[]
 └── Like[]

Reply
 ├── id, content, createdAt
 ├── authorId → User
 ├── commentId → Comment
 └── Like[]

Like   (polymorphic — one of postId / commentId / replyId is set)
 ├── id, createdAt
 ├── userId → User
 ├── postId?    → Post    @@unique([userId, postId])
 ├── commentId? → Comment @@unique([userId, commentId])
 └── replyId?   → Reply   @@unique([userId, replyId])

enum Visibility { PUBLIC, PRIVATE }
```

The `@@unique` constraints on `Like` enforce idempotent toggles — a duplicate like is a database-level error, not an application-level race.

---

## Database Indexes

Two migration phases cover all high-read paths:

**Phase 1 — `20260401195211_init`**
- `User.email` — login lookup
- `Post.authorId`, `Post.createdAt DESC`, `Post.visibility` — feed filters
- `Comment(postId, createdAt)`, `Reply(commentId, createdAt)` — thread ordering
- `Like.postId`, `Like.commentId`, `Like.replyId` — like-count aggregation

**Phase 2 — `20260410000100_phase2_perf_indexes`**
- `Post(visibility, createdAt DESC)` — public feed scan without touching authorId
- `Post(authorId, visibility, createdAt DESC)` — author-scoped private feed
- `Like(postId, createdAt DESC)` — recent-likers sidebar ordered correctly

At millions of posts, the feed query (`WHERE visibility='PUBLIC' OR (authorId=? AND visibility='PRIVATE') ORDER BY createdAt DESC LIMIT 11`) hits the composite index and skips a full-table scan entirely.

---

## Security

### Authentication
- Passwords hashed with **bcryptjs** (default salt rounds, 10)
- JWT tokens stored in **HttpOnly, Secure, SameSite=Lax** cookies via NextAuth — inaccessible to JavaScript
- NextAuth middleware runs at the **edge** using only `auth.config.ts` (no Prisma, no Node.js modules) ensuring route protection adds zero cold-start latency

### Brute-Force Protection (Login)
`auth.ts` maintains an in-process login attempt bucket per email:
- Window: 10 minutes
- Threshold: 8 failed attempts → 15-minute block
- Bucket is cleared on successful login
- All block events are recorded via `logSecurityEvent`

### Rate Limiting
`rate-limit.ts` implements a sliding-window counter backed by Redis (`INCR` + `PEXPIRE`). If Redis is unavailable, it falls back to an in-process `Map` automatically — the app never hard-fails due to a missing cache.

| Route class | Window | Limit |
|---|---|---|
| Signup (per IP) | 15 min | 10 |
| Signup (per email) | 15 min | 5 |
| Create post | 1 min | 20 |
| Create comment / reply | 1 min | 60 |
| Toggle like | 1 min | 120 |
| Read feed | 1 min | 120 |
| Upload signature | 1 min | 20 |

Every rate-limited response returns standard `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` headers.

### Input Validation
All API inputs pass through Zod schemas before touching the database:
- `signupSchema` — first/last name (≤50 chars), valid email, password (≥8 chars)
- `createPostSchema` — content (≤5 000 chars) or imageUrl required; valid visibility enum
- `createCommentSchema` / `createReplySchema` — content 1–2 000 chars, valid cuid foreign key

### Image Upload Security
The browser requests a **signed upload signature** from `/api/upload-signature` (which is itself rate-limited and auth-gated). The signature is short-lived and scoped. The `CLOUDINARY_API_SECRET` never leaves the server.

### Visibility Enforcement
Private post filtering is enforced at the **database query level** — not in application code after the fact:

```typescript
where: {
  OR: [
    { visibility: "PUBLIC" },
    { authorId: userId, visibility: "PRIVATE" },
  ],
}
```

There is no path where a private post leaks to another user, even if the client sends a direct post ID.

### Observability
Two structured loggers are present:
- `logSecurityEvent` — login blocks, rate limit trips, creation failures
- `logPerformanceEvent` — route, method, userId, statusCode, totalMs, dbMs, cache HIT/MISS, payload size

---

## Performance

### Cursor-Based Pagination
The feed uses cursor pagination (`take: PAGE_SIZE + 1`, then pop and capture `nextCursor`). Offset pagination (`OFFSET N`) degrades linearly at scale; cursors stay O(log n) regardless of dataset size.

### Redis Feed Cache
Each user's feed page is cached per cursor position with a 30-second TTL and `stale-while-revalidate=30` on the HTTP response. Cache is invalidated immediately when the user creates a new post. The `X-Cache: HIT/MISS` response header is visible to the client for debugging.

### Optimistic UI
TanStack React Query mutations update the local cache before the server responds. Like toggles and comment submissions feel instant — rollback happens only if the request actually fails.

### N+1 Prevention
The feed query uses a single `prisma.post.findMany` with nested `include` for author, top-3 likers, and `_count` aggregates. There is no secondary per-post loop. The only second query is a bulk `prisma.like.findMany({ where: { userId, postId: { in: postIds } } })` to resolve the current user's like state in one round-trip.

---

## API Reference

### Auth
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Create account |
| `POST` | `/api/auth/[...nextauth]` | Sign in (NextAuth) |
| `GET` | `/api/auth/[...nextauth]` | Session check / sign out |

### Posts
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/posts?cursor=` | Paginated feed (newest first) |
| `POST` | `/api/posts` | Create post |
| `DELETE` | `/api/posts/[id]` | Delete own post |
| `POST` | `/api/posts/[id]/like` | Toggle like on post |
| `GET` | `/api/posts/[id]/likes` | List users who liked a post |
| `GET` | `/api/posts/[id]/comments` | List comments on a post |

### Comments
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/comments` | Create comment |
| `DELETE` | `/api/comments/[commentId]` | Delete own comment |
| `POST` | `/api/comments/[commentId]/like` | Toggle like on comment |
| `GET` | `/api/comments/[commentId]/likes` | List users who liked a comment |

### Replies
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/replies` | Create reply |
| `DELETE` | `/api/replies/[replyId]` | Delete own reply |
| `POST` | `/api/replies/[replyId]/like` | Toggle like on reply |
| `GET` | `/api/replies/[replyId]/likes` | List users who liked a reply |

### Utilities
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/upload-signature` | Get signed Cloudinary upload params |
| `GET` | `/api/health/db` | Database connectivity check |
| `GET` | `/api/health/redis` | Redis connectivity check |

All endpoints except `/api/auth/signup` and `/api/auth/[...nextauth]` require an authenticated session and return `401 Unauthorized` otherwise.

---

## Local Development

### Prerequisites
- Node.js 22.x
- PostgreSQL (local or [Neon](https://neon.tech) free tier)
- Redis (local or [Upstash](https://upstash.com) free tier)
- [Cloudinary](https://cloudinary.com) account (free tier is fine)

### Setup

```bash
git clone https://github.com/MBillahsust/buddyscript.git
cd buddyscript

# Install root tooling
npm install

# Install frontend dependencies
npm --prefix frontend install
```

Create `frontend/.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/buddyscript"

# Redis (use rediss:// for TLS on Upstash)
REDIS_URL="redis://localhost:6379"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Auth — generate with: openssl rand -base64 32
AUTH_SECRET="your_secret_here"
NEXTAUTH_SECRET="your_secret_here"   # keep identical to AUTH_SECRET
NEXTAUTH_URL="http://localhost:3000"
```

```bash
# Generate Prisma client and run migrations
npm run prisma:generate
npm run prisma:migrate

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/login`.

---

## Production Deployment (Vercel)

### Vercel Project Settings

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Next.js |
| Build Command | `npm run build` |
| Install Command | `npm install --include=dev` |
| Node.js Version | `22.x` |

### Required Environment Variables

```env
DATABASE_URL=
REDIS_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
AUTH_SECRET=
NEXTAUTH_SECRET=           # same value as AUTH_SECRET
NEXTAUTH_URL=              # exact production URL, no trailing slash
                           # e.g. https://buddyscript-mbillahcsesust20-gmailcoms-projects.vercel.app
```

> **Note:** `NEXTAUTH_URL` must exactly match the URL you access the app on. A mismatch causes session cookies to be rejected.

---

## Deployment Verification Checklist

After deploying, confirm these manually or via the health endpoints:

- [ ] `/login` and `/register` pages render correctly
- [ ] Registration creates a user and redirects to `/feed`
- [ ] Login works and session persists across page refreshes
- [ ] `/feed` redirects to `/login` when accessed without a session
- [ ] Creating a **public** post shows it to another test account
- [ ] Creating a **private** post is invisible to another test account
- [ ] Like / unlike toggles update counts and reflect per-user state
- [ ] Comments and replies post and display correctly
- [ ] Likes on comments and replies work with "liked by" modal
- [ ] Image upload works (creates a post with a visible image)
- [ ] `GET /api/health/db` returns `{ "status": "ok" }`
- [ ] `GET /api/health/redis` returns `{ "status": "ok" }`

---

## NPM Scripts

Run from the repository root:

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Prisma generate + Next.js production build |
| `npm run start` | Start production server (after build) |
| `npm run lint` | ESLint |
| `npm run prisma:generate` | Regenerate Prisma client from schema |
| `npm run prisma:migrate` | Apply pending database migrations |

---

## Intentionally Out of Scope

The following were not built because they are explicitly excluded by the assignment:

- Forgot password / password reset
- OAuth / social login
- Email verification
- Push or in-app notifications
- User profile editing
- Follow / friend system

---

## Key Design Decisions

**Why a `backend/` folder inside a Next.js project?**
All real API logic lives in `backend/src/api/`. The `frontend/src/app/api/` files are one-line re-exports. This keeps the codebase testable and portable — the backend handlers could be moved to a standalone Express or Fastify server without touching any business logic. Deployment on Vercel stays simple because Next.js sees a normal `app/api/` structure.

**Why a single polymorphic `Like` model?**
Posts, comments, and replies share identical like semantics. A single table with nullable foreign keys and `@@unique` constraints eliminates three separate tables and three sets of toggle endpoints while keeping the constraint enforcement in the database.

**Why Redis for rate limiting instead of a library?**
A rolling-window counter with `INCR` + `PEXPIRE` is the most accurate approach for distributed deployments where multiple Vercel instances handle requests. The in-memory fallback ensures the app never hard-fails if Redis is temporarily unavailable — it degrades gracefully to per-instance limiting.

**Why cursor pagination?**
Offset pagination (`SKIP N`) performs a full scan up to offset N on every request. At millions of posts that is unusable. Cursor pagination always starts from a known row ID and stays fast regardless of dataset depth.