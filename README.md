# BuddyScript

Production-style full-stack social feed application built for the Appifylab Full Stack Engineer assignment.

This project uses:

1. Next.js (frontend + backend API routes)
2. PostgreSQL + Prisma (database)
3. NextAuth credentials auth (session/JWT strategy)
4. Redis (rate limit + feed caching)
5. Cloudinary (image upload and delivery)

The UI follows the provided Login, Register, and Feed design direction while implementing the required functionality.

## Assignment Coverage (Appifylab)

### 1) Authentication & Authorization

Implemented:

1. Registration with first name, last name, email, password
2. Secure credential login
3. Password hashing with bcrypt
4. Protected feed route
5. Unauthorized API requests blocked

Not implemented by design (as per assignment scope):

1. Forgot password and extra auth flows

### 2) Feed Page Requirements

Implemented:

1. Feed accessible only to logged-in users
2. Newest posts first
3. Create post with text and image
4. Public/private visibility
5. Correct like/unlike state for posts
6. Comments and replies
7. Like/unlike on comments and replies
8. “Who liked” modals for posts/comments/replies

Visibility logic:

1. Public posts: visible to all authenticated users
2. Private posts: visible only to author

### 3) Best Practices / Performance / Scale

Implemented:

1. Input validation via Zod
2. Rate limiting (with Redis and safe fallback)
3. Structured security and performance logging
4. Cursor-based pagination
5. Feed caching and cache invalidation strategy
6. DB indexing for high read throughput patterns
7. Optimistic UI updates for responsive interactions

## Current Project Structure

The repository is now refoldered into clear domains:

```text
buddyscript/
├─ frontend/                 # Active Next.js app (UI + API routes)
│  ├─ src/
│  │  ├─ app/                # App Router pages + /api routes
│  │  ├─ components/
│  │  ├─ features/           # Modular feature folders (ex: feed)
│  │  ├─ hooks/              # Legacy compatibility shims / shared hooks
│  │  ├─ lib/                # auth, prisma, redis, security, utils
│  │  └─ types/
│  ├─ public/
│  ├─ package.json
│  └─ prisma.config.ts
├─ database/
│  └─ prisma/                # schema + migrations
├─ backend/                  # Archived/separate backend reference
├─ other/
│  ├─ docs/
│  ├─ archive/
│  ├─ scripts/
│  └─ static-html/
└─ package.json              # Root workspace runner scripts
```

## Tech Stack

### Frontend + API

1. Next.js 16 (App Router)
2. React 19
3. TypeScript
4. TanStack React Query
5. NextAuth (credentials)

### Data / Infra

1. PostgreSQL
2. Prisma ORM
3. Redis (`ioredis`)
4. Cloudinary

### Validation / Security

1. Zod
2. bcryptjs

## Key Functional Features

### Auth

1. Register and login flows
2. Middleware-protected routes
3. Session-aware server API authorization

### Feed / Posts

1. Post composer with text, image, visibility toggle
2. Public/private feed filtering
3. Infinite scrolling feed with cursor
4. Post menu actions (ownership-aware)

### Social Interactions

1. Like/unlike posts, comments, replies
2. Comments + nested replies
3. Likers list modal for each entity
4. Optimistic updates for reduced perceived latency

### UI/UX

1. Preserved visual language from provided templates
2. Responsive feed layout
3. User avatars with fallback initials

## Security Design

Security controls currently implemented:

1. Password hashing (bcrypt)
2. Route and API authorization checks
3. Request validation with strict schemas
4. Rate limiting on critical endpoints
5. Security event logging (`category: security`)
6. Safe error responses (no raw internal leakage to users)
7. Content and security headers via Next config

## Performance & Scalability Design

### Query + Cache Layer

1. Redis feed cache (HIT/MISS strategy)
2. Cache invalidation on post create/delete mutation paths
3. Tuned React Query stale/cache behavior
4. Modal/comment query tuning to prevent noisy refetches

### DB Layer

1. Cursor-based pagination for feed reads
2. Composite indexes optimized for feed visibility + recency
3. Added recency index for like-list retrieval paths

### Rendering / Payload

1. Cloudinary transformation for optimized image payloads
2. Lazy image loading and async decoding
3. Dynamic import of heavy subcomponents
4. Memoization of feed cards

### Observability

1. Structured performance logs (`category: performance`)
2. Captured fields include total time, DB time, payload size, cache status

## API Overview

Primary API routes live inside the Next app:

1. `/api/auth/signup`
2. `/api/auth/[...nextauth]`
3. `/api/posts` and nested routes (`/like`, `/likes`, comments)
4. `/api/comments/*`, `/api/replies/*`
5. `/api/upload-signature`
6. `/api/health/redis`

## Local Setup

### Prerequisites

1. Node.js 20+
2. PostgreSQL database
3. Redis (local or managed)
4. Cloudinary account

### 1) Install dependencies

```bash
cd buddyscript
npm install
npm --prefix frontend install
```

### 2) Configure env

Use:

1. `frontend/.env.local` for app runtime variables
2. `DATABASE_URL` for PostgreSQL
3. `REDIS_URL` for Redis
4. Cloudinary keys for image upload signing
5. `AUTH_SECRET` + `NEXTAUTH_URL`

### 3) Prisma generate + migrate

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4) Run app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Root Scripts

Workspace-level scripts are in root `package.json`:

1. `npm run dev` -> runs frontend dev server
2. `npm run build` -> builds frontend
3. `npm run start` -> starts frontend production server
4. `npm run lint` -> frontend lint
5. `npm run prisma:generate`
6. `npm run prisma:migrate`

## How This Meets Appifylab Requirements

This implementation directly satisfies the requested scope:

1. Required frontend framework: Next.js
2. Secure auth + protected feed: implemented
3. Posts + image + ordering + visibility: implemented
4. Like/unlike system for post/comment/reply: implemented
5. Show who liked each item: implemented
6. Scalable design considerations: pagination, caching, indexing, performance telemetry
7. Priority on security + UX: enforced in API and client behaviors

## Deliverables Checklist

Complete these before final submission:

1. GitHub repository link
2. YouTube walkthrough link (unlisted/private)
3. Optional live deployment URL
4. This README as implementation decision documentation

## Notes

1. `backend/` exists as archived/separate reference; active backend for this app is implemented in `frontend/src/app/api`.
2. `other/archive/` contains legacy/reference assets retained for traceability.

---

If needed, this README can be split into:

1. `README.md` (quick start + summary)
2. `other/docs/ARCHITECTURE.md` (deep technical design)
3. `other/docs/OPERATIONS.md` (deployment/runbook)

## Architecture & Design Decisions

### JWT + Refresh Token Strategy
Access tokens (short-lived, stored in `localStorage`) authenticate API requests. Refresh tokens are stored in **httpOnly cookies**, making them inaccessible to JavaScript and resistant to XSS. The Axios response interceptor queues failed 401 requests, silently refreshes the token, and retries — providing a seamless UX without re-login prompts.

### MongoDB over a Relational DB
The social graph (posts → comments → replies → likes) maps naturally to document-level embedding or lightweight references. MongoDB's flexible schema allowed rapid iteration during design, while strategic indexes (`{ visibility, createdAt }`, `{ author, createdAt }`, `{ post, createdAt }`) keep feed queries fast.

### Cursor-Based Pagination
Offset pagination degrades at scale (deep pages require scanning all prior rows). Cursor-based pagination using `_id` or `createdAt` as the cursor avoids this, ensuring consistent O(log n) lookups regardless of dataset size.

### Redis for Rate Limiting
Using Redis as the rate-limit store makes limits consistent across multiple Node.js processes/instances — a prerequisite for horizontal scaling. Without Redis, each process would maintain an independent counter.

### Next.js Middleware for Route Protection
Route protection is enforced at the Edge in `proxy.ts` before any page renders, avoiding client-side flashes of protected content. It checks for the `bs_session` cookie (set alongside the access token at login).

### Cloudinary for Image Storage
Storing binary files in MongoDB or on a local disk is an antipattern in production. Cloudinary handles upload, transformation, CDN delivery, and format optimization (auto WebP/AVIF), offloading all of that complexity from the application server.

### Service Layer Pattern
Controllers are thin — they parse the request and call the corresponding service. All business logic lives in the service layer, making it independently testable and reusable.

---

## Security & Best Practices

| Concern | Implementation |
|---|---|
| Password storage | bcryptjs with configurable salt rounds (default 12) |
| Transport security | HTTPS in production; `Secure` flag on cookies |
| HTTP headers | Helmet sets `X-Frame-Options`, `X-Content-Type-Options`, CSP, etc. |
| NoSQL injection | `express-mongo-sanitize` strips `$` and `.` from user input |
| Parameter pollution | `hpp` deduplicates repeated query parameters |
| Rate limiting | Global limit + per-endpoint limits backed by Redis |
| Input validation | Zod schemas validate all request bodies before they reach controllers |
| CORS | Configurable `ALLOWED_ORIGINS`; credentials flag controlled explicitly |
| Token verification | Every protected route passes through the `protect()` middleware |
| Private posts | Visibility filter applied at the database query level — private posts never leave the server unless the requester is the author |

---

## API Endpoints

All routes are prefixed with `/api/v1`.

### Auth — `/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create a new account |
| POST | `/auth/login` | — | Login, receive access token + refresh cookie |
| POST | `/auth/refresh` | Cookie | Issue a new access token |
| POST | `/auth/logout` | Bearer | Clear refresh token cookie |

### Posts — `/posts`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/posts` | Bearer | Paginated feed (cursor-based) |
| POST | `/posts` | Bearer | Create a post |
| DELETE | `/posts/:id` | Bearer | Delete own post |

### Comments — `/comments`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/comments?postId=` | Bearer | Paginated comments for a post |
| POST | `/comments` | Bearer | Add a comment |
| DELETE | `/comments/:id` | Bearer | Delete own comment |

### Replies — `/replies`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/replies?commentId=` | Bearer | Paginated replies for a comment |
| POST | `/replies` | Bearer | Add a reply |
| DELETE | `/replies/:id` | Bearer | Delete own reply |

### Likes — `/likes`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/likes` | Bearer | Like a post / comment / reply |
| DELETE | `/likes` | Bearer | Unlike a post / comment / reply |
| GET | `/likes?postId=` | Bearer | Users who liked a post |

### Upload — `/upload`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/upload/image` | Bearer | Upload image to Cloudinary, returns URL |

### Health
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | MongoDB + Redis connection status, uptime |

---

## Testing & Edge Cases

### Manual Testing Checklist

**Authentication**
- [ ] Register with a duplicate email → expect `409 Conflict`
- [ ] Login with wrong password → expect `401 Unauthorized`
- [ ] Access `/feed` without a token → redirected to `/login`
- [ ] Submit expired access token → silent refresh occurs, request retried
- [ ] Submit malformed JWT → expect `401 Unauthorized`

**Posts**
- [ ] Create a post with neither text nor image → expect validation error
- [ ] Create a post exceeding 5,000 characters → expect `400 Bad Request`
- [ ] Upload a non-image file → expect rejection from upload endpoint
- [ ] Set post to **Private** → verify it does not appear in other users' feeds
- [ ] Set post to **Public** → verify it appears in the feed for all users
- [ ] Delete another user's post → expect `403 Forbidden`

**Comments & Replies**
- [ ] Submit an empty comment → expect validation error
- [ ] Submit a comment exceeding 2,000 characters → expect `400 Bad Request`
- [ ] Paginate through comments (load more) → verify cursor advances correctly
- [ ] Reply to a comment → verify `repliesCount` increments

**Likes**
- [ ] Like a post → `likesCount` increments, heart toggles
- [ ] Like the same post twice → expect `409 Conflict` (unique index enforced)
- [ ] Unlike a post that was never liked → expect `404 Not Found`
- [ ] Open likes modal → list of users displayed correctly

**Rate Limiting**
- [ ] Send more than the allowed requests per window → expect `429 Too Many Requests`

---

## Performance & Scalability

### Database Indexing
Compound indexes are defined on all high-traffic query paths:

```
Post:    { visibility: 1, createdAt: -1 }   ← public feed queries
Post:    { author: 1, createdAt: -1 }        ← profile page queries
Comment: { post: 1, createdAt: -1 }          ← comment loading
Reply:   { comment: 1, createdAt: -1 }       ← reply loading
Like:    { user: 1, post: 1 } (unique)       ← like deduplication
Like:    { post: 1 }, { comment: 1 }, { reply: 1 }  ← like count queries
```

### Cursor-Based Pagination
Using the last document's `_id` or `createdAt` as a cursor avoids the `SKIP` overhead that makes offset pagination unusable beyond a few thousand records.

### Response Compression
The `compression` middleware gzip-encodes all API responses, reducing bandwidth for large feed payloads.

### Connection Pooling
Mongoose is configured with a pool of 10–100 connections, tuned for concurrent request handling. Connections are reused across requests.

### Redis-Backed Rate Limiting
Centralised counters in Redis ensure fair enforcement across all Node.js worker processes without double-counting.

### Potential Scaling Path
1. **Horizontal scaling** — Stateless JWT auth allows multiple API instances behind a load balancer
2. **Read replicas** — MongoDB Atlas supports replica sets; feed queries can be routed to secondaries
3. **CDN** — Cloudinary already serves images via CDN; static Next.js assets can be served via Vercel's Edge Network
4. **Caching** — Hot feed pages can be cached in Redis with a short TTL to absorb traffic spikes
5. **Queue-based uploads** — For high-volume image uploads, a background job queue (e.g., BullMQ) can offload Cloudinary uploads

---

## Known Issues / Future Improvements

| Item | Type | Notes |
|---|---|---|
| No automated test suite | Missing | Unit and integration tests with Jest/Vitest planned |
| No real-time updates | Future | WebSocket or Server-Sent Events for live feed updates |
| No user profile page | Future | Edit avatar, bio, view own posts |
| No post edit functionality | Future | Currently posts can only be created or deleted |
| No full-text search | Future | MongoDB Atlas Search or Elasticsearch integration |
| Access token in localStorage | Known risk | Susceptible to XSS; future improvement is to move to memory-only storage |
| No email verification | Future | Confirm email on register before allowing login |
| No pagination on likes modal | Future | Likes list currently loads all likers at once |
| No image compression on client | Future | Client-side compression before upload to reduce Cloudinary costs |

---

## Deployment

### Frontend — Vercel

```bash
# From the frontend directory
vercel --prod
```

Set the environment variable in the Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api/v1
```

### Backend — Railway / Render

1. Connect your GitHub repository
2. Set the root directory to `backend/`
3. Build command: `npm run build`
4. Start command: `npm start`
5. Add all variables from `backend/.env.example` in the environment settings

### Required Production Environment Values

| Variable | Notes |
|---|---|
| `NODE_ENV` | Set to `production` |
| `DATABASE_URL` | MongoDB Atlas connection string |
| `REDIS_URL` | Upstash Redis URL (`rediss://…`) |
| `JWT_SECRET` | Long, random secret (≥ 64 chars) |
| `CLIENT_URL` | Your Vercel frontend URL |
| `ALLOWED_ORIGINS` | Same as `CLIENT_URL` |
| `CLOUDINARY_*` | From your Cloudinary dashboard |

---

## Screenshots / Walkthrough

> **Video Walkthrough:** Upload to **YouTube (unlisted or private)** and paste the link in the [Deliverables](#deliverables) table above.
>
> Suggested walkthrough script (2–3 minutes):
> 1. Register a new account (show first name, last name, email, password fields)
> 2. Log in and land on the protected feed
> 3. Create a public post with text + image
> 4. Create a private post — switch to a second account to confirm it's hidden
> 5. Like, comment, and reply on a post; open the likes modal
> 6. Toggle dark mode

| Page | Preview |
|---|---|
| Login | *(add screenshot)* |
| Register | *(add screenshot)* |
| Feed | *(add screenshot)* |
| Post with comments | *(add screenshot)* |
| Likes modal | *(add screenshot)* |

---

## License

Built as a selection task submission for the **Full Stack Engineer** role at **Appifylab**. All rights reserved.
