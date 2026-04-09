# Buddy Script — Social Feed Application

A full-stack social media feed application built with **Next.js** and **Node.js/Express**, featuring authentication, a public/private post system, nested comments and replies, and like/unlike functionality — designed to match provided HTML/CSS templates pixel-perfectly.

---

## Deliverables

> _Submission for the Appifylab Full Stack Engineer selection task._

| # | Item | Link |
|---|---|---|
| 1 | GitHub Repository | https://github.com/MehediHasan-75/buddy-script |
| 2 | Video Walkthrough (YouTube unlisted) | https://youtu.be/o05-t06ytLE — see [VIDEO_WALKTHROUGH.md](./VIDEO_WALKTHROUGH.md) for the recording script |
| 3 | Live Application | https://buddy-script-dusky.vercel.app/ |

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Features Implemented](#features-implemented)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Architecture & Design Decisions](#architecture--design-decisions)
- [Security & Best Practices](#security--best-practices)
- [API Endpoints](#api-endpoints)
- [Testing & Edge Cases](#testing--edge-cases)
- [Performance & Scalability](#performance--scalability)
- [Known Issues / Future Improvements](#known-issues--future-improvements)
- [Deployment](#deployment)
- [Screenshots / Walkthrough](#screenshots--walkthrough)

---

## Project Overview

**Buddy Script** is a full-stack social platform where authenticated users can compose posts (text + image), interact through nested comments and replies, and control post visibility (public vs. private). The application is built as a monorepo with a clear separation between the backend API and the frontend client.

**Core purpose:** Demonstrate a production-grade implementation of a social feed with secure authentication, real-time-like interactions, and a scalable data architecture.

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js (App Router) | 16.2.2 | React framework, file-based routing, SSR |
| React | 19.2.4 | UI library |
| TypeScript | 5.x | Type safety |
| TanStack React Query | 5.x | Server state management, caching, pagination |
| Axios | 1.14.0 | HTTP client with interceptors |
| Bootstrap 5 | — | Responsive CSS framework |
| date-fns | 4.1.0 | Date formatting utilities |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js / Express | 5.2.1 | HTTP server and REST API |
| TypeScript | 6.0.2 | Type safety across the server |
| MongoDB / Mongoose | 9.3.3 | Primary database (ODM) |
| Redis / ioredis | 5.10.1 | Rate limiting store |
| JSON Web Tokens | 9.0.3 | Access token authentication |
| bcryptjs | 3.0.3 | Password hashing |
| Cloudinary | 2.9.0 | Image upload and CDN delivery |
| Zod | 4.3.6 | Request validation schemas |
| Winston | 3.14.0 | Structured logging with daily rotation |
| Helmet | 8.1.0 | HTTP security headers |
| express-mongo-sanitize | 2.2.0 | NoSQL injection prevention |
| hpp | 0.2.3 | HTTP Parameter Pollution protection |
| express-rate-limit | 8.3.2 | API rate limiting |

### Infrastructure
- **Database:** MongoDB (local or Atlas)
- **Cache / Rate Limit Store:** Redis
- **Image CDN:** Cloudinary
- **Deployment:** Vercel (frontend) / Railway or Render (backend)

---

## Features Implemented

### Authentication
- [x] User registration with **first name, last name, email, and password**
- [x] Passwords hashed with bcryptjs (salt rounds 12) — never stored in plain text
- [x] Login returns a short-lived JWT access token + httpOnly refresh token cookie
- [x] Silent token refresh — expired access tokens are automatically refreshed via the cookie-based refresh token
- [x] Logout clears both the localStorage token and the server-side cookie

### Feed & Posts
- [x] Protected feed route — accessible only to logged-in users
- [x] **All users can see public posts from all other users**
- [x] Posts displayed with the **most recent first** (sorted by `createdAt` descending)
- [x] Paginated feed using **cursor-based pagination** (`nextCursor` / `hasMore`)
- [x] Create posts with text content (up to 5,000 characters)
- [x] Attach a single image per post via Cloudinary upload
- [x] **Public posts** visible to all authenticated users
- [x] **Private posts** visible only to the author
- [x] Delete own posts

### Interactions
- [x] Like / unlike posts, comments, and replies
- [x] View the list of users who liked a post, comment, or reply (Likes modal)
- [x] Add comments to posts (up to 2,000 characters), with paginated loading
- [x] Add replies to comments (up to 2,000 characters), with paginated loading
- [x] Live counters for likes, comments, and replies

### UI / UX
- [x] Fully responsive layout (Bootstrap 5 + custom CSS)
- [x] Dark mode toggle persisted across sessions
- [x] Mobile-friendly sidebar with hamburger menu
- [x] Error boundary for graceful UI failure handling
- [x] Protected routes via Next.js middleware (`/feed/*`)
- [x] Auto-redirect authenticated users away from login/register pages

---

## Project Structure

```
buddy-script/
├── backend/
│   ├── src/
│   │   ├── app.ts               # Express app entry point
│   │   ├── config/              # DB, Redis, logger, env config
│   │   ├── controllers/         # Route handlers (auth, posts, comments, replies, likes, upload)
│   │   ├── services/            # Business logic layer
│   │   ├── models/              # Mongoose schemas (User, Post, Comment, Reply, Like)
│   │   ├── routes/              # Express routers
│   │   ├── middlewares/         # Auth, error handler, rate limiter, validator
│   │   ├── validators/          # Zod schemas for all request bodies
│   │   ├── types/               # Shared TypeScript interfaces
│   │   └── utils/               # Helpers
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   │   ├── page.tsx         # Redirects → /login
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── feed/
│   │   ├── components/
│   │   │   ├── auth/            # LoginForm, RegisterForm
│   │   │   ├── feed/            # PostCard, PostList, PostComposer, CommentSection, LikesModal, …
│   │   │   ├── layout/          # Navbar, Sidebar, DarkModeToggle, MobileSidebar
│   │   │   └── ui/              # Modal, Avatar, ImageUpload
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/
│   │   │   ├── api.ts           # Axios instance + interceptors
│   │   │   └── auth.ts          # Token helpers (get/set/clear)
│   │   ├── types/               # Shared TypeScript interfaces
│   │   └── proxy.ts             # Next.js route protection middleware
│   ├── public/assets/           # Bootstrap CSS, custom styles, logo
│   ├── .env.local.example
│   ├── next.config.ts
│   └── package.json
│
└── CLAUDE.md
```

---

## Setup Instructions

### Prerequisites

- Node.js ≥ 20
- MongoDB (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- Redis (local instance or [Upstash](https://upstash.com))
- Cloudinary account (free tier sufficient)

---

### 1. Clone the repository

```bash
git clone https://github.com/MehediHasan-75/buddy-script.git
cd buddy-script
```

---

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
```

Fill in `.env` (see [Environment Variables](#environment-variables) below), then:

```bash
npm install
npm run dev
```

The API server starts at `http://localhost:8000`.
Verify with: `curl http://localhost:8000/health`

---

### 3. Configure the frontend

```bash
cd ../frontend
cp .env.local.example .env.local   # or create manually
```

Add `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`, then:

```bash
npm install
npm run dev
```

The app starts at `http://localhost:3000`.

---

## Environment Variables

### Backend — `backend/.env`

```env
NODE_ENV=development
PORT=8000

# MongoDB
DATABASE_URL=mongodb://localhost:27017/buddyscript

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS
CLIENT_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

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
