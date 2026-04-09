# BuddyScript

Full-stack social feed application built for the Appifylab Full Stack Engineer assignment.

## Project Summary

BuddyScript implements the required Login, Register, and Feed experience using Next.js, with secure authentication, protected feed access, post creation with text and image, public/private visibility, likes, comments, replies, and liker lists.

This repository is now organized into domain folders:

1. frontend
2. backend
3. database
4. other

## Tech Stack (Actual)

### Frontend + API Layer

1. Next.js 16 (App Router)
2. React 19
3. TypeScript
4. NextAuth (credentials)
5. TanStack React Query
6. Zod validation

### Data + Infra

1. PostgreSQL
2. Prisma ORM + Prisma migrations
3. Redis (`ioredis`) for rate limiting and feed caching
4. Cloudinary for image upload and delivery

### Security Utilities

1. bcryptjs for password hashing

## Assignment Requirement Coverage

## 1) Authentication and Authorization

Implemented:

1. Registration with first name, last name, email, password
2. Secure login flow
3. Password hashing using bcrypt
4. Protected feed route
5. Unauthorized request blocking at API level

Out of scope by assignment and intentionally not implemented:

1. Forgot password
2. Additional auth features beyond requested scope

## 2) Feed Page Requirements

Implemented:

1. Feed accessible only after login
2. Newest posts first ordering
3. Create post with text and image
4. Public and private post visibility rules
5. Correct post like and unlike state
6. Comments and replies
7. Like and unlike for comments and replies
8. Show who liked a post, comment, or reply

Visibility behavior:

1. Public posts are visible to all authenticated users
2. Private posts are visible only to the author

## 3) Best Practices, Security, and Scale

Implemented:

1. Schema validation and input constraints
2. Route and API authorization checks
3. Redis-backed rate limiting with fallback behavior
4. Structured security and performance logging
5. Cursor-based feed pagination
6. Redis feed caching and invalidation
7. Composite database indexes for high-read feed patterns
8. Optimistic UI updates for interaction responsiveness

## Refoldered Repository Structure

```text
buddyscript/
├─ frontend/                      # Active Next.js app (UI + API routes)
│  ├─ src/
│  │  ├─ app/                     # pages + route handlers
│  │  ├─ components/              # UI components
│  │  ├─ features/                # modularized domains (feed)
│  │  ├─ hooks/                   # compatibility shims/shared hooks
│  │  ├─ lib/                     # auth, prisma, redis, security, utils
│  │  └─ types/
│  ├─ public/
│  ├─ package.json
│  └─ prisma.config.ts
├─ database/
│  └─ prisma/                     # schema + migrations
├─ backend/                       # separate archived reference backend
├─ other/
│  ├─ docs/
│  ├─ archive/
│  ├─ scripts/
│  └─ static-html/
└─ package.json                   # root scripts
```

## Key Features Implemented

### Auth

1. Register and login
2. Protected navigation and route guarding
3. Session-aware API access

### Feed

1. Post composer with visibility toggle
2. Infinite feed with cursor pagination
3. Ownership-aware post menu actions

### Social Interactions

1. Like and unlike on posts
2. Comment and reply creation
3. Like and unlike on comments and replies
4. Likers modal for posts, comments, and replies

### UX

1. Preserved provided design direction
2. Responsive feed layout
3. Avatar fallback initials logic

## Implemented Security, Performance, and Scalability Features

### Security Features Implemented

1. Password hashing with bcrypt
2. Protected route access and API-level authorization checks
3. Strict request validation with Zod
4. Redis-backed rate limiting on sensitive endpoints
5. Security event logging with structured payloads
6. Safe error responses (no internal stack traces exposed to users)
7. Security headers configured in Next.js

### Performance Features Implemented

1. Redis feed caching with hit and miss handling
2. Cache invalidation on write operations (create/delete)
3. Optimistic UI updates for faster perceived interaction speed
4. React Query stale/cache tuning to reduce unnecessary refetches
5. Lazy loading and async decoding for feed images
6. Dynamic import of heavier feed subcomponents
7. Memoized feed card rendering
8. Cloudinary image transformation for payload reduction
9. API performance telemetry logging (timings, payload size, cache status)

### Scalability Features Implemented

1. Cursor-based feed pagination for stable high-volume reads
2. Composite PostgreSQL indexes for visibility and recency query paths
3. Like-recency indexing for faster liker lookups
4. Redis-backed shared rate limiting strategy (multi-instance ready)
5. Modularized feature architecture in frontend for long-term maintainability

## Security Implementations

1. Password hashing (bcrypt)
2. Protected API routes and middleware checks
3. Input validation via Zod
4. Rate limit controls on sensitive routes
5. Security event logging (`category: security`)
6. Safe user-facing error handling
7. Security headers from Next configuration

## Performance and Scalability Implementations

### API and Caching

1. Redis feed cache with HIT and MISS response behavior
2. Cache invalidation on post mutations
3. Query tuning to reduce unnecessary refetching
4. Performance telemetry (`category: performance`)

### Database

1. Cursor pagination for feed requests
2. Composite indexes on visibility and recency paths
3. Like recency index support

### Frontend Rendering

1. Optimistic updates for post interactions
2. Image payload optimization via Cloudinary transforms
3. Lazy image loading and async decoding
4. Dynamic import of heavier feed subcomponents
5. Memoized post rendering

## API Overview

Primary routes implemented under frontend API handlers:

1. `/api/auth/signup`
2. `/api/auth/[...nextauth]`
3. `/api/posts` and nested routes (`/like`, `/likes`, comments)
4. `/api/comments/*`
5. `/api/replies/*`
6. `/api/upload-signature`
7. `/api/health/redis`

## Local Development Setup

### Prerequisites

1. Node.js 20+
2. PostgreSQL instance
3. Redis instance
4. Cloudinary account

### 1) Install dependencies

```bash
cd buddyscript
npm install
npm --prefix frontend install
```

### 2) Configure environment variables

Set values in `frontend/.env.local` for:

1. `DATABASE_URL` (PostgreSQL)
2. `REDIS_URL`
3. Cloudinary credentials
4. NextAuth values (`AUTH_SECRET`, `NEXTAUTH_URL`)

### 3) Prisma setup

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4) Run application

```bash
npm run dev
```

Then open:

1. `http://localhost:3000`

## Root Scripts

Available from repository root:

1. `npm run dev`
2. `npm run build`
3. `npm run start`
4. `npm run lint`
5. `npm run prisma:generate`
6. `npm run prisma:migrate`

## Deliverables Checklist

1. GitHub repository link
2. YouTube walkthrough link (unlisted/private)
3. Live URL (optional, recommended)
4. README documentation

## Deployment

This repository is deployment-ready for:

1. Frontend (Next.js app) on Vercel
2. Backend (Express app in `backend/`) on Render

### Frontend on Vercel

1. Import this GitHub repository in Vercel.
2. Set **Root Directory** to `frontend`.
3. Vercel will use `frontend/vercel.json` and run `npm run build`.
4. Configure environment variables in Vercel Project Settings:
	1. `DATABASE_URL`
	2. `REDIS_URL`
	3. `CLOUDINARY_CLOUD_NAME`
	4. `CLOUDINARY_API_KEY`
	5. `CLOUDINARY_API_SECRET`
	6. `AUTH_SECRET`
	7. `NEXTAUTH_URL` (set to your Vercel production URL)

Notes:

1. Build step includes Prisma client generation automatically.
2. The active app API is in `frontend/src/app/api`, so the frontend is self-contained on Vercel.

### Backend on Render

1. In Render, create a **Blueprint** from this repo (uses `render.yaml`), or create a Web Service manually with root directory `backend`.
2. Build command: `npm install && npm run build`
3. Start command: `npm run start`
4. Health check path: `/health`
5. Configure required environment variables:
	1. `DATABASE_URL`
	2. `REDIS_URL`
	3. `JWT_SECRET`
	4. `CLOUDINARY_CLOUD_NAME`
	5. `CLOUDINARY_API_KEY`
	6. `CLOUDINARY_API_SECRET`
6. Configure recommended variables:
	1. `CLIENT_URL` (your Vercel frontend URL)
	2. `ALLOWED_ORIGINS` (comma-separated allowed origins, include your Vercel URL)
	3. `REFRESH_TOKEN_SECRET`

### Environment Configuration Notes

1. Vercel frontend and Render backend can share the same Cloudinary and Redis resources.
2. If you use a managed database (Neon/Supabase/Railway/etc), use a production connection string for each service.
3. Keep CORS strict in Render by setting `ALLOWED_ORIGINS` to known frontend domains only.

## Notes

1. Active backend for this implementation is in `frontend/src/app/api`.
2. `backend/` is retained as archived/separate reference material.
3. `other/archive/` retains legacy/reference artifacts for traceability.
