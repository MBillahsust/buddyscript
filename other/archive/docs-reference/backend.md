# Backend Architecture & Developer Guide

> Stack: Node.js · Express 5 · TypeScript 6 · MongoDB 9 · Redis (ioredis) · Cloudinary · JWT

---

## System Overview

This is the backend for a social feed application where authenticated users can create public or private posts with images, interact through likes and threaded comments, and browse a real-time feed. The system is designed to remain responsive under high read volume — the feed query, like counts, and comment counts are all optimized to avoid runtime aggregation.

The server exposes a REST API at `/api/v1`. All responses share a uniform shape:

```json
// Success
{ "success": true, "message": "...", "data": { ... } }

// Error
{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "..." } }
```

Errors are never swallowed in controllers — they propagate to a single `errorHandler` middleware that maps `AppError` instances to the correct HTTP status and logs unexpected errors separately.

---

## Architecture

The codebase follows a strict three-layer separation:

```
Request
  └── Router (route + middleware chain)
        └── Controller (HTTP in/out only)
              └── Service (business logic, DB calls)
                    └── Model (Mongoose schema)
```

**Routers** declare which middleware (auth, rate-limit, validation) applies to which route. They contain no logic.

**Controllers** extract parameters, call a service, and call `successResponse()`. They never query the database directly. Any thrown error from the service propagates to `next(error)` and is handled globally.

**Services** own all business logic: authorization checks (is this the author?), cascade operations (deleting a comment deletes its replies and all associated likes), and denormalized count updates. They throw `AppError` instances with the correct HTTP semantics.

**Utilities** (`utils/errors.ts`, `utils/response.ts`) are the two shared primitives. Every response — success or error — goes through one of them. This makes the response format consistent across the entire API without any ad-hoc `res.json()` calls.

---

## Authentication & Security

### Token Strategy

Login issues two tokens:

| Token | Lifetime | Delivery |
|-------|----------|----------|
| Access token (JWT) | 15 minutes | JSON response body |
| Refresh token (JWT) | 7 days | `HttpOnly; Secure; SameSite=Strict` cookie |

The access token is sent by the client in the `Authorization: Bearer <token>` header. The refresh token never appears in JavaScript — it lives only in the cookie store, which eliminates the most common XSS-based token theft vector.

When the access token expires, the client hits `POST /auth/refresh-token`. The server reads the cookie, verifies the refresh token, issues new access and refresh tokens (rotation), and sets a new cookie. If the refresh token is invalid or missing, the cookie is cleared and a 401 is returned.

### Auth Middleware

`protect()` is a factory that returns Express middleware. It:

1. Extracts the Bearer token from the `Authorization` header
2. Verifies the JWT signature against `JWT_SECRET`
3. Loads the user from MongoDB and attaches it to `req.user`

Routes that don't need auth simply don't use `protect()`. There is no concept of roles in this application — authorization is purely "is this the author of the resource?", checked at the service layer.

### Security Measures

**Timing attack prevention** — On login, if no user is found for the given email, a dummy `bcrypt.hash()` is still performed before returning a 401. Without this, an attacker can enumerate valid email addresses by measuring response time (bcrypt is slow; skipping it on unknown emails makes those responses much faster).

**Password hashing** — bcrypt with 12 rounds. This is the established default for production workloads — high enough to resist offline cracking, low enough to keep login latency reasonable.

**HTTP security headers** — Helmet sets `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, and CSP headers on every response.

**HTTP Parameter Pollution** — hpp middleware prevents `?id=1&id=2` style attacks that could cause unexpected behavior in query parsing.

**Input validation** — Every mutating endpoint runs through a Zod schema via the `validate` middleware. Validation errors return structured `400` responses with per-field messages. The validated body replaces `req.body`, so controllers never touch raw input.

---

## Data Model

### Schema Design Decisions

**Denormalized counts** are the most important design choice in the schema. Every `Post`, `Comment`, and `Reply` stores `likesCount`, and `commentsCount`/`repliesCount` as plain integer fields. These are updated atomically via `$inc` when a like is added or removed, or when a comment/reply is created or deleted.

The alternative — counting from the `Like` collection at query time — does not scale. At a million posts with thousands of likes each, `Like.countDocuments({ post: postId })` per card in the feed is catastrophic. With denormalized counts, rendering a feed page requires zero aggregation.

**Polymorphic likes** — A single `Like` document references exactly one of `post`, `comment`, or `reply`. The unused fields default to `null`. Three sparse compound unique indexes enforce the constraint that a user can only like a given target once:

```
{ user, post }    — unique, sparse
{ user, comment } — unique, sparse
{ user, reply }   — unique, sparse
```

`sparse: true` means MongoDB only indexes documents where the field is not null, which is what makes the compound uniqueness work correctly across the three cases.

**Timestamps** — All models use Mongoose's `{ timestamps: true }` option. The `createdAt` field doubles as the cursor value in all pagination queries, which keeps the cursor format consistent and predictable.

### Models

```
User
  email (unique), firstName, lastName, passwordHash, avatarUrl

Post
  author → User, content, imageUrl, visibility (PUBLIC|PRIVATE)
  likesCount, commentsCount
  indexes: { visibility, createdAt }, { author, createdAt }

Comment
  post → Post, author → User, content
  likesCount, repliesCount
  index: { post, createdAt }

Reply
  comment → Comment, author → User, content
  likesCount
  index: { comment, createdAt }

Like
  user → User
  post? → Post | comment? → Comment | reply? → Reply
  indexes: unique sparse per target + lookup indexes per target
```

### Feed Query

```
WHERE (visibility = 'PUBLIC') OR (visibility = 'PRIVATE' AND author = currentUserId)
  AND createdAt < cursorDate    -- on subsequent pages
ORDER BY createdAt DESC
LIMIT 11                        -- fetch limit+1 to detect hasMore
```

The compound index `{ visibility: 1, createdAt: -1 }` covers the first condition. On large collections, MongoDB will use this index to skip the full collection scan and return results in sorted order without a separate sort stage.

After fetching the page, a single batch query retrieves all likes by the current user for those post IDs:

```ts
Like.find({ user: userId, post: { $in: postIds } })
```

This hydrates the `userLiked` boolean on every post card in one round-trip instead of N+1 per-post queries. Comments and replies follow the same pattern.

---

## API Design

All routes are under `/api/v1`. Auth routes are public; everything else requires a valid Bearer token.

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Create account. Returns access token + sets refresh cookie. |
| `POST` | `/auth/login` | Authenticate. Returns access token + sets refresh cookie. |
| `POST` | `/auth/logout` | Clears refresh cookie. |
| `POST` | `/auth/refresh-token` | Rotates tokens. Reads cookie, returns new access token. |
| `GET`  | `/auth/me` | Returns current user profile. |

### Feed & Posts

| Method | Path | Description |
|--------|------|-------------|
| `GET`    | `/posts?cursor=&limit=` | Cursor-paginated feed. |
| `POST`   | `/posts` | Create post (text + optional imageUrl + visibility). |
| `DELETE` | `/posts/:postId` | Delete own post. |
| `POST`   | `/posts/:postId/like` | Toggle like. Returns `{ liked, count }`. |
| `GET`    | `/posts/:postId/likes` | Paginated list of users who liked. |
| `GET`    | `/posts/:postId/comments` | Paginated comments for a post. |
| `POST`   | `/posts/:postId/comments` | Add a comment. |

### Comments & Replies

| Method | Path | Description |
|--------|------|-------------|
| `DELETE` | `/comments/:commentId` | Delete own comment (cascades replies + likes). |
| `POST`   | `/comments/:commentId/like` | Toggle like on a comment. |
| `GET`    | `/comments/:commentId/likes` | Who liked this comment. |
| `GET`    | `/comments/:commentId/replies` | Paginated replies. |
| `POST`   | `/comments/:commentId/replies` | Add a reply. |
| `DELETE` | `/replies/:replyId` | Delete own reply. |
| `POST`   | `/replies/:replyId/like` | Toggle like on a reply. |
| `GET`    | `/replies/:replyId/likes` | Who liked this reply. |

### Upload

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/upload/sign` | Returns Cloudinary signed upload parameters. |

### Pagination

All list endpoints return the same cursor envelope:

```json
{
  "items": [...],
  "nextCursor": "2025-03-15T10:22:00.000Z",
  "hasMore": true
}
```

The client passes `?cursor=<nextCursor>` on the next request. Cursors are ISO date strings of the last item's `createdAt`. This is more stable than offset pagination under concurrent inserts — a new post at the top of the feed doesn't shift earlier pages.

---

## Media Handling

Images never touch the Express server. The flow is:

```
Client                        Server                     Cloudinary
  │                              │                            │
  ├── POST /upload/sign ──────→  │                            │
  │                         generate signature                │
  │  ←─── { signature, timestamp, apiKey, cloudName } ──────┤
  │                              │                            │
  ├── POST upload directly ──────────────────────────────→   │
  │  ←─── { secure_url, ... } ────────────────────────────── │
  │                              │                            │
  ├── POST /posts { imageUrl: secure_url } ───────────────→  │
```

The server-side `/upload/sign` endpoint uses the Cloudinary SDK to HMAC-sign a `{ timestamp, folder }` parameter set. The client submits this signature alongside the file directly to Cloudinary's upload API. Cloudinary verifies the signature and rejects uploads that weren't approved by the server.

This approach avoids streaming binary data through the application server, which keeps request payload handling simple and removes a common bottleneck in image-heavy applications.

---

## Rate Limiting

Rate limiting is Redis-backed via `rate-limit-redis`, which means counters are shared across all processes and survive restarts. Four limiters are defined:

| Limiter | Window | Max | Applied to |
|---------|--------|-----|------------|
| Global | 15 min | 300 | All routes |
| Strict | 15 min | 5 | Login |
| Register | 1 hour | 5 | Registration |
| Token | 1 hour | 10 | Token refresh |

The strict limiter on login is the primary brute-force protection. Five failed attempts per 15 minutes per IP is aggressive enough to stop credential stuffing without affecting legitimate users who mistype their password once or twice.

The limiters are initialized lazily after Redis connects (`initializeRateLimiters()`) rather than at module load time. This ensures the Redis connection is ready before any store is constructed — building a RedisStore against a disconnected client causes silent failures where limits aren't enforced.

Redis is also the natural home for future additions: caching the first page of the public feed, short-lived like count caches for viral posts, and session invalidation lists.

---

## Error Handling

All thrown errors pass through `errorHandler` middleware. Only `AppError` instances produce structured client-facing messages. Anything else produces a generic `500` — stack traces are logged server-side in development but never sent to clients.

```ts
AppError.badRequest(msg, details?)  // 400 — validation, bad input
AppError.unauthorized(msg)          // 401 — missing/invalid token
AppError.forbidden(msg)             // 403 — wrong author
AppError.notFound(msg)              // 404 — resource doesn't exist
AppError.conflict(msg)              // 409 — duplicate email
```

This pattern keeps controllers thin. A service just throws `AppError.forbidden('Not the author')` and the controller catches it with `next(error)` — no per-endpoint status code logic anywhere.

---

## Setup

### Prerequisites

- Node.js ≥ 20
- MongoDB (local or Atlas)
- Redis (local or managed)
- Cloudinary account

### Environment

```env
PORT=8000
NODE_ENV=development

DATABASE_URL=mongodb://localhost:27017/buddyscript
REDIS_URL=redis://localhost:6379

JWT_SECRET=<random-256-bit-hex>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<different-random-256-bit-hex>
REFRESH_TOKEN_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

CLIENT_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

Use separate values for `JWT_SECRET` and `REFRESH_TOKEN_SECRET`. If both tokens are signed with the same secret, a refresh token could be replayed as an access token (or vice versa).

### Running

```bash
cd backend
npm install
npm run dev        # ts-node with tsconfig-paths + nodemon watch
```

TypeScript path aliases (`@config/*`, `@services/*`, etc.) are resolved at runtime by `tsconfig-paths/register`, which is loaded via the dev script. The same registration is required in production — add `-r tsconfig-paths/register` to the production `node` invocation, or compile with `tsc` and use `tsc-alias` to rewrite the paths in the output.

---

## Trade-offs & Future Considerations

**Like toggle race condition** — The toggle is implemented as `findOneAndDelete` + `create` rather than a transaction. On concurrent double-taps, a duplicate key error (code 11000) is caught and treated as an idempotent success. This avoids the overhead of multi-document transactions for a use case where the worst outcome (a count off by one for a brief moment) is inconsequential.

**Delete cascade is application-level** — Deleting a comment runs `Promise.all([deleteReplies, deleteLikes, deleteComment, decrementCount])`. MongoDB doesn't enforce referential integrity, so this is handled in the service layer. This is fast for typical thread depths but would need to be revisited if comments could have thousands of nested replies (a background job approach would be safer at that scale).

**No feed caching yet** — Redis is wired for rate limiting only. The public feed's first page is the most expensive query that repeats the most. A 10-second Redis cache keyed on `feed:public:page1` would eliminate the majority of database reads for unauthenticated or new-session users. This is the most impactful performance improvement available without architectural changes.

**Visibility enforcement is query-side only** — Private posts are filtered in the feed query, but a direct `GET /posts/:id` endpoint (not yet implemented) would need to check `post.visibility === 'PRIVATE' && post.author !== currentUserId` and return 403. This is easy to add but easy to forget — worth making explicit in the post service rather than relying on the route layer.
