# BuddyScript

BuddyScript is a full-stack social feed application built for the Appifylab Full Stack Engineer assignment.

## Live Deployment

- Live App (Vercel): https://buddyscript-mbillahcsesust20-gmailcoms-projects.vercel.app
- Deployment Platform: Vercel
- Runtime: Next.js (App Router) on Node.js

## Assignment Deliverables

- GitHub Repository: https://github.com/MBillahsust/buddyscript
- YouTube Walkthrough: TODO (add unlisted link)
- Live URL: https://buddyscript-mbillahcsesust20-gmailcoms-projects.vercel.app
- README Documentation: This file

## Project Scope

Implemented as required:

1. Authentication (Register/Login)
2. Protected feed page
3. Post creation with text/image and visibility control
4. Social interactions (likes, comments, replies)
5. Security and scalability best-practice implementation

Intentionally out of scope (not required by assignment):

1. Forgot password
2. OAuth social login
3. Full notification system

## Tech Stack

### Frontend + API Runtime

1. Next.js 16 (App Router)
2. React 19
3. TypeScript
4. NextAuth (credentials)
5. TanStack React Query
6. Zod validation

### Data + Infrastructure

1. PostgreSQL
2. Prisma ORM + Migrations
3. Redis (ioredis) for rate limiting and feed caching
4. Cloudinary for media upload and delivery

### Security

1. bcryptjs password hashing
2. Request validation and authz checks
3. Security/performance audit logging

## Requirement-by-Requirement Coverage

### 1) Authentication and Authorization

Implemented:

1. Registration with first name, last name, email, password
2. Login with credentials
3. Password hashing with bcryptjs
4. Protected route access to feed
5. API-level unauthorized access blocking

### 2) Feed Page Requirements

Implemented:

1. Feed accessible only after login
2. Newest-first ordering
3. Post creation (text and optional image)
4. Public/private visibility support
5. Post like/unlike
6. Comment and reply create flows
7. Comment/reply like/unlike
8. Liker listing for posts, comments, and replies

Visibility rules:

1. Public posts are visible to authenticated users
2. Private posts are visible only to the author

### 3) Best Practices, Security, and Scalability

Implemented:

1. Zod input validation and schema constraints
2. API auth/authz route guards
3. Redis-backed rate limits (with safe fallback)
4. Cursor-based pagination for feed endpoints
5. Redis feed caching + invalidation strategy
6. Composite DB indexing for read-heavy patterns
7. Structured security and performance logs
8. Optimistic UI updates for responsive UX

## Architecture Overview

The repository is organized into clear domain folders:

```text
buddyscript/
|- frontend/                 # Next.js app (UI + API route wrappers)
|- backend/                  # Real API implementation logic
|- database/                 # Prisma schema and migrations
|- other/                    # docs/scripts/static references
`- package.json              # root scripts
```

How request handling works:

1. Next.js API routes live under `frontend/src/app/api`
2. Those files are thin wrappers that re-export handlers
3. Main handler implementation is in `backend/src/api`

This keeps deployment simple on Vercel while preserving clean frontend/backend separation in code.

## API Surface (Core)

1. `/api/auth/signup`
2. `/api/auth/[...nextauth]`
3. `/api/posts`, `/api/posts/[id]`, `/api/posts/[id]/like`, `/api/posts/[id]/likes`, `/api/posts/[id]/comments`
4. `/api/comments`, `/api/comments/[commentId]`, `/api/comments/[commentId]/like`, `/api/comments/[commentId]/likes`
5. `/api/replies`, `/api/replies/[replyId]`, `/api/replies/[replyId]/like`, `/api/replies/[replyId]/likes`
6. `/api/upload-signature`
7. `/api/health/db`
8. `/api/health/redis`

## Local Development

### Prerequisites

1. Node.js 22.x (recommended)
2. PostgreSQL database
3. Redis instance
4. Cloudinary account

### Setup

```bash
cd buddyscript
npm install
npm --prefix frontend install
```

Create `frontend/.env.local` with:

```env
DATABASE_URL="postgresql://..."
REDIS_URL="rediss://..."

CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

AUTH_SECRET="..."
NEXTAUTH_SECRET="..."   # keep same value as AUTH_SECRET
NEXTAUTH_URL="http://localhost:3000"
```

Run Prisma and app:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Open http://localhost:3000

## Production Deployment (Vercel)

This project is deployed on Vercel.

### Vercel Project Configuration

1. Root Directory: `frontend`
2. Build command: `npm run build`
3. Install command: `npm install --include=dev`
4. Node.js version: `22.x`

### Required Environment Variables (Production)

1. `DATABASE_URL`
2. `REDIS_URL`
3. `CLOUDINARY_CLOUD_NAME`
4. `CLOUDINARY_API_KEY`
5. `CLOUDINARY_API_SECRET`
6. `AUTH_SECRET`
7. `NEXTAUTH_SECRET` (same value as `AUTH_SECRET`)
8. `NEXTAUTH_URL` (exact production base URL, no trailing slash)

Recommended value:

```env
NEXTAUTH_URL="https://buddyscript-mbillahcsesust20-gmailcoms-projects.vercel.app"
```

## Verification Checklist (Evaluator Friendly)

After deployment, verify:

1. App opens: `/login`, `/register`, `/feed`
2. Signup works and creates user
3. Login works and session is established
4. Create post (public/private) works
5. Like/comment/reply flows work
6. Health checks respond:
   - `/api/health/db`
   - `/api/health/redis`

## NPM Scripts (Root)

1. `npm run dev`
2. `npm run build`
3. `npm run start`
4. `npm run lint`
5. `npm run prisma:generate`
6. `npm run prisma:migrate`

## Notes

1. Backend implementation source is under `backend/src/api`
2. Frontend route wrappers are under `frontend/src/app/api`
3. Project keeps assignment scope while applying practical production safeguards
