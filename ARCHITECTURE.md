# Sync Board — Architecture

## 1. Overview

Sync Board is a developer collaboration platform where users can discover projects, post ideas, and request to join teams. It follows a **client-server architecture** with a React SPA communicating with an Express REST API over HTTP.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 24 |
| **Backend framework** | Express 5 |
| **Database** | MongoDB Atlas (via Mongoose 9) |
| **Auth** | bcryptjs (hashing) + jsonwebtoken (JWT) |
| **Frontend framework** | React 19 |
| **Build tool** | Vite 8 |
| **Routing** | react-router-dom 7 |
| **Icons** | lucide-react |
| **Styling** | Pure CSS (~3200 lines) with CSS custom properties |

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        Browser                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │              React SPA (:5173)                      │  │
│  │  ┌──────┐ ┌────────┐ ┌──────────┐ ┌───────────┐   │  │
│  │  │Login │ │ Signup │ │  Feed    │ │ Workspace │   │  │
│  │  │Page  │ │  Page  │ │ (3-col)  │ │  (TBD)    │   │  │
│  │  └──┬───┘ └───┬────┘ └────┬─────┘ └───────────┘   │  │
│  │     │          │           │                        │  │
│  │     └──────────┘    + AuthContext (JWT)             │  │
│  └─────────────────────┬───────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────┘
                         │ HTTP (JSON)
                         ▼
┌──────────────────────────────────────────────────────────┐
│              Express Server (:5000)                       │
│  ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌────────┐ │
│  │ CORS     │ │ JSON Parser  │ │  Auth    │ │  Auth  │ │
│  │ Middleware│ │ Middleware   │ │  Routes  │ │ Middle │ │
│  │          │ │              │ │ /signup  │ │ -ware  │ │
│  │          │ │              │ │ /login   │ │ JWT    │ │
│  └──────────┘ └──────────────┘ └────┬─────┘ └────────┘ │
│          ┌──────────────────────────┼──────────────────┐│
│          │   /api/projects/*        │  /api/*           ││
│          │  feed, request, comment  │  project CRUD     ││
│          └──────────────────────────┴──────────────────┘│
│                         │                                │
│                   Mongoose ODM                            │
│                         │                                │
└─────────────────────────┼────────────────────────────────┘
                          │
                    MongoDB Atlas
                    (Cloud Cluster)
```

---

## 3. Project Structure

```
sync-board/                          # Root (monorepo)
├── ARCHITECTURE.md                  # This document
├── package.json                     # Root scripts (concurrently)
├── package-lock.json
│
├── sync-board-b/                    # Backend
│   ├── app.js                       # Express entry point (mounts all routes)
│   ├── package.json
│   ├── .env                         # PORT, MONGO_URL, JWT_SECRET
│   ├── .gitignore
│   ├── controllers/
│   │   └── authController.js        # POST /signup, POST /login
│   ├── models/
│   │   ├── User.js                  # username, email, password, optional profile fields
│   │   └── Project.js               # title, description, techStack, likes, comments,
│   │                                #   members, joinRequest[], status, visibility
│   ├── routes/
│   │   ├── feed.js                  # GET /feed, POST /create, PUT /like/:id,
│   │   │                            #   POST /comment/:id, POST /request/:id,
│   │   │                            #   GET /incoming-requests, GET /my-requests,
│   │   │                            #   PUT /request/:projectId/:requestId
│   │   ├── project.js               # POST /add-projects, GET /project, PATCH /edit-project/:id
│   │   ├── profile.js               # GET /profile, PATCH /edit-profile
│   │   └── authRoutes.js            # Empty (unused — routing lives in controller)
│   ├── middlewares/
│   │   └── auth.js                  # JWT verification middleware (attaches req.user)
│   └── node_modules/
│
└── sync-board-f/                    # Frontend
    ├── index.html                   # Vite HTML entry
    ├── vite.config.js
    ├── package.json
    ├── eslint.config.js             # Flat ESLint config
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    └── src/
        ├── main.jsx                 # Entry, BrowserRouter, dark theme default
        ├── App.jsx                  # Route definitions
        ├── App.css                  # Empty (all styles in index.css)
        ├── index.css                # All styles (~3200 lines), CSS custom properties
        ├── api.js                   # API client functions (8 exported)
        ├── context/
        │   └── AuthContext.jsx      # Global auth state (user, token, login, logout, updateUser)
        ├── pages/
        │   ├── Login.jsx            # Sign in form
        │   ├── Signup.jsx           # Registration form
        │   ├── HomeLayout.jsx       # Wrapper with header + <Outlet>, handles navigation
        │   └── Feed.jsx             # 3-column feed: FeedLeftNav + center + FeedRightPanel
        ├── components/
        │   ├── ProjectCard.jsx      # Full project card (feed mode) + compact (trending mode)
        │   ├── CommentSection.jsx   # Expandable comments with textarea, submit
        │   ├── RequestModal.jsx     # Collaboration request modal (note input)
        │   ├── CollaborationRequestsView.jsx  # Incoming + Sent requests tabs
        │   ├── Toast.jsx            # Toast notification system
        │   │
        │   ├── Sidebar.jsx          # Orphaned — not imported
        │   ├── Dashboard.jsx        # Orphaned — not imported
        │   ├── Toolbar.jsx          # Orphaned — not imported
        │   ├── ChatPanel.jsx        # Orphaned — not imported
        │   └── Whiteboard/
        │       ├── Canvas.jsx       # Orphaned — not imported
        │       ├── IdeaCard.jsx     # Orphaned — not imported
        │       └── StickyNote.jsx   # Orphaned — not imported
        ├── hooks/
        │   ├── useTheme.js          # Dark/light theme toggle (buggy — uses undeclared `root`)
        │   └── useDraggable.js      # Pointer-based drag behavior
        └── assets/
            ├── hero.png
            ├── react.svg
            └── vite.svg
```

---

## 4. Backend Architecture

### 4.1 Entry Point (`app.js`)

```
require dotenv → create app → cors() → express.json() → mount routes → connect MongoDB → listen
```

| Step | What it does |
|------|-------------|
| `dns.setServers()` | Overrides DNS to Google (8.8.8.8, 8.8.4.4) for Atlas SRV resolution |
| `cors()` | Allows all origins (permissive, dev-only) |
| `express.json()` | Parses `application/json` request bodies |
| `app.use("/", authRoute)` | Auth routes at root (`/signup`, `/login`) |
| `app.use("/api", projectRoutes)` | Project CRUD at `/api/add-projects`, `/api/project`, `/api/edit-project/:id` |
| `app.use("/api/projects", feedRoutes)` | Feed + collaboration routes at `/api/projects/*` |
| `app.use("/", profileRoutes)` | Profile routes at `/profile`, `/edit-profile` |
| `mongoose.connect()` | Connects to MongoDB Atlas (no retry logic) |
| `app.listen()` | Starts HTTP server on configured PORT |

### 4.2 API Endpoints

#### POST /signup

| Aspect | Detail |
|--------|--------|
| **Request body** | `{ username, email, password }` |
| **Validation** | Checks all fields present (after DB lookup — order bug) |
| **Duplicate check** | `User.findOne({ email })` — returns "already exists" if found |
| **Password hashing** | `bcrypt.hash(password, 10)` |
| **Success** | `{ message, user }` — includes password hash (security issue) |
| **Error** | `{ message }` — leaks internal error messages |

#### POST /login

| Aspect | Detail |
|--------|--------|
| **Request body** | `{ email, password }` |
| **Validation** | Checks both fields present |
| **User lookup** | `User.findOne({ email })` |
| **Password verify** | `bcrypt.compare(password, user.password)` |
| **Token** | `jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1d" })` |
| **Success** | `{ message, token, user }` — includes password hash |
| **Error** | `{ message }` |

#### GET /api/projects/feed

| Aspect | Detail |
|--------|--------|
| **Query params** | `page` (default 1), `limit` (default 12, max 50), `sort` ("recent" / "trending"), `search`, `tag` |
| **Auth** | No (public) |
| **Response** | `{ projects[], page, totalPages, total, hasMore }` |
| **Details** | Uses MongoDB aggregation pipeline: `$match` → `$addFields` (likesCount) → `$sort` → `$skip` → `$limit` → `$lookup` (user + comments.user) → `$project` |

#### POST /api/projects/create

| Aspect | Detail |
|--------|--------|
| **Auth** | Required |
| **Body** | `{ title, description, techStack, note }` |
| **Validates** | Title and description required |
| **Response** | Created project (populated userId) |

#### PUT /api/projects/like/:id

| Aspect | Detail |
|--------|--------|
| **Auth** | Required |
| **Behavior** | Toggles: if user ID in likes array → remove, else → add |
| **Response** | `{ likes[], likesCount }` |

#### POST /api/projects/comment/:id

| Aspect | Detail |
|--------|--------|
| **Auth** | Required |
| **Body** | `{ text }` |
| **Response** | `{ comments[] }` — populated with user data |

#### POST /api/projects/request/:id

| Aspect | Detail |
|--------|--------|
| **Auth** | Required |
| **Body** | `{ note }` |
| **Behavior** | Pushes `{ user, note, status: "pending", createdAt }` to `project.joinRequest[]` |
| **Checks** | Duplicate request (400), already a member (400), does **not** check self-request (owner can request own project) |
| **Response** | `{ message }` |

#### GET /api/projects/incoming-requests

| Aspect | Detail |
|--------|--------|
| **Auth** | Required |
| **Query** | Finds all projects where `userId === req.user._id` AND `joinRequest.status === "pending"` |
| **Populates** | `joinRequest.user` with `username email` |
| **Response** | `{ incoming: [{ requestId, projectId, projectTitle, projectStatus, user, note, createdAt }] }` |

#### GET /api/projects/my-requests

| Aspect | Detail |
|--------|--------|
| **Auth** | Required |
| **Query** | Finds all projects where `joinRequest.user === req.user._id` |
| **Populates** | `project.userId` (owner) with `username email` |
| **Response** | `{ outgoing: [{ requestId, projectId, projectTitle, projectStatus, owner, note, status, createdAt }] }` |

#### PUT /api/projects/request/:projectId/:requestId

| Aspect | Detail |
|--------|--------|
| **Auth** | Required (project owner only — checks `userId === req.user._id`) |
| **Body** | `{ status: "accepted" | "rejected" }` |
| **Behavior** | Sets request status; if "accepted", adds requesting user to `project.members` |
| **Response** | `{ message }` |

#### GET /profile

| Auth | Response |
|------|----------|
| Required | `{ user }` — password excluded with `.select("-password")` |

#### PATCH /edit-profile

| Auth | Body | Response |
|------|------|----------|
| Required | `{ username, contactNumber, address, linkedInProfile, githubProfile }` | `{ message, user }` |

#### GET /api/project

| Auth | Response |
|------|----------|
| Required | `Project.find({ userId: req.user._id }).sort({ timestamp: -1 })` |

#### PATCH /api/edit-project/:id

| Auth | Owner guard | Behavior |
|------|-------------|----------|
| Required | `findOneAndUpdate({ _id: params.id, userId: req.user._id })` | Updates title, description, note if provided |

### 4.3 Auth Middleware (`middlewares/auth.js`)

```javascript
Reads Authorization header → extracts Bearer token → jwt.verify() → User.findById()
  → attaches full user document to req.user → next()
```

- Returns 401 if: no token, invalid token, user not found.
- Attaches the **full Mongoose User document** (including password hash) — callers should avoid exposing `req.user.password` in responses.

### 4.4 Database Schemas

#### User Model

```javascript
{
  username:      { type: String, required: true },
  email:         { type: String, required: true, unique: true },
  password:      { type: String, required: true },
  contactNumber: { type: String, default: null },   // ⚠️ was required:true, fixed
  address:       { type: String, default: null },   // ⚠️ was required:true, fixed
  linkedInProfile: { type: String, default: null }, // ⚠️ was required:true, fixed
  githubProfile: { type: String, default: null },   // ⚠️ was required:true, fixed
  Timestamp:     { type: Date, default: Date.now }
}
```

#### Project Model

```javascript
{
  title:       { type: String, required: true },
  description: { type: String, required: true },
  note:        { type: String },
  userId:      { type: ObjectId, ref: "User", required: true },  // owner
  techStack:   { type: [String], default: [] },
  likes:       [{ type: ObjectId, ref: "User" }],
  comments:    [{ user: { ObjectId, ref: "User" }, text: String, createdAt: Date }],
  members:     [{ type: ObjectId, ref: "User" }],                  // accepted collaborators
  joinRequest: [{
    user: { ObjectId, ref: "User" },
    note: String,
    status: { enum: ["pending", "accepted", "rejected"], default: "pending" },
    createdAt: { type: Date, default: Date.now }
  }],
  status:      { enum: ["open", "in_progress", "closed"], default: "open" },
  visibility:  { enum: ["public", "private"], default: "public" },
  timestamp:   { type: Date, default: Date.now }
}
```

### 4.5 Dependencies

| Package | Purpose |
|---------|---------|
| `express` | HTTP framework, routing, middleware |
| `mongoose` | MongoDB ODM, schema validation |
| `mongodb` | Official MongoDB driver (peer dependency) |
| `bcryptjs` | Pure-JS password hashing |
| `jsonwebtoken` | JWT creation and verification |
| `cors` | Cross-Origin Resource Sharing |
| `dotenv` | Environment variable loading |
| `cookie-parser` | **Installed but unused** |
| `nodemon` (dev) | Auto-restart during development |

### 4.6 Environment Variables

| Variable | Required | Used In | Purpose |
|----------|----------|---------|---------|
| `PORT` | No\* | `app.js` | HTTP server port (default 5000) |
| `MONGO_URL` | Yes | `app.js` | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | `authController.js`, `middlewares/auth.js` | HMAC secret for JWT signing |

### 4.7 Known Backend Issues

| Issue | Severity |
|-------|----------|
| All responses return HTTP 200 (no 400/401/404/500) | High |
| Password hash exposed in API responses | Critical |
| Error messages leak internal details | High |
| Validation order bug (DB check before field check in signup) | Medium |
| No input sanitization or rate limiting | Medium |
| No owner-guard in `POST /request/:id` (user can request own project) | Low |
| `cookie-parser` installed but unused | Low |
| `routes/authRoutes.js` is empty / unused | Low |

---

## 5. Frontend Architecture

### 5.1 Entry Point (`main.jsx`)

```javascript
document.documentElement.setAttribute('data-theme', 'dark')
// => Wraps <App /> in <StrictMode> + <BrowserRouter>
```

- Sets dark theme as default before first render.
- `BrowserRouter` enables client-side routing (History API).

### 5.2 Routing (`App.jsx`)

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `Login` | Sign in form |
| `/signup` | `Signup` | Registration form |
| `/feed` | `HomeLayout` → `Outlet` → `Feed` | Main 3-column feed page |
| `/create` | `HomeLayout` → `Outlet` → `CreateProject` | Create a new project |
| `/:id` | `HomeLayout` → `Outlet` → `Workspace` | Project detail / workspace |
| `*` | `Navigate to="/feed"` | Catch-all redirect (authenticated) or `/` |

### 5.3 Auth Context (`AuthContext.jsx`)

- Provides `{ user, token, loading, login, logout, updateUser }` globally.
- On mount: reads `token` and `user` from `localStorage`, verifies token with backend.
- `login(token, user)`: stores to localStorage + sets state.
- `logout()`: clears localStorage + nullifies state + navigates to `/`.
- **No ProtectedRoute wrapper** — routes check `token` internally and redirect if missing.

### 5.4 Component Tree

```
<BrowserRouter>
  <Routes>
    <Login />
    <Signup />
    <HomeLayout>                          // Header + <Outlet>
      <Route index element={<Feed />} />  // 3-column layout
      <Route path="create" />
      <Route path=":id" />
    </HomeLayout>
    <Navigate to="/feed" />
  </Routes>
</BrowserRouter>

--- Feed (3-column layout) ---
<Feed>
  <FeedLeftNav>              // Glassmorphism mini-sidebar
    Home | Explore | Notifications | Messages | Collaboration
    Profile avatar (bottom)
  </FeedLeftNav>

  <div class="feed-center">
    <CollaborationRequestsView>  // When feedView === "collaboration"
      Tabs: Incoming | Sent Requests
      Cards with accept/reject (incoming) or status pills (outgoing)
    </CollaborationRequestsView>

    <Feed Header>              // Title, search bar, New Post button
    <Filter Tabs>              // All | Trending | Recent | AI | Web Dev | Open Source
    <Trending Section>         // Horizontal scroll of compact ProjectCards
    <Main Cards>               // Full ProjectCards (infinite scroll w/ IntersectionObserver)
      <ProjectCard>
        <feed-card-actions>    // Like (toggle), View count
        <ProjectCard Actions>  // Members avatars, View Project, Collaborate (handshake)
        <CommentSection>       // Expandable: "N comments" trigger → list + textarea
      </ProjectCard>
  </div>

  <FeedRightPanel>             // Widget cards
    Trending Tags              // Clickable tag pills with counts
    Top Contributors           // Avatar + name + Follow button
  </FeedRightPanel>
</Feed>
```

### 5.5 HomeLayout (`HomeLayout.jsx`)

- Renders a sticky header with logo, navigation links (Home, Create, Workspace), user avatar dropdown.
- Uses `<Outlet />` for nested routing.
- `handleNavigate(view, project?)` → uses `useNavigate()` to route to `/feed`, `/create`, or `/:id` (workspace).
- Unused `openProject` variable exists (lint issue).

### 5.6 Key Components

#### ProjectCard
- **Two modes**: `compact` (horizontal trending card) and full `feed` (vertical card with all details).
- **Feed mode layout**: avatar + user info + status badge → title → description → tech stack pills → optional gradient thumbnail → action bar (like, views) → right actions (members, View Project, Collaborate) → CommentSection (full-width below).
- **State**: local `imgErr` for fallback avatar.
- **Engagement**: like toggle via `onLike(id)`, save bookmark via `onSave(id)`, comment via `onComment(id, text)`, collaborate via `onRequest(project)`.

#### CommentSection
- Trigger button: "N comments" — toggles open/closed.
- When open: scrollable comment list + auto-resizing `<textarea>` + submit button.
- Cmd+Enter / Ctrl+Enter submits.
- Empty state: "No comments yet. Be the first!"

#### CollaborationRequestsView
- Two tabs: **Incoming** (requests for my projects) and **Sent Requests** (my requests to others).
- Fetches from both `/incoming-requests` and `/my-requests` in parallel via `Promise.allSettled`.
- Incoming: requester avatar + name, project title, note, Accept (green) / Reject (red) buttons; on accept → user added to project members.
- Sent: project title + owner, note, status pill (Pending=yellow, Accepted=green, Rejected=red).

#### RequestModal
- Modal overlay with backdrop blur.
- Textarea for note, "Send Request" submit button.
- Loading state with spinner.

### 5.7 Orphaned (Unwired) Components

These exist in the filesystem but are **not imported or rendered** by any route:

| Component | File | Purpose |
|-----------|------|---------|
| `Sidebar` | `components/Sidebar.jsx` | Navigation (Dashboard, Projects, Team, etc.) + theme toggle |
| `Dashboard` | `components/Dashboard.jsx` | Projects grid with hardcoded cards |
| `Toolbar` | `components/Toolbar.jsx` | Floating tool palette (pen, shapes, sticky notes) |
| `ChatPanel` | `components/ChatPanel.jsx` | Floating chat with messages + input |
| `Canvas` | `components/Whiteboard/Canvas.jsx` | Whiteboard area with draggable elements + zoom |
| `StickyNote` | `components/Whiteboard/StickyNote.jsx` | Draggable sticky note with editable content |
| `IdeaCard` | `components/Whiteboard/IdeaCard.jsx` | Draggable idea card with badge + progress |

### 5.8 State Management

| Component / Hook | State |
|------------------|-------|
| `AuthContext` | `user`, `token`, `loading` |
| `Feed` | `projects[]`, `trendingProjects[]`, `page`, `hasMore`, `likedIds`, `savedIds`, `activeFilter`, `searchQuery`, `feedView` |
| `CommentSection` | `text`, `open` |
| `RequestModal` | `note` (local) |
| `CollaborationRequestsView` | `incoming[]`, `outgoing[]`, `activeTab`, `loading`, `actionLoading` |
| `useTheme` | `theme` ("dark"/"light") persisted to localStorage |
| `useDraggable` | `position` ({ top, left }) |

### 5.9 Custom Hooks

#### `useTheme`
- Reads initial value from `localStorage` (defaults to `"dark"`).
- Sets/removes `data-theme` attribute on `<html>`.
- Persists changes to `localStorage`.
- **Known bug**: references undeclared variable `root` — will throw `ReferenceError`.

#### `useDraggable`
- Uses Pointer Events API (`pointerdown`, `pointermove`, `pointerup`).
- Uses `setPointerCapture` / `releasePointerCapture` for reliable tracking.
- Prevents drag on textarea/input elements.
- Returns `{ position, dragHandlers }`.

### 5.10 Styling Architecture

All styles live in a single file: **`src/index.css`** (~3200 lines).

#### Theming via CSS Custom Properties

```css
:root { /* light theme (default) */
  --bg-dark: #ffffff;
  --accent-color: #4f46e5;
  --text-main: #0f172a;
}

:root[data-theme='dark'] {
  --bg-dark: #121212;
  --accent-color: #6366f1;
  --text-main: #f3f4f6;
}
```

| Variable | Light | Dark | Purpose |
|----------|-------|------|---------|
| `--bg-dark` | `#ffffff` | `#121212` | Page background |
| `--bg-panel` | `#f3f4f6` | `#1e1e1e` | Panel/section bg |
| `--bg-sidebar` | `#ffffff` | `#161616` | Sidebar bg |
| `--accent-color` | `#4f46e5` | `#6366f1` | Primary action color |
| `--text-main` | `#0f172a` | `#f3f4f6` | Primary text |
| `--text-muted` | `#475569` | `#9ca3af` | Secondary text |
| `--border-color` | `#e5e7eb` | `#2e2e2e` | Borders / dividers |
| `--card-bg` | `#ffffff` | `#222222` | Card backgrounds |

#### Key Layout Classes

| Class | Layout | Purpose |
|-------|--------|---------|
| `.feed-3col-layout` | flex row (left nav 64px + center flex-1 + right panel 280px) | Main feed layout |
| `.feed-left-nav` | fixed 64px column | Mini sidebar navigation |
| `.feed-center` | flex-1, scrollable | Center feed content |
| `.feed-right-panel` | 280px column | Trending tags + contributors |
| `.feed-card` | glassmorphism card (border, backdrop-blur) | Project card container |
| `.feed-card-comments` | full-width below action bar | Comment section block |
| `.collab-card` | glassmorphism card | Request card container |
| `.auth-page` | centered flex | Full-viewport auth layout |
| `.workspace-layout` | flex row | Sidebar + main content split |

#### Animations

| Keyframe | Element | Effect |
|----------|---------|--------|
| `slideDown` | `.floating-toolbar` | Elastic slide from above |
| `slideLeft` | `.floating-chat-panel` | Slide from right |
| `slideUp` | `.chat-message` | Fade up on appear |
| `fadeIn` | `.projects-grid`, `.auth-card`, `.feed-card-wrapper` | Fade in + translate up |
| `spin` | `.feed-spinner`, `.feed-spinner-sm` | Loading spinner |

---

## 6. Data Flow

### 6.1 Signup Flow

```
User fills form → clicks "Create account"
  → handleSubmit via FormData
  → Validates: all fields present, password >= 6 chars
  → fetch POST /signup { username, email, password }
  → Backend validates, hashes password, creates user
  → Response: { message, user }
    ├─ Success → navigate('/')
    └─ Error   → show error banner
```

### 6.2 Login Flow

```
User fills form → clicks "Sign in"
  → handleSubmit via FormData
  → Validates: both fields present
  → fetch POST /login { email, password }
  → Backend looks up user, compares password, generates JWT
  → Response: { message, token, user }
    ├─ Success → AuthContext.login(token, user)
    │            navigate('/feed')
    └─ Error   → show error banner
```

### 6.3 Feed Flow

```
Feed mounts
  → fetch GET /api/projects/feed?page=1&sort=recent
  → Set projects[], set likedIds/savedIds
  → Render ProjectCards with fade-in animation

User scrolls
  → IntersectionObserver triggers on sentinel element
  → fetch GET /api/projects/feed?page=N&sort=...
  → Append new projects to list (dedup by _id)

User types search
  → 350ms debounce
  → fetch GET /api/projects/feed?search=query
  → Replace projects list

User clicks filter tab
  → setActiveFilter(key)
  → fetch GET /api/projects/feed?tag=...&sort=...
  → Replace projects list
```

### 6.4 Like / Save / Comment Flow

```
Like:
  User clicks heart → toggleLike(token, projectId)
    → Optimistic: toggle likedIds set, update likes array in projects[]
    → Backend: toggle user ID in project.likes
    → On error: revert optimistic update

Save:
  User clicks bookmark → toggle project ID in savedIds Set
    → Persist to localStorage("savedProjects")
    → No backend call (client-side only)

Comment:
  User clicks "N comments" → expand CommentSection
  User types + submits → addComment(token, projectId, text)
    → Backend pushes { user, text } to project.comments
    → Response: updated comments array → replace in projects[]
  ```

### 6.5 Collaboration Request Flow

```
Send request:
  User clicks handshake on ProjectCard
    → setReqModal({ open: true, project })
    → RequestModal appears
    → User types note → onSubmit(note)
    → POST /api/projects/request/:id { note }
    → toast "Collaboration request sent!"

Owner views requests:
  Owner clicks "Collaboration" in left sidebar
    → setFeedView("collaboration")
    → <CollaborationRequestsView> mounts
    → Promise.allSettled([
        GET /api/projects/incoming-requests,
        GET /api/projects/my-requests
      ])
    → Shows Incoming tab by default

Owner acts on request:
  Owner clicks Accept → PUT /api/projects/request/:projectId/:requestId { status: "accepted" }
    → User added to project.members
    → Card removed from incoming list
    → toast "Collaborator accepted!"

  Owner clicks Reject → PUT /api/projects/request/:projectId/:requestId { status: "rejected" }
    → Request status set to rejected
    → Card removed from incoming list
```

---

## 7. Known Issues & Security Gaps

### Critical

- **Password hash exposed in API responses** — both signup and login return the full user document including `password` field.
- **All responses return HTTP 200** — validation errors, auth failures, and server errors all return 200 instead of proper status codes (400, 401, 404, 500).

### High

- **Error messages leak internals** — `catch` blocks return `err.message` directly to client (may expose MongoDB errors, etc.).
- **CORS wide open** — `cors()` with no options allows all origins.
- **No route guards** — `/feed` and `/create` are accessible without authentication (components check `token` internally but don't redirect at the router level).
- **`useTheme` bug** — references undeclared variable `root`, will cause `ReferenceError` at runtime.

### Medium

- **Validation order bug** in signup — duplicate email check runs before missing-field check.
- **No input validation** — no email format validation, no password strength rules.
- **No rate limiting** — login endpoint is vulnerable to brute force.
- **No connection retry logic** — if MongoDB connection fails, the server still starts.

### Low

- Empty `routes/authRoutes.js` file (dead code).
- `cookie-parser` installed but never used.
- Dead import `const { Timestamp } = require("mongodb")` in `User.js`.
- Unconventional `Timestamp` field (capital T) instead of Mongoose `timestamps: true`.
- `openProject` unused variable in `HomeLayout.jsx`.
- No owner-guard in `POST /api/projects/request/:id` (user can send request to own project).
- Typos: "or port" → "on port", "exits" → "exists", "regiestered" → "registered".

---

## 8. Future Roadmap

### Short-term

1. **Strip password from API responses** — add Mongoose `toJSON` transform on User model.
2. **Use proper HTTP status codes** — 400, 401, 409, 500 across all endpoints.
3. **Fix `useTheme` bug** — declare `const root = document.documentElement`.
4. **Input validation** — email regex, password strength (min length, complexity), input trimming.
5. **Move API base URL to environment variable** — `VITE_API_URL` in `.env`.

### Medium-term

6. **Add ProtectedRoute wrapper** — redirect unauthenticated users at router level, not component level.
7. **Rate limiting** on auth endpoints (`express-rate-limit`).
8. **Add proper error classes** — consistent error response format `{ error: string, code: string }`.
9. **Add owner-guard** on `POST /api/projects/request/:id` — prevent self-requests.
10. **Collaboration notifications** — notify project owner when a request is received (in-app or email).

### Long-term

11. **Real-time collaboration** — WebSocket (Socket.IO) for multi-user whiteboard editing.
12. **Persist whiteboard data** — save/load board elements from MongoDB.
13. **File/image upload** — attach images to projects and comments.
14. **Team management** — invite members, permissions, roles.
15. **Responsive design** — mobile support for the feed and workspace views.
