# Frontend Architecture & Developer Guide

> Stack: Next.js 16 · React 19 · TypeScript 5 · TanStack React Query 5 · Axios · Bootstrap 5

---

## System Overview

This is the frontend for a social feed application where authenticated users browse a paginated feed, create public or private posts with images, and interact through threaded comments, replies, and per-level likes. The client communicates with the backend over a REST API, managing server state through React Query and persisting authentication across page refreshes with a two-token strategy.

The app is built on the **Next.js App Router**. All pages are Server Components by default; components that require browser APIs or interactivity are explicitly marked `'use client'`. Route protection is enforced in middleware before any page component executes.

---

## Architecture

```
Browser
  └── Next.js Middleware (proxy.ts)         ← cookie check, redirect
        └── App Router Page (Server Component)
              └── Client Component subtree  ← React Query, hooks, state
                    └── API Layer (lib/api.ts)
                          └── Backend REST API
```

**Pages** are thin — they render a single client component and nothing else. All interactive logic lives in components, hooks, and the API layer.

**Hooks** own the data-fetching contract. Components never call `axios` directly; they call a hook that returns query state or mutation functions. This keeps components focused on rendering and makes the data layer independently testable.

**The API layer** (`lib/api.ts`) is a single Axios instance shared across the entire app. All token attachment and silent refresh logic is centralized there, so no component or hook needs to handle 401s.

---

## Authentication & Token Strategy

### Two-Token Architecture

The frontend mirrors the backend's token design:

| Token | Lifetime | Storage | Purpose |
|---|---|---|---|
| Access token (JWT) | 15 minutes | `localStorage` (`accessToken`) | Sent as `Authorization: Bearer` on every request |
| Refresh token (JWT) | 7 days | `httpOnly` cookie (server-set) | Never readable by JavaScript — used only by `/auth/refresh-token` |
| Session signal | 7 days | `js-readable` cookie (`bs_session`) | Readable by Next.js middleware to gate routes without hitting the API |

The access token being in `localStorage` means it is accessible to JavaScript. This is a known trade-off. The refresh token in an `httpOnly` cookie is the more sensitive credential, and it is completely inaccessible to scripts — so even if an XSS attack reads the access token, it cannot obtain a fresh one without the cookie.

### Token Helpers (`lib/auth.ts`)

Three functions form the entire auth state API:

```ts
getToken()          // reads localStorage, returns null on server (SSR-safe)
setToken(token)     // writes access token to localStorage, stores User object
clearToken()        // wipes localStorage + manually expires the bs_session cookie
```

`setToken` also accepts a `user` object and stores it as JSON under `authUser`. This avoids a `/auth/me` fetch on every page load — the client reconstructs the `currentUser` from localStorage on mount.

`clearToken` deletes both localStorage keys and manually sets `bs_session=; max-age=0` to expire the cookie client-side. This ensures that after logout, the middleware will redirect the user back to `/login` on the next navigation.

### Middleware (`proxy.ts`)

Next.js middleware runs at the Edge before any page renders. It checks for the `bs_session` cookie and applies two rules:

```
/feed/*          — requires bs_session → redirect to /login if missing
/login, /register — requires no session → redirect to /feed if present
```

The middleware never verifies the JWT — that would require the secret and a crypto operation at the Edge on every request. It only checks cookie presence. The actual token verification happens on the backend when an API call is made. If a user has a stale or manually forged `bs_session` cookie, they will reach the feed page but every API call will return 401 and the Axios interceptor will redirect them to `/login` after a failed refresh.

This design keeps the middleware fast (cookie read only) without sacrificing correctness.

### Silent Token Refresh

The Axios response interceptor implements a queuing mechanism to handle concurrent requests during token refresh:

```
Request fails with 401
  └── Is this already a retry? → fail (prevents infinite loop)
  └── Is refresh already in progress?
        YES → queue this request, await refresh promise
        NO  → set flag, call POST /auth/refresh-token
              ├── success → setToken(newToken), flush queue, retry original
              └── failure → clearToken(), redirect to /login, flush queue with error
```

The queue is critical. Without it, five simultaneous API calls that all expire at the same moment would each independently trigger a refresh, and four of those would fail because the refresh token was already rotated by the first call. The queue ensures only one refresh happens regardless of how many requests are in-flight.

---

## Data Fetching

### Query Provider

React Query is initialized with two global defaults:

```ts
staleTime: 30_000   // data stays fresh for 30 seconds before background refetch
retry: 1            // one automatic retry on network failure
```

The 30-second `staleTime` prevents redundant re-fetches when a user navigates between components that display the same data (e.g., opening and closing the comment section). The DevTools panel is included only in development builds.

### Feed Pagination — `useInfinitePosts`

```ts
useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam }) => api.get(`/posts?limit=10&cursor=${pageParam}`),
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
})
```

The query fetches 10 posts per page. `getNextPageParam` returns `undefined` when `nextCursor` is null, which tells React Query there are no more pages. The component flattens `data.pages` into a single array for rendering:

```ts
const posts = data?.pages.flatMap(page => page.posts) ?? []
```

`PostList` uses an `IntersectionObserver` on a sentinel `<div>` at the bottom of the list. When it enters the viewport (threshold 0.1), `fetchNextPage()` is called. This implements infinite scroll without a "Load more" button.

### Like Mutations — `useLike`

Likes use **optimistic updates** to make the UI feel instant:

```
User clicks like
  └── Snapshot current query cache
  └── Immediately toggle userLiked + update count in cache
  └── Send POST /posts/:id/like to server
        ├── success → invalidate query to sync actual count
        └── error   → restore snapshot (rollback)
```

The mutation accepts `target: 'post' | 'comment' | 'reply'` and `targetId`, then selects the correct endpoint and cache key. Rollback ensures the UI never shows an incorrect state for longer than one network round-trip.

### Comment Mutations — `useComments`

`useComments(postId)` returns:
- `comments` — query result (paginated list)
- `createComment(content)` — POST, invalidates comment list
- `deleteComment(id)` — DELETE, invalidates comment list
- `createReply(commentId, content)` — POST, invalidates reply list
- `deleteReply(id)` — DELETE, invalidates reply list

Comment creation also performs an **optimistic increment** on the parent post's `commentsCount` directly in the `['posts']` cache, so the counter on the post card updates before the server responds.

### Image Upload — `ImageUpload`

Images never pass through the Next.js server. The upload flow:

```
1. User selects file (≤ 10 MB, image/* only)
2. Client calls GET /upload/sign  → { signature, timestamp, apiKey, cloudName }
3. Client POSTs file + signature directly to Cloudinary's upload API
4. Cloudinary returns { secure_url }
5. Client stores secure_url and includes it in the POST /posts body
```

Step 3 never touches the application server. Cloudinary verifies the HMAC signature from step 2 and rejects unsigned uploads. This keeps the Express server out of the binary data path entirely and avoids the `multer`/`busboy` complexity in the backend.

---

## Component Architecture

### Pages (App Router)

```
app/
├── page.tsx           → <Redirect to="/login" />
├── layout.tsx         → Root layout: fonts, CSS, ErrorBoundary, QueryProvider
├── login/page.tsx     → <LoginForm />
├── register/page.tsx  → <RegisterForm />
└── feed/page.tsx      → <FeedPage />
```

Each page is minimal by design — it renders one component. All behavior lives in the component tree below.

### Auth Forms

Both `LoginForm` and `RegisterForm` follow the same post-submit flow:

```
1. POST /auth/login (or /auth/register)
2. setToken(accessToken)        ← stores in localStorage
3. setUser(user)                ← stores JSON in localStorage
4. document.cookie = 'bs_session=1; max-age=604800'  ← signals middleware
5. router.push('/feed')
```

`RegisterForm` adds client-side password confirmation validation before the request is sent. Neither form exposes raw backend error objects — they display the `message` string from the API response.

### Feed Layout

`FeedPage` is the root client component for the feed. It:
1. Reads `currentUser` from localStorage on mount, redirects to `/login` if absent
2. Persists dark mode state in `localStorage` as `'dark'` / `'light'`
3. Renders a three-column Bootstrap grid: `LeftSidebar | Feed | RightSidebar`
4. On mobile, the sidebars collapse and a hamburger menu activates `MobileSidebar`

The dark mode toggle adds/removes a CSS class on the feed wrapper (`_dark_wrapper`). All dark-mode styles are handled in CSS — the React component only manages the boolean.

### PostList — Infinite Scroll

```
PostList
  └── PostCard × N
  └── <div ref={sentinelRef} />    ← IntersectionObserver target
  └── Loading spinner              ← shown when fetchNextPage is in-flight
```

The `IntersectionObserver` fires when the sentinel is 10% visible. `isFetchingNextPage` is used (not `isFetching`) so that the spinner only appears during page-load transitions, not during background refetches.

Three render states:
- **Initial load**: 3 `PostSkeleton` components (prevents layout shift)
- **Error**: Retry button that calls `refetch()`
- **Empty feed**: Prompt to create the first post

### PostCard

Each card displays:
- Author avatar (with deterministic color fallback for missing images), name, relative timestamp, visibility badge
- Post content text (full — no truncation in this implementation)
- Post image (Next.js `<Image>` with Cloudinary remote pattern)
- `AvatarStack` — top 3 likers overlapping, clicking opens `LikesModal`
- Action bar: Like, Comment, Share

The like button applies an immediate visual toggle via the optimistic update in `useLike`. The count shown is always from the cache, so it reflects the optimistic state until the server responds.

Post deletion is author-only. The 3-dot `OptionsMenu` is rendered conditionally on `post.author.id === currentUser.id`. Deletion is confirmed via a modal before calling the delete mutation.

### CommentSection & Threading

```
CommentSection
  └── CommentComposer
  └── CommentItem × N
        └── ReplyComposer (conditional)
        └── ReplyItem × N (lazy — loaded on "View N replies" click)
```

Comments are loaded with `limit=50` per request. Replies are loaded on demand — `useReplies(commentId)` is only enabled when the user expands the reply section. This avoids fetching reply data for every comment in the visible feed.

`CommentComposer` submits on Enter and inserts a newline on Shift+Enter, matching the convention established by most chat and social interfaces.

Threading is capped at two levels: posts → comments → replies. `ReplyItem` renders no further nesting controls.

### Avatar

`Avatar` renders a circular image or a fallback initials badge. The fallback color is derived deterministically from the user's name:

```ts
const colors = ['#1890ff', '#52c41a', '#faad14', /* 5 more */]
const index = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length
```

This means the same user always gets the same color — without requiring any server-side color assignment or storage.

### AvatarStack

Displays up to 3 overlapping avatar circles for recent likers, with a `+N` badge for the remainder. Clicking anywhere on the stack opens the `LikesModal`. The badge click handler calls `e.stopPropagation()` to prevent triggering the underlying like action on the post card.

Overlap spacing scales with viewport width using `clamp()`, so the stack doesn't overflow on narrow screens.

---

## Routing & Navigation

```
/              → redirect to /login (app/page.tsx)
/login         → LoginForm
/register      → RegisterForm
/feed          → FeedPage (protected)
```

The middleware matcher covers `/feed/:path*`, `/login`, and `/register`. Any route not in the matcher is unprotected — but there are currently no other routes.

On logout, `clearToken()` is called (wipes localStorage and expires the cookie) followed by `router.push('/login')`. The middleware will then block any back-navigation to `/feed`.

---

## Styling

The app uses Bootstrap 5 as the grid system and reset layer, with all component styles written in custom CSS files loaded globally:

```
public/assets/css/
├── bootstrap.min.css   ← grid, utilities, reset
├── common.css          ← shared layout primitives
├── main.css            ← component-level styles
└── responsive.css      ← media query overrides
```

Class names follow a prefixed convention (`_post_card`, `_feed_inner`, `_padd_t24`) that avoids collisions with Bootstrap utility classes. Dark mode is implemented via a single wrapper class `_dark_wrapper` applied to the feed root — CSS rules inside dark mode blocks override the light defaults.

The Poppins typeface (weights 100–800) is loaded from Google Fonts in the root layout, applied globally via `font-family`.

---

## Error Handling

**API errors** — The Axios interceptor catches all responses. 401s trigger the refresh flow described above. Other 4xx/5xx errors propagate as rejected promises; components catch them in React Query's `error` state and display inline messages.

**Error boundary** — `ErrorBoundary` wraps the entire app in the root layout. If a component throws during render, the boundary catches it and shows a fallback rather than crashing the entire page. This is particularly important during development when a bad API response shape could cause a null-dereference in a component.

**Form validation** — Both auth forms validate locally before firing the network request. The server also validates; backend error messages are forwarded to the UI as-is for consistency (they go through the same Zod-validated response shape).

---

## Setup

### Prerequisites

- Node.js ≥ 20
- Backend running at `http://localhost:8000`

### Environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

In production, replace with the deployed backend URL.

### Running

```bash
cd frontend
npm install
npm run dev     # starts at http://localhost:3000
```

Next.js image optimization is configured to allow `res.cloudinary.com` as a remote pattern in `next.config.ts`. Without this entry, Next.js will refuse to optimize Cloudinary images and throw a configuration error.

---

## Trade-offs & Future Considerations

**Access token in localStorage** — The current implementation stores the access token in `localStorage`. This is readable by any script on the page, making it vulnerable to XSS. The ideal improvement is to store the access token in memory (a module-level variable or Zustand store) so it survives React re-renders but is wiped on page refresh, forcing a silent refresh via the httpOnly cookie. This requires no backend changes.

**No global auth context** — `currentUser` is read from localStorage on mount inside `FeedPage`. If multiple components needed the user object, this pattern would lead to duplicate reads and potential inconsistency. The natural next step is a `useAuthContext` hook backed by a `React.createContext` that is populated once at the `QueryProvider` level.

**Static sidebar content** — `LeftSidebar` and `RightSidebar` show hardcoded users, events, and friends. These were included to match the original design template but are not connected to real data. Connecting them would require `/users/suggestions`, `/users/friends`, and `/events` endpoints on the backend.

**No post edit** — Posts can be created and deleted but not edited. The composer would need a controlled edit mode, and the backend would need a `PATCH /posts/:id` endpoint.

**No real-time updates** — The feed does not push new posts to connected clients. A new post from another user only appears after a manual refresh or when the user triggers a refetch. WebSockets or Server-Sent Events would solve this; the React Query cache is already structured to accept incremental updates.

**Share button is a placeholder** — The action bar renders a Share button that is not yet wired to any functionality. Native Web Share API (`navigator.share`) or a copy-to-clipboard implementation would be the simplest additions.
