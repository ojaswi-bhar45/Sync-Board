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
| **Styling** | Tailwind CSS 4 + CSS custom properties (~4000 lines) |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable (Kanban board) |
| **Real-time** | Socket.IO 4 (WebSocket chat + typing indicators) |

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| No controller layer | Routes contain inline logic — simpler for a project of this size; can extract later |
| Styling: Tailwind 4 + custom CSS | Tailwind for utility classes, custom CSS for glassmorphism, theming, animations |
| No state management library | `AuthContext` + `SocketContext` + local state sufficient for current component tree |
| `/api/v1` prefix | Allows versioning the API without breaking existing clients |
| Vite proxy in dev | Eliminates CORS issues during development; frontend never knows backend URL |
| Socket.IO for real-time chat | WebSocket for instant message delivery + typing indicators + online presence |
| Drag-and-drop via @dnd-kit | Lightweight, maintained library over react-beautiful-dnd; supports column reordering and within-column sorting |

---

## 2. System Architecture

```
                               ┌──────────────────────────────────────────────────────────────┐
                               │                        Browser                                │
                               │  ┌────────────────────────────────────────────────────────┐  │
                               │  │              React SPA (:5173 / :vercel)               │  │
                               │  │  ┌──────┐ ┌────────┐ ┌──────────┐ ┌───────────┐ ┌───┐│  │
                               │  │  │Login │ │ Signup │ │  Feed    │ │ Workspace │ │Chat││  │
                               │  │  │Page  │ │  Page  │ │ (3-col)  │ │ + Canvas  │ │Pnl ││  │
                               │  │  └──┬───┘ └───┬────┘ └────┬─────┘ └───────────┘ └───┘│  │
                               │  │     │          │           │                ▲          │  │
                               │  │     └──────────┘    + AuthContext (JWT)    │          │  │
                               │  │                        SocketContext    WebSocket      │  │
                               │  └─────────────────────┬──────────────────────┼───────────┘  │
                               └────────────────────────┼──────────────────────┼──────────────┘
                                                        │ HTTP (JSON)          │ WS
                                                        ▼                      ▼
                               ┌──────────────────────────────────────────────────────────────┐
                               │              Express + Socket.IO (:5000 / :render)           │
                               │  ┌───────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
                               │  │Helmet │ │Compress  │ │  CORS    │ │   JSON   │          │
                               │  │Headers│ │ (gzip)   │ │Middleware│ │  Parser  │          │
                               │  └───────┘ └──────────┘ └──────────┘ └──────────┘          │
                               │  ┌──────────────────────────────────────────────────┐      │
                               │  │              /api/v1 (routes/index.js)           │      │
                                │  │  ┌────────┐ ┌──────────┐ ┌──────┐ ┌──────────┐ ┌──────┐│      │
                                │  │  │  Auth  │ │ Projects │ │ Chat │ │  Canvas  │ │Tasks ││      │
                                │  │  │ Routes │ │ + Feed   │ │Routes│ │  Routes  │ │Routes││      │
                                │  │  └────┬───┘ └────┬─────┘ └──┬───┘ └────┬─────┘ └──┬───┘│      │
                               │  │       │           │          │           │       │      │
                               │  │       └── JWT Auth Middleware ────────────┘       │      │
                               │  └──────────────────────────────────────────────────┘      │
                               │  ┌──────────────────────────────────────────────────┐      │
                               │  │            Socket.IO Server (socket.js)          │      │
                               │  │  - JWT auth middleware (handshake)               │      │
                               │  │  - Rooms: project:{projectId}                    │      │
                               │  │  - Events: chat:message, chat:typing,           │      │
                               │  │            user-online, user-offline             │      │
                               │  └──────────────────────────────────────────────────┘      │
                               │                         │                                   │
                               │                   Mongoose ODM                              │
                               │                         │                                   │
                               └─────────────────────────┼──────────────────────────────────┘
                                                         │
                                                   MongoDB Atlas
                                                   (Cloud Cluster)
```

---

## 3. Project Structure

```
sync-board/                          # Root (monorepo)
├── ARCHITECTURE.md                  # This document
├── README.md                        # Project overview, badges, getting started
├── LICENSE                          # MIT
├── .github/
│   └── workflows/
│       └── ci.yml                   # GitHub Actions CI pipeline
├── docker-compose.yml               # Orchestrates backend + frontend + MongoDB
│
├── sync-board-b/                    # Backend
│   ├── Dockerfile                   # Containerized Express server
│   ├── app.js                       # Express entry point (mounts all routes)
│   ├── package.json
│   ├── .env.example
│   ├── .gitignore
│   ├── routes/
│   │   ├── index.js                 # Mounts all sub-routers at /api/v1
│   │   ├── authRoutes.js            # POST /signup, POST /login
│   │   ├── feed.js                  # Feed, likes, comments, join requests
│   │   ├── project.js               # Dashboard project CRUD
│   │   ├── chat.js                  # Per-project messaging
│   │   ├── canvas.js                # Whiteboard element CRUD
│   │   ├── team.js                  # Team management (members, roles, permissions, invites)
│   │   ├── tasks.js                 # Task CRUD + status updates (Kanban)
│   │   └── profile.js               # GET / and PATCH /edit
│   ├── models/
│   │   ├── User.js                  # username, email, password, optional profile fields
│   │   ├── Project.js               # title, description, techStack, likes, comments,
│   │   │                            #   members[{userId,permission,teamRole}], joinRequest[], status
│   │   ├── Message.js               # Chat message per project
│   │   ├── CanvasElement.js         # Whiteboard elements (type, position, content)
│   │   └── Task.js                  # Kanban task (title, status, priority, labels, assignee)
│   ├── utils/
│   │   ├── response.js               # Standardized { data, message } / { error, code } helpers
│   │   └── permissions.js            # 3-tier permission model (owner > admin > member), TEAM_ROLES
│   ├── socket.js                    # Socket.IO server (JWT auth, chat rooms, typing, presence)
│   ├── middlewares/
│   │   ├── auth.js                  # JWT verification middleware (attaches req.user)
│   │   ├── errorHandler.js          # Global error handler (sanitized in all modes)
│   │   └── joi.js                   # Input validation middleware + schemas
│   └── __tests__/                   # Jest + Supertest test files
│       └── auth.test.js
│
├── sync-board-f/                    # Frontend
│   ├── Dockerfile                   # Multi-stage build: Vite → nginx
│   ├── nginx.conf                   # nginx config for SPA + API proxy
│   ├── index.html                   # Vite HTML entry
│   ├── vite.config.js
│   ├── package.json
│   ├── .env
│   ├── vercel.json                  # SPA rewrites + API proxy for production
│   ├── eslint.config.js             # Flat ESLint config
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   └── src/
│       ├── main.jsx                 # Entry, BrowserRouter, dark theme default
│       ├── App.jsx                  # Route definitions
│       ├── App.css                  # Empty (all styles in index.css)
│       ├── index.css                # All styles (~7500 lines), CSS custom properties
│       ├── api.js                   # API client functions (projects, chat, canvas, tasks, teams)
│       ├── context/
│       │   ├── AuthContext.jsx      # Global auth state (user, token, login, logout, updateUser)
│       │   ├── ChatContext.jsx      # Global chat state (chatOpen, chatProjectId, startChat, closeChat)
│       │   └── SocketContext.jsx    # Socket.IO client (connection, rooms, chat events, typing, presence)
│       ├── pages/
│       │   ├── Login.jsx            # Sign in form
│       │   ├── Signup.jsx           # Registration form
│       │   ├── Feed.jsx             # 3-column feed
│       │   ├── MyFeed.jsx           # Personal project feed with CRUD
│       │   ├── CreateProject.jsx    # Create new project (route-based)
│       │   ├── EditProject.jsx      # Edit existing project (title/description read-only)
│       │   └── ProjectDetail.jsx    # Full project detail view
│       ├── components/
│       │   ├── HomeLayout.jsx       # Shell with header + <Outlet> + global chat
│       │   ├── Dashboard.jsx        # Dashboard shell with route-based child views
│       │   ├── Sidebar.jsx          # Navigation sidebar for dashboard routes
│       │   ├── ProjectsList.jsx     # Glass-card project grid with filter/search
│       │   ├── Workspace.jsx        # Project detail + canvas + roadmap tabs
│       │   ├── ChatPanel.jsx        # Per-project + global chat panel
│       │   ├── Profile.jsx          # Edit profile with completeness tracker
│       │   ├── ProjectCard.jsx      # Feed mode + compact mode
│       │   ├── CommentSection.jsx   # Expandable comments
│       │   ├── RequestModal.jsx     # Collaboration request modal
│       │   ├── CollaborationRequestsView.jsx
│       │   ├── TeamsView.jsx        # Teams management view
│       │   ├── TeamMemberCard.jsx   # Individual member card with actions
│       │   ├── MemberActionMenu.jsx # Dropdown menu for member actions (promote/demote/remove)
│       │   ├── EditProjectModal.jsx # Edit project modal
│       │   ├── NewProjectModal.jsx  # Modal for dashboard project creation
│       │   ├── ProtectedRoute.jsx   # Auth guard wrapper
│       │   ├── Toast.jsx            # Toast notification system
│       │   ├── Toolbar.jsx          # Floating tool palette
│       │   └── Whiteboard/
│       │       ├── Canvas.jsx       # Whiteboard area, draggable elements, zoom
│       │       ├── IdeaCard.jsx     # Draggable idea card
│       │       └── StickyNote.jsx   # Draggable sticky note
│       │   └── Roadmap/
│       │       ├── index.js         # Barrel export
│       │       ├── RoadmapBoard.jsx # Kanban board with DnD context, stats, task state
│       │       ├── RoadmapColumn.jsx # Single droppable column
│       │       ├── RoadmapTaskCard.jsx # Draggable task card
│       │       ├── CreateTaskModal.jsx # Task creation form
│       │       └── EditTaskModal.jsx  # Task edit form with delete
│       ├── hooks/
│       │   ├── useTheme.js          # Dark/light theme toggle (buggy)
│       │   └── useDraggable.js      # Pointer-based drag behavior
│       └── assets/
│           ├── hero.png
│           ├── react.svg
│           └── vite.svg
```

---

## 4. Backend Architecture

### 4.1 Middleware Chain

```
conditional DNS (prod + SRV) → require dotenv → helmet() → compression() → cors() → express.json() → mount /api/v1 → errorHandler → createSocketServer → connect MongoDB → listen
```

| Step | What it does |
|------|-------------|
| `dns.setServers()` | When MONGO_URL uses `mongodb+srv` (Atlas SRV) — helps resolve in environments with broken DNS; skipped for `mongodb://` (Docker Compose) |
| `helmet()` | Sets security headers (X-Content-Type-Options, X-Frame-Options, CSP, etc.) |
| `compression()` | Gzip-compresses all HTTP responses |
| `cors()` | Allows origins from `CORS_ORIGIN` env var (comma-separated, default `http://localhost:5173`) |
| `express.json()` | Parses `application/json` request bodies |
| `app.use("/api/v1", apiRoutes)` | All application routes mounted under versioned prefix |
| `app.use(errorHandler)` | Global error handler — catches unhandled errors, returns sanitized JSON |
| `createSocketServer(server)` | Attaches Socket.IO to HTTP server with JWT auth, chat rooms, typing/presence events |
| `mongoose.connect()` | Connects to MongoDB Atlas (3 attempts, 1s delay between retries) — exits on failure |
| `app.listen()` | Starts HTTP server on configured `PORT` |

### 4.2 Route Mounting (`routes/index.js`)

```javascript
const router = require("express").Router();
router.use("/auth", require("./authRoutes"));       // POST /signup, POST /login
router.use("/projects", require("./project"));       // CRUD: dashboard projects
router.use("/projects", require("./feed"));          // Feed, likes, comments, requests
router.use("/projects", require("./team"));          // Team management (members, roles, invites)
router.use("/chat", require("./chat"));              // Per-project messaging
router.use("/canvas", require("./canvas"));          // Whiteboard elements
router.use("/tasks", require("./tasks"));             // Task CRUD + status updates (Kanban)
router.use("/profile", require("./profile"));        // GET, PATCH
module.exports = router;
```

Three route files mounted on `/projects` — Express routes are evaluated in order, so route definitions must not collide.

### 4.3 API Endpoints

#### POST /api/v1/auth/signup

| Aspect | Detail |
|--------|--------|
| **Auth** | No |
| **Request body** | `{ username, email, password }` |
| **Validation** | Checks all fields present (before DB lookup) |
| **Duplicate check** | `User.findOne({ email })` — returns "User already exists" with 409 |
| **Token** | `jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1d" })` |
| **Password hashing** | `bcrypt.hash(password, 10)` |
| **Success** | `{ message, token, user }` — password excluded via destructuring |
| **Error** | `{ error }` |

#### POST /api/v1/auth/login

| Aspect | Detail |
|--------|--------|
| **Auth** | No |
| **Request body** | `{ email, password }` |
| **Validation** | Checks both fields present |
| **User lookup** | `User.findOne({ email })` |
| **Password verify** | `bcrypt.compare(password, user.password)` |
| **Token** | `jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1d" })` |
| **Success** | `{ message, token, user }` — password excluded via destructuring |
| **Error** | `{ error }` |

#### GET /api/v1/projects/feed

| Aspect | Detail |
|--------|--------|
| **Auth** | No (public) |
| **Query params** | `page` (default 1), `limit` (default 12, max 50), `sort` ("recent" / "trending"), `search`, `tag`, `status` ("planning"/"active"/"completed"), `open` ("true" filters to `isOpenForCollaboration: true`) |
| **Response** | `{ projects[], page, totalPages, total, hasMore }` |
| **Details** | Uses MongoDB aggregation pipeline: `$match` (with optional status/isOpenForCollaboration filters) → `$addFields` (likesCount) → `$sort` → `$skip` → `$limit` → `$lookup` (user + comments.user) → `$project` |

#### POST /api/v1/projects/create

| Aspect | Detail |
|--------|--------|
| **Auth** | Required |
| **Body** | `{ title, description, techStack, note, status, isOpenForCollaboration, lookingFor }` |
| **Validates** | Title and description required |
| **Response** | Created project (populated userId) |

#### PUT /api/v1/projects/like/:id

| Aspect | Detail |
|--------|--------|
| **Auth** | Required |
| **Behavior** | Toggles: if user ID in likes array → remove, else → add |
| **Response** | `{ likes[], likesCount }` |

#### POST /api/v1/projects/comment/:id

| Aspect | Detail |
|--------|--------|
| **Auth** | Required |
| **Body** | `{ text }` |
| **Response** | `{ comments[] }` — populated with user data |

#### POST /api/v1/projects/request/:id

| Aspect | Detail |
|--------|--------|
| **Auth** | Required |
| **Body** | `{ note }` |
| **Behavior** | Pushes `{ user, note, status: "pending", createdAt }` to `project.joinRequest[]` |
| **Checks** | Duplicate request, already a member (400), self-request (400), project `isOpenForCollaboration === false` (400), project `status === "completed"` (400) |
| **Response** | `{ message }` |

#### GET /api/v1/projects/incoming-requests

| Aspect | Detail |
|--------|--------|
| **Auth** | Required |
| **Query** | Finds all projects where `userId === req.user._id` AND `joinRequest.status === "pending"` |
| **Populates** | `joinRequest.user` with `username email` |
| **Response** | `{ incoming: [{ requestId, projectId, projectTitle, projectStatus, user, note, createdAt }] }` |

#### GET /api/v1/projects/my-requests

| Aspect | Detail |
|--------|--------|
| **Auth** | Required |
| **Query** | Finds all projects where `joinRequest.user === req.user._id` |
| **Populates** | `project.userId` (owner) with `username email` |
| **Response** | `{ outgoing: [{ requestId, projectId, projectTitle, projectStatus, owner, note, status, createdAt }] }` |

#### PUT /api/v1/projects/request/:projectId/:requestId

| Aspect | Detail |
|--------|--------|
| **Auth** | Required (project owner only — checks `userId === req.user._id`) |
| **Body** | `{ status: "accepted" | "rejected" }` |
| **Behavior** | Sets request status; if "accepted", adds requesting user to `project.members` |
| **Response** | `{ message }` |

#### GET /api/v1/projects/my-teams

| Aspect | Detail |
|--------|--------|
| **Auth** | Required |
| **Query** | Finds all projects where `userId === req.user._id` OR `members` contains `req.user._id` |
| **Response** | `{ teams[] }` |

#### DELETE /api/v1/projects/:projectId/members/:userId

| Aspect | Detail |
|--------|--------|
| **Auth** | Required (admin+ via `canManageMember`) |
| **Behavior** | Pulls userId from `project.members` |
| **Response** | `{ message }` |

#### GET /api/v1/projects/:projectId/members

| Aspect | Detail |
|--------|--------|
| **Auth** | Required (any member) |
| **Behavior** | Returns all members with their user info, permission level, team role, and join date |
| **Response** | `{ members[{ userId, username, email, permission, teamRole, joinedAt }] }` |

#### PATCH /api/v1/projects/:projectId/members/:userId/permission

| Aspect | Detail |
|--------|--------|
| **Auth** | Required (owner only) |
| **Body** | `{ permission: "admin" \| "member" }` |
| **Behavior** | Updates a member's permission level |
| **Response** | `{ message }` |

#### PATCH /api/v1/projects/:projectId/members/:userId/role

| Aspect | Detail |
|--------|--------|
| **Auth** | Required (admin+) |
| **Body** | `{ teamRole: string }` (one of `TEAM_ROLES`) |
| **Behavior** | Updates a member's team role |
| **Response** | `{ message }` |

#### POST /api/v1/projects/:projectId/members/:userId/promote

| Aspect | Detail |
|--------|--------|
| **Auth** | Required (owner only) |
| **Behavior** | Promotes a member to admin |
| **Response** | `{ message }` |

#### POST /api/v1/projects/:projectId/members/:userId/demote

| Aspect | Detail |
|--------|--------|
| **Auth** | Required (owner only) |
| **Behavior** | Demotes an admin back to member |
| **Response** | `{ message }` |

#### POST /api/v1/projects/:projectId/invite

| Aspect | Detail |
|--------|--------|
| **Auth** | Required (admin+) |
| **Body** | `{ identifier: string }` (email or username) |
| **Behavior** | Finds user by email/username, adds them to project members with "member" permission |
| **Response** | `{ message, member }` |

#### GET /api/v1/projects/project

| Auth | Response |
|------|----------|
| Required | `Project.find({ userId: req.user._id }).sort({ timestamp: -1 })` |

#### POST /api/v1/projects/add-projects

| Auth | Body |
|------|------|
| Required | `{ title, description, techStack, note, status, isOpenForCollaboration, lookingFor }` |

#### PATCH /api/v1/projects/edit-project/:id

| Auth | Owner guard | Behavior |
|------|-------------|----------|
| Required | `findOneAndUpdate({ _id: params.id, userId: req.user._id })` | Updates title, description, note, status, isOpenForCollaboration, lookingFor if provided |

#### PATCH /api/v1/projects/settings/:id

| Auth | Owner guard | Behavior |
|------|-------------|----------|
| Required | `findOneAndUpdate({ _id: params.id, userId: req.user._id })` | Updates status, isOpenForCollaboration, lookingFor — lightweight settings-only endpoint for inline workspace controls |

#### GET /api/v1/profile/

| Auth | Response |
|------|----------|
| Required | `{ user }` — password excluded with `.select("-password")` |

#### PATCH /api/v1/profile/edit

| Auth | Body | Response |
|------|------|----------|
| Required | `{ username, contactNumber, address, linkedInProfile, githubProfile }` | `{ message, user }` |

#### GET /api/v1/chat/:projectId

| Auth | Response |
|------|----------|
| Required | `Message.find({ projectId }).populate("sender", "username").sort({ createdAt: 1 })` |

#### POST /api/v1/chat/:projectId

| Auth | Body | Response |
|------|------|----------|
| Required | `{ text }` | Created message (populated sender); also emits `chat:message` via Socket.IO |

### 4.4 Auth Middleware (`middlewares/auth.js`)

```javascript
Reads Authorization header → extracts Bearer token → jwt.verify() → User.findById()
  → attaches full user document to req.user → next()
```

- Returns 401 if: no token, invalid token, user not found.
- Attaches the **full Mongoose User document** (including password hash) — callers should avoid exposing `req.user.password` in responses.

### 4.5 Socket.IO Events

Socket.IO runs on the same HTTP server, authenticated via JWT in the handshake `auth.token`.

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-project` | `projectId` | Join Socket.IO room for a project's chat |
| `leave-project` | `projectId` | Leave a project room |
| `chat:typing` | `{ projectId }` | User is typing in project chat |
| `chat:stop-typing` | `{ projectId }` | User stopped typing |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `chat:message` | populated `Message` document | New chat message (broadcast to room, excluding sender) |
| `chat:typing` | `{ userId, username }` | Another user is typing |
| `chat:stop-typing` | `{ userId }` | User stopped typing |
| `user-online` | `{ userId, username }` | User joined the project room |
| `user-offline` | `{ userId }` | User left or disconnected |
| `task:created` | populated `Task` document | New task created (broadcast to project room) |
| `task:updated` | populated `Task` document | Task fields or status changed (broadcast to project room) |
| `task:deleted` | `{ taskId, projectId }` | Task deleted (broadcast to project room) |

#### GET /api/v1/canvas/:projectId

| Auth | Response |
|------|----------|
| Required | All canvas elements for the project |

#### POST /api/v1/canvas/:projectId

| Auth | Body |
|------|------|
| Required | `{ type, content, position, style }` |

#### PATCH /api/v1/canvas/:projectId/:elementId

| Auth | Body |
|------|------|
| Required | Partial element updates |

#### DELETE /api/v1/canvas/:projectId/:elementId

| Auth | Response |
|------|----------|
| Required | `{ message }` |

#### GET /api/v1/tasks/:projectId

| Aspect | Detail |
|--------|--------|
| **Auth** | Required (owner + members) |
| **Populates** | `assignedTo` (username, email), `createdBy` (username, email) |
| **Response** | `{ tasks[] }` — all tasks for the project, sorted by order |

#### POST /api/v1/tasks

| Aspect | Detail |
|--------|--------|
| **Auth** | Required (owner only) |
| **Body** | `{ projectId, title, description?, status?, priority?, labels?, assignedTo?, dueDate? }` |
| **Validation** | `createTask` Joi schema — title required, max 200 chars |
| **Order** | Auto-computed as `MAX(order) + 1` within the target status column |
| **Response** | `{ task }` — populated task; also emits `task:created` via Socket.IO |

#### PATCH /api/v1/tasks/:id

| Aspect | Detail |
|--------|--------|
| **Auth** | Required (owner only) |
| **Body** | Partial fields: `title`, `description`, `priority`, `labels`, `assignedTo`, `dueDate` |
| **Validation** | `editTask` Joi schema — all fields optional |
| **Response** | `{ task }` — populated task; also emits `task:updated` via Socket.IO |

#### PATCH /api/v1/tasks/:id/status

| Aspect | Detail |
|--------|--------|
| **Auth** | Required (owner + members) |
| **Body** | `{ status, order }` |
| **Validation** | `updateTaskStatus` Joi schema — status enum, order number required |
| **Purpose** | Drag-and-drop: moves task to a new column at a specific position |
| **Response** | `{ task }` — populated task; also emits `task:updated` via Socket.IO |

#### DELETE /api/v1/tasks/:id

| Aspect | Detail |
|--------|--------|
| **Auth** | Required (owner only) |
| **Response** | `{ message }`; also emits `task:deleted` via Socket.IO |

### 4.6 Database Schemas

#### User Model

```javascript
{
  username:      { type: String, required: true },
  email:         { type: String, required: true, unique: true },
  password:      { type: String, required: true },
  contactNumber: { type: String, default: null },
  address:       { type: String, default: null },
  linkedInProfile: { type: String, default: null },
  githubProfile: { type: String, default: null },
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
  members:     [{
    userId:     { ObjectId, ref: "User", required: true },
    permission: { enum: ["owner", "admin", "member"], default: "member" },
    teamRole:   { enum: ["frontend", "backend", "fullstack", "uiux", "devops", "qa", "ml", "mobile", "other"], default: "other" },
    joinedAt:   { type: Date, default: Date.now }
  }],
  joinRequest: [{
    user: { ObjectId, ref: "User" },
    note: String,
    status: { enum: ["pending", "accepted", "rejected"], default: "pending" },
    createdAt: { type: Date, default: Date.now }
  }],
  status:                { enum: ["planning", "active", "completed"], default: "planning" },
  isOpenForCollaboration: { type: Boolean, default: true },
  lookingFor:            [{ type: String }],
  visibility:            { enum: ["public", "private"], default: "public" },
  progress:              { type: Number, default: 0, min: 0, max: 100 },
  pinned:                { type: Boolean, default: false },
  image:                 { type: String, default: "" },
  timestamp:             { type: Date, default: Date.now }
}
```

#### Permission Model (`utils/permissions.js`)

Three-tier permission hierarchy for team management:

| Level | Permission | Capabilities |
|-------|-----------|--------------|
| 3 | `owner` | Full control: promote/demote admins, update permissions, remove any member, edit project settings |
| 2 | `admin` | Manage members: update team roles, remove members, invite users |
| 1 | `member` | Basic access: view members, manage own role |

**Constants:**
- `TEAM_ROLES`: `["frontend", "backend", "fullstack", "uiux", "devops", "qa", "ml", "mobile", "other"]`

**Helper functions:**
- `getMemberRecord(project, userId)` — Returns the member record `{ userId, permission, teamRole, joinedAt }` from `project.members`, or `null` if not a member. Owner is checked via `project.userId`.
- `hasPermission(userPermission, requiredPermission)` — Compares permission levels (owner > admin > member).
- `canManageMember(userPermission, targetPermission)` — Returns `true` if user can manage the target (must have strictly higher permission level).

#### Message Model

```javascript
{
  projectId: { type: ObjectId, ref: "Project", required: true },
  sender:    { type: ObjectId, ref: "User", required: true },
  text:      { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}
```

#### CanvasElement Model

```javascript
{
  projectId: { type: ObjectId, ref: "Project", required: true },
  type:      { type: String, enum: ["sticky", "idea"], default: "sticky" },
  color:     { type: String, default: "yellow" },
  top:       { type: Number, default: 100 },
  left:      { type: Number, default: 100 },
  rotation:  { type: Number, default: 0 },
  title:     { type: String, default: "" },
  content:   { type: String, default: "" },
  badge:     { type: String, default: "" },
  desc:      { type: String, default: "" },
  progress:  { type: Number, default: 0 },
  createdBy: { type: ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
}
```

#### Task Model

```javascript
{
  projectId:  { type: ObjectId, ref: "Project", required: true, index: true },
  title:      { type: String, required: true, maxlength: 200 },
  description:{ type: String, default: "", maxlength: 2000 },
  status:     { type: String, enum: ["backlog","todo","progress","review","done"], default: "backlog" },
  priority:   { type: String, enum: ["low","medium","high","urgent"], default: "medium" },
  labels:     [{ type: String }],
  assignedTo: { type: ObjectId, ref: "User", default: null },
  createdBy:  { type: ObjectId, ref: "User", required: true },
  dueDate:    { type: Date, default: null },
  order:      { type: Number, default: 0 },
  timestamps: true
}
```

### 4.7 Dependencies

| Package | Purpose |
|---------|---------|
| `express` | HTTP framework, routing, middleware |
| `mongoose` | MongoDB ODM, schema validation |
| `mongodb` | Official MongoDB driver (peer dependency) |
| `bcryptjs` | Pure-JS password hashing |
| `jsonwebtoken` | JWT creation and verification |
| `cors` | Cross-Origin Resource Sharing |
| `helmet` | Security HTTP headers |
| `compression` | Gzip response compression |
| `dotenv` | Environment variable loading |
| `joi` | Request body validation (middleware + schemas) |
| `express-rate-limit` | Rate limiting on auth endpoints (10 req/15 min) |
| `socket.io` | WebSocket server for real-time chat events |
| `nodemon` (dev) | Auto-restart during development |
| `jest` + `supertest` + `mongodb-memory-server` (dev) | Integration tests |

---

## 5. Frontend Architecture

### 5.1 Entry Point (`main.jsx`)

```javascript
const savedTheme = localStorage.getItem('sb-theme')
document.documentElement.setAttribute('data-theme', savedTheme || 'dark')
// => Wraps <App /> in <StrictMode> + <BrowserRouter>
```

- Reads saved theme from `localStorage` (defaults to `'dark'`) before first render.
- `BrowserRouter` enables client-side routing (History API).
- `App` mounts `AuthProvider` → `SocketProvider` → `<Routes>`.

### 5.2 Routing (`App.jsx`)

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `Login` | Sign in form |
| `/signup` | `Signup` | Registration form |
| `/dashboard` | `HomeLayout` → `Outlet` | Dashboard shell |
| `/dashboard/feed` | `Feed` | 3-column feed page |
| `/dashboard/my-feed` | `MyFeed` | Personal project feed with CRUD |
| `/dashboard/create` | `CreateProject` | Create new project |
| `/dashboard/edit-project/:projectId` | `EditProject` | Edit existing project |
| `/dashboard/profile` | `Profile` | Edit profile |
| `/dashboard/projects` | `ProjectsList` | My projects grid |
| `/dashboard/project/:projectId` | `ProjectDetail` | Full project detail view |
| `/dashboard/workspace/:projectId` | `Workspace` | Canvas + chat |
| `*` | `Navigate to="/dashboard/feed"` | Catch-all redirect |

### 5.3 Auth Context (`AuthContext.jsx`)

- Provides `{ user, token, loading, login, logout, updateUser }` globally.
- On mount: reads `token` and `user` from `localStorage`, verifies token with backend.
- `login(token, user)`: stores to localStorage + sets state.
- `logout()`: clears localStorage + nullifies state + navigates to `/`.
- `ProtectedRoute` wrapper checks `token` and redirects to `/` if absent.

### 5.4 Socket Context (`SocketContext.jsx`)

- Provides Socket.IO client connection lifecycle, scoped to authenticated users.
- On mount (token present): connects to server with JWT auth handshake.
- Cleanup on unmount or logout: disconnects and removes listeners.
- Exposes: `connected`, `onlineUsers`, `joinProject`, `leaveProject`, `onMessage`, `sendTyping`, `sendStopTyping`, `onTyping`, `onStopTyping`.
- `SocketProvider` wraps `HomeLayoutInner` to provide socket access to all dashboard routes.

### 5.5 Component Tree

```
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/dashboard" element={<ProtectedRoute><HomeLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="feed" replace />} />
      <Route path="feed" element={<Feed />} />
      <Route path="my-feed" element={<MyFeed />} />
      <Route path="create" element={<CreateProject />} />
      <Route path="edit-project/:projectId" element={<EditProject />} />
      <Route path="profile" element={<Profile />} />
      <Route path="projects" element={<ProjectsList />} />
      <Route path="project/:projectId" element={<ProjectDetail />} />
      <Route path="workspace/:projectId" element={<Workspace />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</BrowserRouter>

--- Feed (3-column layout) ---
<Feed>
  <FeedLeftNav>
    Home | Explore | Notifications | Messages | Collaboration
    Profile avatar (bottom)
  </FeedLeftNav>

  <div class="feed-center">
    <CollaborationRequestsView>
      Tabs: Incoming | Sent Requests
      Cards with accept/reject (incoming) or status pills (outgoing)
    </CollaborationRequestsView>

    <Feed Header>
    <Collab Toggle (checkbox: "Only show accepting collaborators")>
    <Main Cards>
      <CompactProjectCard>
        Title + Description + Status Badge + Tech Tags + Like/Member counts
      </CompactProjectCard>
  </div>

  <FeedRightPanel>
    Trending Tags
    Top Contributors
  </FeedRightPanel>
</Feed>
```

### 5.6 HomeLayout (`HomeLayout.jsx`)

- Renders a sticky sidebar alongside `<Outlet />`.
- Wraps children in `ChatProvider` for global chat state.
- Conditionally renders global `ChatPanel` when `chatOpen` is true.
- Mobile bottom nav bar with links to Feed, New Project, Profile, and Chat toggle.

> **Note**: `SocketProvider` is mounted at the `App` level (wrapping `<Routes>`), not inside `HomeLayout`. It conditionally connects only when a valid auth token is present.

### 5.7 Key Components

#### CompactProjectCard
- Compact vertical card for the feed list.
- Shows: avatar + username + status badge, title (1-line clamp), description (2-line clamp), tech tags (max 3), like count, member count.
- Entire card is clickable → navigates to `/dashboard/project/:projectId`.

#### ProjectDetail
- Full project detail page at `/dashboard/project/:projectId`.
- Shows: back button, owner info, title, full description, gradient image, all tech tags, collaboration status, looking-for roles, members list, like/comment/view actions, bookmark, and CommentSection.

#### ProjectCard
- Used in `ProjectsList` dashboard view.
- Full card with avatar + user info + status badge + collaboration badge + title + description + lookingFor tags + tech stack + actions + CommentSection.

#### CommentSection
- Trigger: "N comments" toggles open/closed.
- Auto-resizing textarea, Cmd+Enter submits.
- Empty state: "No comments yet. Be the first!"

#### CollaborationRequestsView
- Two tabs: Incoming / Sent.
- Fetches both in parallel via `Promise.allSettled`.
- Accept/reject with one click; accepted users join project members.

#### ProjectsList
- Fetches `getMyTeams(token)` on mount.
- Glassmorphism card grid with filter tabs (All / Owned / Member), search bar.
- Skeleton shimmer loading, empty state with CTA.
- Each card: gradient avatar, status badge, title, description, tech tags, owner dot, member count, date.

#### Profile
- Fetches `getProfile(token)` on mount.
- Gradient cover with pulsing avatar ring.
- Stats row + completeness bar with milestones + smart label.
- 2-column glass field grid (→ 1 col on mobile).
- GitHub/LinkedIn render as external links.
- Gradient save button with spinner.

#### Workspace
- Canvas + chat + roadmap for a single project.
- **Tab system** switches between Whiteboard (canvas + toolbar) and Roadmap (5-column Kanban board). Chat remains floating across both tabs.
- **Owner controls** (visible only to project owner): status selector (planning/active/completed), collaboration toggle (open/closed), lookingFor role management (add/remove roles), task creation/editing/deletion on roadmap.
- Non-owner view: read-only status badge, collaboration badge, lookingFor tags; can move tasks on roadmap.
- Uses `updateProjectSettings(token, projectId, { status, isOpenForCollaboration, lookingFor })` for inline settings updates.

### 5.8 State Management

| Component / Hook | State |
|------------------|-------|
| `AuthContext` | `user`, `token`, `loading` |
| `ChatContext` | `chatOpen`, `chatProjectId`, `chatProjectTitle` |
| `SocketContext` | `connected`, `onlineUsers`, socket event helpers |
| `Feed` | `projects[]`, `page`, `hasMore`, `likedIds`, `searchQuery`, `feedView`, `openForCollaborationOnly` |
| `CommentSection` | `text`, `open` |
| `RequestModal` | `note` (local) |
| `CollaborationRequestsView` | `incoming[]`, `outgoing[]`, `activeTab`, `loading`, `actionLoading` |
| `ProjectsList` | `teams[]`, `loading`, `filter`, `searchQuery` |
| `Profile` | `profile`, `loading`, `saving` |
| `Workspace` | `activeTab`, `projectStatus`, `projectOpenForCollab`, `projectLookingFor`, `editingStatus`, `editingLookingFor`, `lookingForInput`, `activeTool`, `elements`, `tasks[]`, `loading` |
| `useTheme` | `theme` ("dark"/"light") persisted to localStorage |
| `useDraggable` | `position` ({ top, left }) |

### 5.9 Custom Hooks

#### `useTheme`
- Reads from `localStorage` (defaults to `"dark"`).
- Sets `data-theme` on `<html>`.
- Persisted to `localStorage` (defaults to `"dark"`).

#### `useDraggable`
- Pointer Events API (`pointerdown`, `pointermove`, `pointerup`).
- `setPointerCapture` / `releasePointerCapture` for reliable tracking.
- Prevents drag on textarea/input.
- Returns `{ position, dragHandlers }`.

### 5.10 Styling Architecture

Styles use **Tailwind CSS 4** (via `@tailwindcss/vite` plugin) alongside a **custom CSS file** (`src/index.css`, ~7500 lines).

- Tailwind provides utility classes for layout, spacing, colors, and responsive design.
- Custom CSS handles glassmorphism effects (`backdrop-filter: blur`), CSS custom property theming, animations/keyframes, and feed-specific component styles.
- `index.css` starts with `@import "tailwindcss"` to load Tailwind base styles.

#### Theming via CSS Custom Properties

```css
@import "tailwindcss";

:root { /* light theme */
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
| `.feed-3col-layout` | flex row | Main feed layout |
| `.feed-left-nav` | fixed 64px column | Mini sidebar |
| `.feed-center` | flex-1, scrollable | Center content |
| `.feed-right-panel` | 280px column | Widgets |
| `.feed-card` | glassmorphism card | Project card |
| `.project-glass-card` | glassmorphism card with hover lift | Dashboard project card |
| `.projects-grid` | responsive grid | Project card grid |
| `.profile-page` | scrollable column | Profile page |

#### Animations

| Keyframe | Element | Effect |
|----------|---------|--------|
| `slideDown` | `.floating-toolbar` | Elastic slide from above |
| `slideLeft` | `.floating-chat-panel` | Slide from right |
| `slideUp` | `.chat-message` | Fade up on appear |
| `fadeIn` | `.projects-grid`, `.auth-card`, `.feed-card-wrapper` | Fade in + translate up |
| `spin` | `.feed-spinner`, `.feed-spinner-sm` | Loading spinner |
| `shimmer` | `.project-skeleton-card` | Skeleton loading |

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
    │            navigate('/dashboard/feed')
    └─ Error   → show error banner
```

### 6.3 Feed Flow

```
Feed mounts
  → fetch GET /api/v1/projects/feed?page=1&sort=recent
  → Set projects[], set likedIds/savedIds
  → Render ProjectCards with fade-in animation

User scrolls
  → IntersectionObserver triggers on sentinel element
  → fetch GET /api/v1/projects/feed?page=N&sort=...
  → Append new projects to list (dedup by _id)

User types search
  → 350ms debounce
  → fetch GET /api/v1/projects/feed?search=query
  → Replace projects list

User clicks filter tab
  → setActiveFilter(key)
  → fetch GET /api/v1/projects/feed?tag=...&sort=...
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
    → POST /api/v1/projects/request/:id { note }
    → toast "Collaboration request sent!"

Owner views requests:
  Owner clicks "Collaboration" in left sidebar
    → setFeedView("collaboration")
    → <CollaborationRequestsView> mounts
    → Promise.allSettled([
        GET /api/v1/projects/incoming-requests,
        GET /api/v1/projects/my-requests
      ])
    → Shows Incoming tab by default

Owner acts on request:
  Owner clicks Accept → PUT /api/v1/projects/request/:projectId/:requestId { status: "accepted" }
    → User added to project.members
    → Card removed from incoming list
    → toast "Collaborator accepted!"

  Owner clicks Reject → PUT /api/v1/projects/request/:projectId/:requestId { status: "rejected" }
    → Request status set to rejected
    → Card removed from incoming list
```

### 6.6 Chat Flow (HTTP + WebSocket)

```
User opens chat (global or per-project)
  → ChatContext.startChat(projectId, projectTitle)
  → SocketContext.joinProject(projectId)
  → Socket joins room `project:{projectId}`
  → ChatPanel mounts, fetches GET /api/v1/chat/:projectId
  → Renders message history, scrolled to bottom

User sends message (HTTP)
  → POST /api/v1/chat/:projectId { text }
  → Server stores message, emits `chat:message` to room via Socket.IO
  → All clients in room receive event → append to local messages
  → On error: show toast error

User is typing
  → Input change fires SocketContext.sendTyping(projectId)
  → Server broadcasts `chat:typing` to room (excluding sender)
  → Other clients show "[username] typing..." (clears after 3s)
  → On blur/enter: SocketContext.sendStopTyping(projectId)

Online presence
  → On connect: SocketContext broadcasts `user-online` to joined rooms
  → On disconnect: broadcasts `user-offline` to all rooms
  → ChatPanel shows green dot when connected
```

---

## 7. Security Model

### 7.1 JWT Lifecycle

| Stage | Detail |
|-------|--------|
| **Signing** | `jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1d" })` in login route |
| **Storage** | `localStorage` on the client (set by `AuthContext.login()`) |
| **Transmission** | `Authorization: Bearer <token>` header via `api.js` `headers()` helper |
| **Verification** | `middlewares/auth.js`: extracts token, calls `jwt.verify()`, looks up user, attaches to `req.user` |
| **Expiry** | 24 hours — no refresh token mechanism; on expiry, user is redirected to login |
| **Logout** | `AuthContext.logout()` clears `localStorage`, sets user/token to null |

### 7.2 Protected vs Public Routes

| Route | Auth Required | Notes |
|-------|---------------|-------|
| `POST /api/v1/auth/signup` | No | Public |
| `POST /api/v1/auth/login` | No | Public |
| `GET /api/v1/projects/feed` | No | Public — anyone can browse projects |
| All other `/api/v1/*` routes | Yes | Protected via `middlewares/auth.js` |
| `/dashboard/*` (frontend) | Yes | Guarded by `<ProtectedRoute>` wrapper |

### 7.3 Security Gaps — Status

| Gap | Impact | Priority | Status |
|-----|--------|----------|--------|
| Password hash in API responses | Anyone with network access can see hashed passwords | **P0 — Critical** | Fixed — stripped via destructuring in auth routes |
| HTTP 200 for all responses | Clients cannot differentiate error types programmatically | **P0 — Critical** | Fixed — proper status codes (400/401/403/404/409/500/201) |
| Error messages leak internals | MongoDB errors, stack traces exposed to client | **P1 — High** | Partially fixed — global error handler sanitizes; some catch blocks still pass raw errors to `next()` |
| No input sanitization | XSS, NoSQL injection possible | **P1 — High** | Open |
| Joi validation added | Email format, password min-length, field types validated on all routes | **P1 — High** | Fixed — `middlewares/joi.js` with per-route schemas |
| Rate limiting on auth | Brute force / credential stuffing on login | **P1 — High** | Fixed — `express-rate-limit` (10 req / 15 min) on `/auth/*` |
| CORS wide open (was) | Now restricted to `CORS_ORIGIN` env var | **P2 — Fixed** | Fixed |
| No route guards (was) | Now has `<ProtectedRoute>` wrapper | **P2 — Fixed** | Fixed |
| Self-request allowed | Owner can send join request to own project | **P3 — Low** | Fixed — `userId` check in `feed.js` |

### 7.4 Remaining Security Improvements

1. **Sanitize error messages** — ensure all catch blocks use `next(error)` (already done in most routes) and log full error server-side; the global error handler already sanitizes in all modes.
2. **Input sanitization** — Joi validates but does not sanitize; add trim/escape to prevent XSS/NoSQL injection.
3. **Rate limiting scope** — consider extending rate limiting beyond auth routes (e.g., project creation).
4. **MongoDB connection string** — ensure `MONGO_URL` uses a database-specific user with minimal permissions.

---

## 8. Database Indexing Strategy

### 8.1 Current Indexes

Mongoose implicitly creates an index on `_id` for every model and a **unique index** on fields declared `unique: true` (email on User). No explicit indexes are currently defined via `schema.index()`.

### 8.2 Recommended Indexes

| Collection | Fields | Index Type | Rationale |
|-----------|--------|------------|-----------|
| `users` | `email` | Unique (exists) | Login lookup: `User.findOne({ email })` |
| `projects` | `userId` | Single | Dashboard: `Project.find({ userId })` |
| `projects` | `timestamp` | Single descending | Feed sorting: `$sort: { timestamp: -1 }` |
| `projects` | `status`, `timestamp` | Compound | Feed filter + sort |
| `projects` | `joinRequest.status` | Single | Incoming requests query |
| `projects` | `members` | Single | My teams query |
| `messages` | `projectId`, `createdAt` | Compound | Chat history |
| `cancaselements` | `projectId` | Single | Canvas load |
| `tasks` | `projectId`, `status`, `order` | Compound | Task board queries: column load + sort |

### 8.3 Index Creation Code

```javascript
// models/Project.js
projectSchema.index({ userId: 1 });
projectSchema.index({ timestamp: -1 });
projectSchema.index({ status: 1, timestamp: -1 });
projectSchema.index({ "joinRequest.status": 1 });
projectSchema.index({ members: 1 });

// models/Message.js
messageSchema.index({ projectId: 1, createdAt: 1 });

// models/CanvasElement.js
canvasElementSchema.index({ projectId: 1 });

// models/Task.js
taskSchema.index({ projectId: 1, status: 1, order: 1 });
```

### 8.4 Index Considerations

- **Write overhead**: Each index adds write latency. Monitor with MongoDB Atlas Performance Advisor.
- **Compound order**: Equality filters first (`status`), range/sort fields second (`timestamp`).
- **Sparse indexes**: `joinRequest.status` may benefit from `{ sparse: true }`.
- **Text index**: If full-text search on `title` and `description` becomes a bottleneck, add a text index.

---

## 9. Error Handling Strategy

### 9.1 Current State

All endpoints return proper HTTP status codes and a standardized JSON envelope:

| Response Type | Format |
|---------------|--------|
| **Success** | `{ data: ..., message: "OK" }` |
| **Client error (4xx)** | `{ error: "...", code: "ERROR_CODE" }` |
| **Server error (5xx)** | `{ error: "Internal server error", code: "INTERNAL_ERROR" }` |

A helper utility (`utils/response.js`) provides `success(res, data, message, status)` and `error(res, message, code, status, details)` used consistently across all route handlers. The global error handler catches unhandled errors and maps them to appropriate codes.

### 9.2 Standard Error Response Format

```json
// Success
{ "data": { ... }, "message": "OK" }

// Client error (4xx)
{ "error": "Validation failed", "code": "VALIDATION_ERROR", "details": [...] }

// Server error (5xx)
{ "error": "Internal server error", "code": "INTERNAL_ERROR" }
```

### 9.3 HTTP Status Code Mapping

| Condition | Status | Notes |
|-----------|--------|-------|
| Successful request | 200 | |
| Resource created | 201 | |
| Validation error (missing fields) | 400 | |
| Duplicate email | 409 | |
| Invalid credentials | 401 | |
| Missing/invalid token | 401 | |
| Not found | 404 | |
| Forbidden (not owner) | 403 | |
| Self-request denied | 400 | |
| Rate limited | 429 | express-rate-limit on `/auth/*` |
| Server error | 500 | |

### 9.4 Global Error Handler (`middlewares/errorHandler.js`)

The error handler maps Mongoose errors to consistent error codes before returning:

```javascript
function mapError(err) {
  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((e) => e.message);
    return { message: "Validation failed", code: "VALIDATION_ERROR", status: 400, details };
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return { message: `Duplicate ${field}`, code: "DUPLICATE_KEY", status: 409 };
  }
  if (err.name === "CastError") {
    return { message: "Invalid ID format", code: "INVALID_ID", status: 400 };
  }
  return { message: "Internal server error", code: "INTERNAL_ERROR", status: 500 };
}
```

| Error Type | HTTP Status | Code |
|------------|-------------|------|
| Mongoose ValidationError | 400 | `VALIDATION_ERROR` |
| MongoDB duplicate key (11000) | 409 | `DUPLICATE_KEY` |
| Mongoose CastError (bad ObjectId) | 400 | `INVALID_ID` |
| Unhandled / generic | 500 | `INTERNAL_ERROR` |

### 9.5 Remaining Improvements

1. **Add request logging** — integrate `morgan` for structured HTTP request logging.

---

## 10. Environment Configuration

### 10.1 Backend (`sync-board-b/.env`)

| Variable | Required | Default | Used In | Purpose |
|----------|----------|---------|---------|---------|
| `PORT` | No | `5000` | `app.js` | HTTP server port |
| `NODE_ENV` | No | `development` | `app.js`, `errorHandler.js` | Controls dev features (error handler currently sanitizes in all modes) |
| `MONGO_URL` | **Yes** | — | `app.js` | MongoDB Atlas connection string |
| `JWT_SECRET` | **Yes** | — | `authRoutes.js`, `middlewares/auth.js` | HMAC secret for JWT |
| `CORS_ORIGIN` | No | `http://localhost:5173` | `app.js` | Comma-separated allowed CORS origins |

### 10.2 Frontend (`sync-board-f/.env`)

| Variable | Required | Default | Used In | Purpose |
|----------|----------|---------|---------|---------|
| `VITE_API_BASE_URL` | No | `""` (empty) | `api.js` | Backend URL. Empty = same-origin (Vite proxy in dev). Set to deployed URL in production. |

### 10.3 Environment-Specific Configurations

#### Development

```env
# Backend
PORT=5000
NODE_ENV=development
MONGO_URL=mongodb+srv://dev_user:password@cluster.mongodb.net/sync-board-dev
JWT_SECRET=dev-secret-key
CORS_ORIGIN=http://localhost:5173

# Frontend
VITE_API_BASE_URL=
```

#### Production

```env
# Backend
PORT=5000
NODE_ENV=production
MONGO_URL=mongodb+srv://prod_user:password@cluster.mongodb.net/sync-board-prod
JWT_SECRET=<random-64-char-string>
CORS_ORIGIN=https://sync-board.vercel.app

# Frontend
VITE_API_BASE_URL=https://sync-board-api.onrender.com
```

> **Note**: Never commit `.env` files to version control. Use `.env.example` as a template.

---

## 11. Deployment Architecture

### 11.1 Free-Tier Production Stack

| Service | Hosts | Free Tier Limits | Cost |
|---------|-------|------------------|------|
| **Frontend** | Vercel | 100 GB bandwidth, 6000 build minutes/mo | $0 |
| **Backend** | Render | 750 hrs/mo, 512 MB RAM, spins down after 15 min idle | $0 |
| **Database** | MongoDB Atlas (M0) | 512 MB storage, shared RAM | $0 |

### 11.2 Deployment Diagram

```
                      ┌─────────────┐
                      │  Cloudflare  │  (optional: DNS, CDN, DDoS protection)
                      │  (Optional)  │
                      └──────┬──────┘
                             │
                ┌────────────┴────────────┐
                │                         │
         ┌──────▼──────┐          ┌───────▼────────┐
         │   Vercel    │          │    Render       │
         │ (Frontend)  │  HTTP    │  (Backend)      │
         │ SPA + Static│ ◄────────│ Express :5000   │
         │ sync-board  │          │ sync-board-api  │
         │ .vercel.app │          │ .onrender.com   │
         └─────────────┘          └───────┬─────────┘
                                          │
                                   ┌──────▼─────────┐
                                   │  MongoDB Atlas  │
                                   │  (M0 Free Tier) │
                                   │  cluster        │
                                   └─────────────────┘
```

### 11.3 Vercel Setup (Frontend)

1. Connect GitHub repo to Vercel.
2. Framework preset: **Vite**.
3. Root directory: `sync-board-f`.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Environment variable: `VITE_API_BASE_URL=https://sync-board-api.onrender.com`

`vercel.json`:
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://sync-board-api.onrender.com/api/$1" },
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### 11.4 Render Setup (Backend)

1. Create a new **Web Service** on Render.
2. Connect GitHub repo.
3. Root directory: `sync-board-b`.
4. Runtime: **Node**.
5. Build command: `npm install`.
6. Start command: `node app.js`.
7. Environment variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (Render sets this automatically)
   - `MONGO_URL`: Full MongoDB Atlas connection string
   - `JWT_SECRET`: Random 64-character string
   - `CORS_ORIGIN`: `https://sync-board.vercel.app`

### 11.5 MongoDB Atlas Setup

1. Create M0 (free tier) cluster.
2. Set up database user with password.
3. Whitelist `0.0.0.0/0` for network access (or Render's IP range).
4. Connection string: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/sync-board?retryWrites=true&w=majority`

### 11.6 Environment Variables Across Platforms

| Variable | Vercel (Frontend) | Render (Backend) | Local Dev |
|----------|-------------------|-------------------|-----------|
| `VITE_API_BASE_URL` | `https://api...` | N/A | `""` (proxy) |
| `NODE_ENV` | N/A | `production` | `development` |
| `MONGO_URL` | N/A | **Required** | `.env` file |
| `JWT_SECRET` | N/A | **Required** | `.env` file |
| `CORS_ORIGIN` | N/A | Vercel URL | `http://localhost:5173` |

---

## 12. Docker Setup

### 12.1 Backend Dockerfile (`sync-board-b/Dockerfile`)

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:24-alpine
WORKDIR /app
RUN addgroup --system app && adduser --system --ingroup app app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
USER app
EXPOSE 5000
CMD ["node", "app.js"]
```

### 12.2 Frontend Dockerfile (`sync-board-f/Dockerfile`)

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**`sync-board-f/nginx.conf`**:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 12.3 Docker Compose (`docker-compose.yml`)

```yaml
version: "3.8"

services:
  backend:
    build:
      context: ./sync-board-b
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    env_file:
      - ./sync-board-b/.env
    environment:
      - MONGO_URL=mongodb://mongo:27017/sync-board
      - NODE_ENV=production
    depends_on:
      mongo:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build:
      context: ./sync-board-f
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=http://localhost:5000
    depends_on:
      - backend
    restart: unless-stopped

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh --quiet
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  mongo_data:
```

### 12.4 Running with Docker

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# Stop everything
docker-compose down

# Reset database
docker-compose down -v
```

---

## 13. CI/CD Pipeline

### 13.1 GitHub Actions Workflow (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend:
    name: Backend — Lint & Test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: "npm"
          cache-dependency-path: sync-board-b/package-lock.json

      - name: Install dependencies
        working-directory: ./sync-board-b
        run: npm ci

      - name: Lint
        working-directory: ./sync-board-b
        run: npx eslint . --ext .js

      - name: Run tests
        working-directory: ./sync-board-b
        run: npm test
        env:
          NODE_ENV: test
          JWT_SECRET: test-secret-key
          MONGO_URL: mongodb://localhost:27017/test
          PORT: 5001

  frontend:
    name: Frontend — Lint & Build
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: "npm"
          cache-dependency-path: sync-board-f/package-lock.json

      - name: Install dependencies
        working-directory: ./sync-board-f
        run: npm ci

      - name: Lint
        working-directory: ./sync-board-f
        run: npx eslint . --ext .js,.jsx

      - name: Build
        working-directory: ./sync-board-f
        run: npm run build

  health:
    name: Backend — Health Check
    runs-on: ubuntu-latest
    needs: [backend, frontend]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: "24"

      - name: Install & Start Server
        working-directory: ./sync-board-b
        run: |
          npm ci
          MONGO_URL=mongodb://localhost:27017/test \
          JWT_SECRET=test-secret-key \
          NODE_ENV=production \
          PORT=5001 \
          node app.js &
          sleep 3

      - name: Check /health endpoint
        run: |
          curl -f http://localhost:5001/health || exit 1
```

### 13.2 Package Scripts

**Backend** (`sync-board-b/package.json`):
```json
{
  "scripts": {
    "dev": "nodemon app.js",
    "start": "node app.js",
    "test": "jest --detectOpenHandles --forceExit",
    "lint": "eslint . --ext .js"
  }
}
```

**Frontend** (`sync-board-f/package.json`):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .js,.jsx"
  }
}
```

---

## 14. Logging Strategy

### 14.1 Current State

No request logging is configured. Errors are logged to `console.error` in catch blocks with no structured format.

### 14.2 Recommended: Morgan

Add Morgan — a standard HTTP request logger for Express.

```bash
npm install morgan
```

**Integration in `app.js`**:

```javascript
const morgan = require("morgan");

if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}
```

**Log formats by environment**:

| Environment | Morgan Format | What It Logs |
|-------------|---------------|--------------|
| `development` | `dev` | Method, URL, status, response time (color-coded) |
| `production` | `combined` | Apache-style: IP, date, method, URL, status, user-agent |
| `test` | (disabled) | No logging (CI noise reduction) |

**Example `combined` output**:
```
203.0.113.1 - - [29/May/2026:14:30:25 +0000] "POST /api/v1/auth/login HTTP/1.1" 200 342 "-" "Mozilla/5.0"
```

### 14.3 What to Log

| Category | What | Where |
|----------|------|-------|
| **HTTP requests** | Method, URL, status, response time, IP, user-agent | Morgan middleware |
| **Auth failures** | Failed login attempts (email + IP, no password) | In auth routes |
| **Database errors** | MongoDB query failures, connection drops | In catch blocks + Mongoose event handlers |
| **Unhandled errors** | Full stack traces | `errorHandler.js` → `console.error` |

### 14.4 What NOT to Log

- Passwords (plaintext or hashed)
- JWT tokens
- API keys or secrets

### 14.5 Future: Structured Logging

At scale, replace `console.error` with a structured logger (pino or winston):

```javascript
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV === "development"
    ? { target: "pino-pretty" }
    : undefined,
});

logger.info({ userId, action: "login" }, "User logged in");
logger.error({ err, userId }, "Failed to create project");
```

---

## 15. Testing Strategy

### 15.1 What to Test

| Layer | What | Tool | Priority |
|-------|------|------|----------|
| **Backend: Auth** | Signup (success, duplicate, missing fields), Login (success, wrong password) | Jest + Supertest | P0 |
| **Backend: Projects** | Create (auth required, missing fields), Feed (pagination, search, sort) | Jest + Supertest | P0 |
| **Backend: Collaboration** | Send request (auth, duplicate, self-request), Accept/reject (owner guard) | Jest + Supertest | P1 |
| **Backend: Middleware** | Auth middleware (no token, invalid token, expired token, valid token) | Jest + Supertest | P0 |
| **Frontend: Auth** | Login form renders, submits correctly, shows errors | Vitest + RTL | P1 |
| **Frontend: Feed** | Renders project cards, search input, filter tabs | Vitest + RTL | P2 |

### 15.2 Recommended Tools

- **Backend**: Jest + Supertest + mongodb-memory-server for isolated tests
- **Frontend**: Vitest (already in Vite ecosystem) + React Testing Library

### 15.3 Backend Test Example

**`sync-board-b/__tests__/auth.test.js`**:

```javascript
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

describe("POST /api/v1/auth/signup", () => {
  it("creates a user with valid data", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({ username: "testuser", email: "test@test.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.password).toBeUndefined();  // currently fails — password is exposed
  });

  it("rejects duplicate email", async () => {
    await request(app)
      .post("/api/v1/auth/signup")
      .send({ username: "user1", email: "dup@test.com", password: "password123" });

    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({ username: "user2", email: "dup@test.com", password: "password456" });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it("rejects missing fields", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({ username: "nope" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/auth/login", () => {
  beforeEach(async () => {
    await request(app)
      .post("/api/v1/auth/signup")
      .send({ username: "testuser", email: "test@test.com", password: "password123" });
  });

  it("returns token with valid credentials", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("rejects wrong password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@test.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
  });
});
```

### 15.4 Running Tests

```bash
# Backend (with mongodb-memory-server — no external DB needed)
cd sync-board-b
npm test

# Frontend
cd sync-board-f
npx vitest
```

---

## 16. Scalability Considerations

### 16.1 Current Limits

| Threshold | What Breaks | Why |
|-----------|-------------|-----|
| **100 users** | Nothing | Single Express process handles this easily |
| **1,000 users** | Feed query latency | Aggregation pipeline with `$lookup` on every page load — no indexes |
| **5,000 users** | MongoDB connection pool exhaustion | Default Mongoose pool size (100) may be hit |
| **10,000 users** | Server response degradation | Single Express thread blocks on CPU-heavy operations |
| **50,000 users** | Feed becomes unusable | No caching, no CDN |
| **100,000 users** | Backend crashes under load | No horizontal scaling, no Redis cache |

### 16.2 Bottlenecks by Component

| Component | Bottleneck | Impact |
|-----------|------------|--------|
| **Feed aggregation** | `$lookup` + `$sort` on every request — no indexes, no cache | High latency at 1K+ users |
| **Auth (login)** | `bcrypt.compare` is CPU-intensive (~300ms per hash) | Thread blocking at 100+ logins/min |
| **Database** | Single M0 (shared CPU, 512 MB RAM) | Connection limits at scale |
| **Vite dev server** | Serves frontend in development | Production uses Vercel CDN |

### 16.3 Scaling Strategy

#### At 1,000 Users (Quick Wins)

| Action | Impact |
|--------|--------|
| Add database indexes (see §8) | Feed queries drop from 500ms to 5ms |
| Upgrade to M2 Atlas ($9/mo) | More connections, faster queries |
| Add rate limiting to auth routes | Prevents brute-force degradation |
| Separate read/write paths | Isolate feed reads from project writes |

#### At 5,000 Users (Medium-term)

| Action | Impact | Implementation |
|--------|--------|----------------|
| **Redis cache** for feed results | Sub-10ms feed responses | Cache `feed?page=N` for 30s; clear on new project |
| **Connection pooling** | Handle concurrent DB requests | Increase `maxPoolSize: 50` |
| **CDN for static assets** | Offload bandwidth | Vercel handles this automatically |
| **Upgrade to M10 Atlas** ($25/mo) | Dedicated CPU, 2 GB RAM | Better concurrent performance |

#### At 10,000+ Users (Architecture Changes)

| Action | Impact | Implementation |
|--------|--------|----------------|
| **Horizontal scaling** | Multiple Express instances behind load balancer | Stateless JWT makes this trivial; add session store in Redis |
| **Read replicas** | Separate read/write paths | MongoDB Atlas replica set; route feed to secondary |
| **Message queue** | Offload async tasks | Bull + Redis for notification delivery |
| **Socket.IO** | Replace HTTP polling for chat | Persistent WebSocket connections, Redis adapter for multi-server |

### 16.4 Proposed Architecture at 50,000 Users

```
                         ┌──────────────┐
                         │  Load Balancer│
                         │  (Cloudflare) │
                         └──────┬───────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                  │
        ┌─────▼─────┐   ┌──────▼──────┐   ┌──────▼──────┐
        │  Express 1 │   │  Express 2  │   │  Express N  │
        │  (stateless)│   │  (stateless)│   │  (stateless)│
        └─────┬─────┘   └──────┬──────┘   └──────┬──────┘
              │                 │                  │
              └────────────┬────┴──────────────────┘
                           │
              ┌────────────▼────────────┐
              │       Redis Cache       │
              │  • Feed pagination      │
              │  • Session store        │
              │  • Rate limiter         │
              │  • Bull queues          │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │    MongoDB Atlas M30    │
              │  • Primary (writes)     │
              │  • Secondary (reads)    │
              │  • Analytics node       │
              └─────────────────────────┘
```

---

## 17. Known Issues & Security Gaps

### P0 — Critical

All P0 issues have been resolved: password hashes are stripped from API responses, and proper HTTP status codes are returned.

### P1 — High

| Issue | Location | Impact | Status |
|-------|----------|--------|--------|
| **No input sanitization** | All routes | XSS, NoSQL injection possible via user input | Open — Joi validates format but does not sanitize content |

### P2 — Medium

| Issue | Location | Impact | Status |
|-------|----------|--------|--------|
| **No database indexes** | All models | Slow queries at 1K+ users | Open — indexes defined in ARCHITECTURE.md but not implemented in schema files |
| **`zod` dependency unused** | `package.json` | Unnecessary package | Open — Joi is used instead; `zod` should be removed |

### P3 — Low

| Issue | Location | Fix |
|-------|----------|------|
| **Capital T `Timestamp`** | `models/User.js` | Rename to `createdAt` with `timestamps: true` |
| **Typos ("or port", "exits")** | Multiple files | Fix spelling |

### P4 — Enhancements

| Issue | Notes |
|-------|-------|
| No email verification | Anyone can sign up with any email |
| No password reset | Users cannot recover accounts |
| No Content Security Policy | Helmet adds basic CSP; needs tuning |

---

## 18. Future Roadmap

### Completed  

| # | Item |
|---|------|
| 1 | Strip password from API responses — via destructuring in auth routes |
| 2 | Return proper HTTP status codes — 201/400/401/403/404/409/500 |
| 3 | Fix `useTheme` bug — `const root` declared inside `useEffect` |
| 4 | Add input validation — Joi schemas in `middlewares/joi.js` across all routes |
| 6 | Add rate limiting to auth endpoints — `express-rate-limit` (10 req/15 min) |
| 9 | Add MongoDB retry logic — `connectWithRetry()` with exponential backoff |
| 10 | Add owner-guard on join requests — `userId` check in `feed.js` |
| 12 | Set up GitHub Actions CI — lint, build, test, health check |
| 15 | Docker setup — Dockerfiles + docker-compose.yml |
| 16 | Deploy to production — Vercel + Render + Atlas |
| 17 | Socket.IO real-time chat — WebSocket message delivery, typing indicators, online presence |
| 27 | Project Roadmap (Kanban Board) — 5-column drag-and-drop board with @dnd-kit, task CRUD, optimistic updates, WebSocket events, owner/member permissions |

### Short-term (Weeks 1-4) —  

| # | Item | Complexity | Depends On |
|---|------|------------|------------|
| 5 | Add database indexes — `userId`, `timestamp`, `status`, `members` |  | — |
| 7 | Add Morgan logging — dev + production formats |  | — |
| 8 | Add proper error classes — consistent `{ error, code }` response format |  | — |
| 11 | Write backend tests — Jest + Supertest for auth, projects, collaboration |  | — |

### Medium-term (Months 1-3) —  

| # | Item | Complexity | Depends On |
|---|------|------------|------------|
| 13 | Collaboration notifications — notify owner when request is received |  | — |
| 14 | Write frontend component tests — Vitest + React Testing Library |  | — |

### Long-term (Months 3-6) —  

| # | Item | Complexity | Depends On |
|---|------|------------|------------|
| 18 | Whiteboard collaboration — real-time multi-user canvas via Socket.IO |  | — |
| 19 | File/image upload — attach images to projects, comments, canvas |  | — |
| 20 | Team management — invite by email, roles (admin/editor/viewer), permissions |  | — |
| 21 | Responsive mobile layout — feed, dashboard, workspace views |  | — |
| 22 | Email verification flow — confirm email on signup |  | — |
| 23 | Password reset flow — "Forgot password?" with email token |  | — |
| 24 | Redis caching — feed results, rate limit counters, session store |  | — |
| 25 | Activity feed — notifications for likes, comments, request status changes |  | — |
| 26 | OpenAPI/Swagger API documentation — auto-generated from route metadata |  | — |

---

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-05-29 | System | Initial architecture document |
| 2026-05-29 | System | Added Security Model, Database Indexing, Error Handling, Environment Config, Deployment, Docker, CI/CD, Logging, Testing, Scalability sections. Rewrote Known Issues with P0-P4 priority. Expanded Roadmap with complexity labels and dependencies. |
| 2026-07-02 | System | Updated to reflect current codebase: added Socket.IO, Tailwind CSS 4, Joi validation, rate limiting, MongoDB retry logic, useTheme fix, self-request guard. Corrected error handler behavior. Removed fixed issues from Known Issues and Roadmap. |
| 2026-07-02 | System | Phase 1 — conditional DNS override, simplified MongoDB connect with .catch() exit |
| 2026-07-02 | System | Phase 2 — standardized API response format (`{ data, message }` / `{ error, code }`), added `utils/response.js` helper, error handler maps Mongoose errors to codes, all catch blocks sanitized |
| 2026-07-14 | System | Added Project Roadmap (Kanban Board): Task model, task routes, @dnd-kit DnD, workspace tab system, roadmap components, CSS styles |
| 2026-07-16 | System | Added Team Management: team.js routes (7 endpoints), 3-tier permission model (owner/admin/member), TEAM_ROLES enum, Project.members schema update with userId/permission/teamRole/joinedAt. Added EditProject page (title/description read-only), MyFeed page, ProjectDetail page. Updated frontend routing and component tree. |
