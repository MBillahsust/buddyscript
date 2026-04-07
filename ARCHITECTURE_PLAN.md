# BuddyScript — Full Architecture & Implementation Plan

> **App Name:** BuddyScript (from the provided HTML `<title>`)  
> **Stack:** Next.js 14 (App Router, TypeScript) + PostgreSQL + Prisma + NextAuth.js v5 + Cloudinary + TanStack React Query  
> **Design:** Original CSS imported verbatim — zero rewrite, all class names preserved exactly

---

## 1. DESIGN ANALYSIS (What the HTML Tells Us)

### Pages Provided
| Page | Layout | Key Design Elements |
|------|--------|-------------------|
| **Login** | 8-col image + 4-col form, decorative SVG shapes | Logo, "Welcome back", email/password fields, "Remember me", Google button (can be dummy), link to Register |
| **Registration** | 8-col image + 4-col form, same shapes | Logo, "Get Started Now", email/password/repeat-password, terms checkbox, link to Login |
| **Feed** | Navbar + 3-col layout (3-6-3) | Left sidebar (Explore, Suggested People, Events), Middle (Stories, Post composer, Timeline posts with comments), Right sidebar (You Might Like, Your Friends list) |

### Design Tokens (from `:root` in `common.css`)
```
--color5: #1890FF    (Primary blue — buttons, links, active states)
--color6: #212121    (Titles)
--color7: #666666    (Body text, icons)
--bg1:    #F0F2F5    (Page background)
--bg2:    #FFFFFF    (Card backgrounds)
--bg3:    #F5F5F5    (Input backgrounds)
Font:     'Poppins', sans-serif
```

### Registration Form — IMPORTANT NOTE
The provided HTML only has Email, Password, Repeat Password. But the task requirement says:
> "Registration should include: first name, last name, email, and password."

**Action:** Add first name + last name fields to the registration form using the same `_social_registration_form_input` class pattern. The task requirements override the HTML — they explicitly say you can add to the design for required functionality.

### Non-Required HTML Features — KEEP BUT LEAVE STATIC
The HTML includes features NOT in the requirements (stories, notifications, chat, dark mode, friend requests, search). **Keep all of these in the UI as static/decorative elements.** The task says "stick to the provided design" — removing them would break the layout. Render them with the correct class names and dummy data but do NOT wire them to any backend logic.

---

## 2. FINAL TECH STACK

| Concern | Choice | Reason |
|---------|--------|--------|
| **Framework** | Next.js 14 (App Router, TypeScript) | SSR for initial feed load, API routes eliminate separate server, file-based routing |
| **Auth** | NextAuth.js v5 (JWT strategy) + bcryptjs | Standard Next.js auth, httpOnly cookie, Google OAuth support built-in |
| **Database** | PostgreSQL + Prisma ORM | ACID transactions for likes, cursor pagination, composite indexes for scale |
| **Images** | Cloudinary (signed client-side upload) | Serverless-safe (no disk), CDN delivery, free tier sufficient |
| **Data Fetching** | TanStack React Query | Optimistic updates for likes, infinite cursor pagination, cache invalidation |
| **Validation** | Zod | Runtime type safety on all API inputs |
| **CSS** | Existing files imported verbatim | Zero rewrite; all class names preserved exactly |
| **Deployment** | Vercel + Neon (free PostgreSQL) | Zero-config Next.js hosting, free tiers for both |

### Why NOT Tailwind
The task says "stick to the provided design." The provided CSS (`common.css`, `main.css`, `responsive.css`) already has every style needed. Importing them directly and using the exact class names (e.g., `_social_login_form_input`, `_feed_inner_timeline_post_area`) guarantees pixel-perfect fidelity with zero risk of visual drift. Adding Tailwind would mean rewriting styles that already work — unnecessary effort and risk.

### Why TanStack React Query
Without it, every like/comment action would need manual state management, refetching, and loading states. With it:
- `useMutation` + `onMutate` gives **instant like/unlike feedback** (optimistic update)
- `useInfiniteQuery` handles **cursor-based feed pagination** with built-in `fetchNextPage`
- Cache invalidation automatically refreshes the feed when you create a new post
- This is a "millions of posts" differentiator — shows you think about production data patterns

---

## 3. DATABASE SCHEMA (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  firstName     String
  lastName      String
  email         String    @unique
  password      String    // bcrypt hashed
  avatarUrl     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  posts         Post[]
  comments      Comment[]
  replies       Reply[]
  likes         Like[]

  @@index([email])
}

model Post {
  id            String    @id @default(cuid())
  content       String
  imageUrl      String?   // Cloudinary URL
  visibility    Visibility @default(PUBLIC)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  authorId      String
  author        User      @relation(fields: [authorId], references: [id], onDelete: Cascade)

  comments      Comment[]
  likes         Like[]

  @@index([authorId])
  @@index([createdAt(sort: Desc)])   // For "newest first" feed query
  @@index([visibility])
}

model Comment {
  id            String    @id @default(cuid())
  content       String
  createdAt     DateTime  @default(now())

  authorId      String
  author        User      @relation(fields: [authorId], references: [id], onDelete: Cascade)

  postId        String
  post          Post      @relation(fields: [postId], references: [id], onDelete: Cascade)

  replies       Reply[]
  likes         Like[]

  @@index([postId, createdAt])
}

model Reply {
  id            String    @id @default(cuid())
  content       String
  createdAt     DateTime  @default(now())

  authorId      String
  author        User      @relation(fields: [authorId], references: [id], onDelete: Cascade)

  commentId     String
  comment       Comment   @relation(fields: [commentId], references: [id], onDelete: Cascade)

  likes         Like[]

  @@index([commentId, createdAt])
}

model Like {
  id            String    @id @default(cuid())
  createdAt     DateTime  @default(now())

  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Polymorphic: exactly ONE of these is set
  postId        String?
  post          Post?     @relation(fields: [postId], references: [id], onDelete: Cascade)

  commentId     String?
  comment       Comment?  @relation(fields: [commentId], references: [id], onDelete: Cascade)

  replyId       String?
  reply         Reply?    @relation(fields: [replyId], references: [id], onDelete: Cascade)

  // Unique constraints — one like per user per target
  @@unique([userId, postId])
  @@unique([userId, commentId])
  @@unique([userId, replyId])

  @@index([postId])
  @@index([commentId])
  @@index([replyId])
}

enum Visibility {
  PUBLIC
  PRIVATE
}
```

### Schema Design Decisions
- **Separate Reply model** (not self-referencing Comment) — cleaner queries, avoids recursive joins, matches the task requirement of "comments, replies, and their like/unlike system"
- **Polymorphic Like table** with unique constraints — prevents double-likes at the DB level, allows "show who liked" queries efficiently
- **Indexes on `createdAt DESC`** — critical for the "millions of posts" scalability requirement
- **Cascade deletes** — clean referential integrity

---

## 4. FOLDER STRUCTURE

```
buddyscript/
├── prisma/
│   └── schema.prisma
├── public/
│   └── assets/                  # COPY ENTIRE assets/ folder from their ZIP
│       ├── css/
│       │   ├── bootstrap.min.css
│       │   ├── common.css
│       │   ├── main.css
│       │   └── responsive.css
│       ├── images/              # All their images (logo.svg, shapes, etc.)
│       ├── fonts/               # FontAwesome + Flaticon fonts
│       └── js/                  # (skip — we use React, not their custom.js)
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout — import their CSS files globally
│   │   ├── page.tsx                 # Redirect to /login or /feed
│   │   ├── (auth)/
│   │   │   ├── layout.tsx           # Auth layout — decorative shapes, split layout
│   │   │   ├── login/
│   │   │   │   └── page.tsx         # Login page
│   │   │   └── register/
│   │   │       └── page.tsx         # Registration page
│   │   ├── (main)/
│   │   │   ├── layout.tsx           # Protected layout — Navbar, 3-col grid
│   │   │   └── feed/
│   │   │       └── page.tsx         # Feed page
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── signup/
│   │       │   │   └── route.ts     # Custom registration endpoint
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts     # NextAuth handler
│   │       ├── posts/
│   │       │   ├── route.ts         # GET (list), POST (create)
│   │       │   └── [postId]/
│   │       │       ├── route.ts     # GET, DELETE
│   │       │       ├── like/
│   │       │       │   └── route.ts # POST (toggle like)
│   │       │       ├── likes/
│   │       │       │   └── route.ts # GET (who liked)
│   │       │       └── comments/
│   │       │           └── route.ts # GET, POST
│   │       ├── comments/
│   │       │   └── [commentId]/
│   │       │       ├── like/
│   │       │       │   └── route.ts
│   │       │       └── replies/
│   │       │           └── route.ts # GET, POST
│   │       ├── replies/
│   │       │   └── [replyId]/
│   │       │       └── like/
│   │       │           └── route.ts
│   │       └── upload/
│   │           └── signature/
│   │               └── route.ts     # Generate Cloudinary signed upload params
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── feed/
│   │   │   ├── PostComposer.tsx     # "Write something" textarea + image + visibility + Post
│   │   │   ├── PostCard.tsx         # Single post with reactions, comments
│   │   │   ├── PostFeed.tsx         # Infinite scroll via useInfiniteQuery
│   │   │   ├── CommentSection.tsx   # Comments + replies for a post
│   │   │   ├── CommentItem.tsx      # Single comment with like + reply
│   │   │   ├── ReplyItem.tsx        # Single reply with like
│   │   │   ├── LikeButton.tsx       # Reusable like/unlike with optimistic update
│   │   │   ├── LikedByModal.tsx     # Modal showing who liked
│   │   │   └── VisibilityToggle.tsx # Public/Private selector dropdown
│   │   ├── layout/
│   │   │   ├── Navbar.tsx           # Uses exact HTML class names from feed.html
│   │   │   ├── LeftSidebar.tsx      # Static — Explore, Suggested People, Events
│   │   │   └── RightSidebar.tsx     # Static — You Might Like, Your Friends
│   │   └── providers/
│   │       ├── QueryProvider.tsx     # TanStack React Query provider
│   │       └── AuthProvider.tsx      # NextAuth SessionProvider
│   ├── hooks/
│   │   ├── usePosts.ts              # useInfiniteQuery for feed
│   │   ├── useCreatePost.ts         # useMutation + cache invalidation
│   │   ├── useLike.ts               # useMutation + optimistic update
│   │   ├── useComments.ts           # useQuery for comments
│   │   └── useCreateComment.ts      # useMutation for comments/replies
│   ├── lib/
│   │   ├── auth.ts              # NextAuth config
│   │   ├── prisma.ts            # Prisma client singleton
│   │   ├── cloudinary.ts        # Cloudinary signature generation
│   │   ├── validations.ts       # Zod schemas for all API inputs
│   │   └── utils.ts             # Helpers (time-ago, etc.)
│   ├── middleware.ts             # Route protection
│   └── types/
│       └── index.ts             # TypeScript types
├── .env.local
├── next.config.js
└── package.json
```

---

## 5. API ENDPOINTS

### Auth (handled by NextAuth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Custom signup route (hash password, create user) |
| POST | `/api/auth/[...nextauth]` | NextAuth sign-in/sign-out/session |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts?cursor=X&limit=10` | Paginated feed (cursor-based for performance). Returns public posts + user's private posts. Newest first. Includes author, like count, user's like state, comment count. |
| POST | `/api/posts` | Create post. Body: `{ content, imageUrl?, visibility }` |
| DELETE | `/api/posts/[postId]` | Delete own post |
| POST | `/api/posts/[postId]/like` | Toggle like/unlike. Returns new like state + count + likers list. |
| GET | `/api/posts/[postId]/likes` | Get list of users who liked this post |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts/[postId]/comments` | Get comments for a post (with replies, likes) |
| POST | `/api/comments` | Create comment. Body: `{ postId, content }` |
| POST | `/api/comments/[commentId]/like` | Toggle like on comment |

### Replies
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/replies` | Create reply. Body: `{ commentId, content }` |
| POST | `/api/replies/[replyId]/like` | Toggle like on reply |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload image to Cloudinary. Returns URL. |

---

## 6. AUTH FLOW

### Registration
```
User fills form → Client validates (first/last name, email format, password match, min 8 chars)
→ POST /api/auth/signup
→ Server: check email uniqueness → bcrypt.hash(password, 12) → prisma.user.create()
→ Auto sign-in via NextAuth signIn("credentials")
→ Redirect to /feed
```

### Login
```
User fills email + password → signIn("credentials", { email, password })
→ NextAuth authorize(): prisma.user.findUnique({ email }) → bcrypt.compare()
→ JWT token set in httpOnly cookie
→ Redirect to /feed
```

### Route Protection (middleware.ts)
```typescript
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
                     req.nextUrl.pathname.startsWith('/register')

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/feed', req.url))
  }

  if (!isAuthPage && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)']
}
```

---

## 7. KEY IMPLEMENTATION DETAILS

### CSS Import Strategy (Root Layout)
```tsx
// src/app/layout.tsx
import "@/../../public/assets/css/bootstrap.min.css"
import "@/../../public/assets/css/common.css"
import "@/../../public/assets/css/main.css"
import "@/../../public/assets/css/responsive.css"
```
Import order matters — matches the original HTML `<link>` order. Every class name from their HTML (`_social_login_wrapper`, `_feed_inner_timeline_post_area`, etc.) works immediately with zero rewriting.

### TanStack React Query — Feed Hook
```typescript
// src/hooks/usePosts.ts
export function usePosts() {
  return useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  })
}
```

### TanStack React Query — Like with Optimistic Update
```typescript
// src/hooks/useLike.ts
export function useLikePost(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => fetch(`/api/posts/${postId}/like`, { method: 'POST' }),
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      // Snapshot previous value
      const previous = queryClient.getQueryData(['posts'])
      // Optimistically toggle the like
      queryClient.setQueryData(['posts'], (old) => {
        // Toggle liked state + increment/decrement count in cache
        return toggleLikeInCache(old, postId)
      })
      return { previous }
    },
    onError: (err, vars, context) => {
      // Rollback on error
      queryClient.setQueryData(['posts'], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    }
  })
}
```
This gives **instant UI feedback** when the user clicks like — no spinner, no delay. If the server call fails, it rolls back automatically. This is the kind of UX detail that separates good submissions from great ones.

### Zod Validation Schemas
```typescript
// src/lib/validations.ts
import { z } from 'zod'

export const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const createPostSchema = z.object({
  content: z.string().min(1, "Post cannot be empty").max(5000),
  imageUrl: z.string().url().optional().nullable(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
})

export const createCommentSchema = z.object({
  postId: z.string().cuid(),
  content: z.string().min(1).max(2000),
})

export const createReplySchema = z.object({
  commentId: z.string().cuid(),
  content: z.string().min(1).max(2000),
})
```
Every API route calls `schema.parse(body)` before touching the database. Returns 400 with field-specific error messages on validation failure.

### Feed Query (Scalability-Optimized)
```typescript
// Cursor-based pagination — O(1) even with millions of rows
const posts = await prisma.post.findMany({
  where: {
    OR: [
      { visibility: "PUBLIC" },
      { authorId: currentUserId, visibility: "PRIVATE" }
    ]
  },
  orderBy: { createdAt: "desc" },
  take: 10,
  ...(cursor && {
    skip: 1,
    cursor: { id: cursor }
  }),
  include: {
    author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    likes: { select: { userId: true, user: { select: { firstName: true, lastName: true } } } },
    _count: { select: { comments: true, likes: true } }
  }
})
```

### Like Toggle (Atomic Operation)
```typescript
// Upsert pattern — race-condition safe
const existing = await prisma.like.findUnique({
  where: { userId_postId: { userId, postId } }
})

if (existing) {
  await prisma.like.delete({ where: { id: existing.id } })
  return { liked: false }
} else {
  await prisma.like.create({ data: { userId, postId } })
  return { liked: true }
}
```

### Image Upload Flow (Signed Client-Side Upload)
```
Client: User picks image → POST /api/upload/signature (get signed params)
Server: Generate { timestamp, signature, api_key, cloud_name, folder }
Client: POST directly to https://api.cloudinary.com/v1_1/{cloud}/image/upload
         with { file, timestamp, signature, api_key }
Cloudinary returns: { secure_url, public_id }
Client: Store secure_url → Include in POST /api/posts body
```
**Why client-side?** Image bytes never hit your server — faster uploads, no server memory pressure, works perfectly on Vercel's serverless (which has 4.5MB body limit). The signature endpoint just generates auth params (tiny JSON response).

### Private/Public Post Visibility
- Post composer includes a dropdown/toggle: Public (globe icon) / Private (lock icon)
- Stored as `visibility` enum in DB
- Feed query filters: show all PUBLIC posts + only current user's PRIVATE posts
- Matches the design's "Public" label shown next to post time in the HTML

---

## 8. COMPONENT DESIGN MAPPING (HTML → React)

| HTML Section | React Component | Key Props |
|-------------|----------------|-----------|
| `_social_login_wrapper` | `(auth)/layout.tsx` | Decorative shapes, split layout |
| `_social_login_form` | `LoginForm.tsx` | Form state, validation, signIn() |
| `_social_registration_form` | `RegisterForm.tsx` | Form state, validation, signup API |
| `navbar` | `Navbar.tsx` | User profile dropdown, logo, search (static) |
| `_layout_left_sidebar` | `LeftSidebar.tsx` | Explore links (mostly static/decorative) |
| `_feed_inner_text_area` | `PostComposer.tsx` | Textarea, image upload, visibility toggle, post button |
| `_feed_inner_timeline_post_area` | `PostCard.tsx` | Post content, image, reactions, comments |
| `_feed_inner_timeline_reaction` | Like/Comment/Share buttons | Like toggle, comment expand |
| `_timline_comment_main` | `CommentSection.tsx` | Comment list, nested replies |
| `_comment_main` | `CommentItem.tsx` | Comment text, like count, reply input |
| `_layout_right_sidebar` | `RightSidebar.tsx` | Friends list (mostly static/decorative) |

---

## 9. SECURITY CHECKLIST

- [x] **Passwords**: bcrypt with salt rounds = 12
- [x] **JWT**: httpOnly, secure, SameSite=Lax cookies (NextAuth handles this)
- [x] **Input validation**: Zod schemas on all API routes (server-side)
- [x] **SQL injection**: Prisma parameterizes all queries automatically
- [x] **XSS**: React auto-escapes. Never use `dangerouslySetInnerHTML`
- [x] **CSRF**: NextAuth includes CSRF tokens
- [x] **Rate limiting**: Consider adding `next-rate-limit` on auth endpoints
- [x] **Authorization**: Every API route checks `session.user.id` ownership before mutations
- [x] **File upload**: Validate file type (image/*), max size (5MB), use Cloudinary (no local storage)
- [x] **Environment vars**: All secrets in `.env.local`, never committed

---

## 10. BUILD ORDER (Implementation Phases)

### Phase 1: Foundation (Day 1)
1. `npx create-next-app@latest buddyscript --typescript --app --src-dir --no-tailwind`
2. Copy entire `assets/` folder from their ZIP into `public/assets/`
3. Import their CSS files in root `layout.tsx` (bootstrap → common → main → responsive)
4. Set up Prisma + PostgreSQL connection (Neon free tier)
5. Define schema, run `prisma migrate dev`
6. Configure NextAuth v5 with Credentials provider + JWT strategy
7. Build middleware for route protection
8. Set up TanStack React Query provider
9. **Test**: Can register, login, and access protected route

### Phase 2: Auth Pages (Day 1-2)
1. Build `(auth)/layout.tsx` — decorative shapes using exact classes (`_shape_one`, `_shape_two`, `_shape_three`)
2. Build `RegisterForm.tsx` — add first name + last name fields (using `_social_registration_form_input` class), email, password, confirm
3. Build `LoginForm.tsx` — email, password, remember me (using `_social_login_form_input` class)
4. Google buttons render but show "Coming soon" toast on click
5. Wire to NextAuth signIn/signUp
6. **Test**: Full auth flow, redirects, validation errors display

### Phase 3: Feed Layout (Day 2)
1. Build `Navbar.tsx` — convert their HTML verbatim, profile dropdown with logout (functional), everything else static
2. Build `(main)/layout.tsx` — 3-column Bootstrap grid (`container _custom_container`)
3. Build `LeftSidebar.tsx` — exact HTML from `_layout_left_sidebar_wrap`, all links are static `#0`
4. Build `RightSidebar.tsx` — exact HTML from `_layout_right_sidebar_wrap`, all dummy data
5. **Test**: Protected feed page renders, looks identical to feed.html

### Phase 4: Posts — Core (Day 2-3)
1. Build `POST /api/posts` with Zod validation and `GET /api/posts` (cursor-based pagination)
2. Build `usePosts` hook with `useInfiniteQuery` for infinite scroll
3. Build `PostComposer.tsx` — textarea, photo button → Cloudinary signed upload, visibility toggle, post button
4. Build `useCreatePost` hook with `useMutation` + queryClient.invalidateQueries(['posts'])
5. Build `PostCard.tsx` — display post using `_feed_inner_timeline_post_area` classes
6. Build `PostFeed.tsx` — renders posts from `usePosts`, Intersection Observer for load-more
7. **Test**: Create text+image posts, infinite scroll, private posts only visible to author

### Phase 5: Likes (Day 3)
1. Build `POST /api/posts/[postId]/like` (toggle) + `GET /api/posts/[postId]/likes` (who liked)
2. Build `useLikePost` hook with `useMutation` + **optimistic update** (instant UI toggle)
3. Build `LikeButton.tsx` — uses optimistic hook, shows like count, visual state
4. Build `LikedByModal.tsx` — fetches and shows who liked (names + avatars)
5. **Test**: Like/unlike is instant, survives refresh, modal shows likers

### Phase 6: Comments & Replies (Day 3-4)
1. Build `POST /api/comments` and `GET` (nested with post)
2. Build `CommentSection.tsx`, `CommentItem.tsx`
3. Build like toggle for comments
4. Build `POST /api/replies` and `ReplyItem.tsx`
5. Build like toggle for replies
6. Show "who liked" on comments and replies
7. **Test**: Full comment→reply→like chain works

### Phase 7: Polish & Deploy (Day 4)
1. Responsive design pass (the HTML has mobile-specific classes — replicate)
2. Loading states, error handling, toast notifications
3. Empty states (no posts yet, etc.)
4. Deploy to Vercel + Neon
5. Record YouTube walkthrough
6. Write brief docs (README.md)

---

## 11. WHAT TO SKIP vs WHAT TO KEEP STATIC

### Keep in UI but NON-FUNCTIONAL (static/decorative):
These are in the HTML design and must stay to preserve the layout:
- Dark mode toggle button (renders, does nothing on click)
- Stories section (story cards with static dummy images)
- Notification bell + dropdown (bell icon shows, dropdown not wired)
- Chat icon in navbar
- Friend requests nav icon
- Mobile bottom navigation
- Google sign-in/register buttons (button exists, shows toast "Coming soon" on click)
- Left sidebar: Explore links, Events cards, Suggested People
- Right sidebar: You Might Like, Your Friends list
- Search input in navbar (renders, doesn't filter)

### Actually Implement (backend + frontend):
- Auth (register, login, logout, protected routes)
- Post creation (text + image + public/private)
- Post feed (newest first, visibility rules)
- Like/unlike on posts, comments, replies + show who liked
- Comments and replies
- Profile dropdown with logout

### Completely Skip (not in HTML either):
- Forgot password
- Profile page
- Edit profile
- Friend/follow system backend

---

## 12. ENVIRONMENT VARIABLES

```env
# .env.local
DATABASE_URL="postgresql://user:pass@host:5432/buddyscript"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="your-key"
CLOUDINARY_API_SECRET="your-secret"
```

---

## 13. PACKAGES TO INSTALL

```bash
# Core
npm install next-auth@beta @prisma/client prisma bcryptjs zod

# Data Fetching
npm install @tanstack/react-query

# Image upload (signature generation only — actual upload is client-side to Cloudinary)
npm install cloudinary

# UI helpers
npm install react-hot-toast lucide-react date-fns

# Dev
npm install -D @types/bcryptjs
```

**NOT installing:**
- `tailwindcss` — using their original CSS verbatim
- `bootstrap` via npm — their `bootstrap.min.css` is already in `assets/css/`, import it directly

---

## 14. QUICK-WIN BONUS FEATURES (If Time Permits)

These are small additions that massively impress reviewers:

1. **Optimistic UI** on likes — instant feedback before server confirms
2. **Infinite scroll** with Intersection Observer — shows you think about UX
3. **Skeleton loading** states — professional feel
4. **Image preview** before posting — shows attention to UX
5. **Delete own posts** — shows authorization thinking
6. **Relative timestamps** ("5 min ago") using `date-fns formatDistanceToNow`

---

## 15. VIDEO WALKTHROUGH SCRIPT

1. Open browser → show Register page → create account → auto-redirect to feed
2. Create a text-only post (Public) → show it appears at top
3. Create a post with image (Public) → show image upload and display
4. Create a Private post → show it in your feed
5. Open incognito → register 2nd account → show private post is NOT visible, public ones are
6. Like a post → show like count updates → click "who liked" → show names
7. Add a comment → show it appears under post
8. Reply to the comment → show nested reply
9. Like comment and reply → show like states
10. Logout → show redirect to login → login again → show session persists
11. Brief code walkthrough: DB schema, API route, component structure
