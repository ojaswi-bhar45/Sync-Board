<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=200&color=0:6366f1,50:8b5cf6,100:a855f7&text=Sync%20Board&fontColor=ffffff&fontSize=60&fontAlignY=35&desc=Find%20your%20next%20build%20team&descAlignY=55" />
</p>

<p align="center">
  <b>A developer collaboration platform — discover projects, share ideas, and join teams that build together.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-24.0-339933?logo=nodedotjs" />
  <img src="https://img.shields.io/badge/express-5.0-000000?logo=express" />
  <img src="https://img.shields.io/badge/react-19.0-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/vite-8.0-646CFF?logo=vite" />
  <img src="https://img.shields.io/badge/mongodb-7.0-47A248?logo=mongodb" />
  <img src="https://img.shields.io/badge/mongoose-9.0-880000?logo=mongoose" />
  <img src="https://img.shields.io/badge/jwt-auth-000000?logo=jsonwebtokens" />
  <img src="https://img.shields.io/badge/tailwind-4.0-06B6D4?logo=tailwindcss" />
</p>

---

##  Problem

Developer portfolios and solo GitHub repos only tell half the story. Finding *the right people* to build with is harder than writing the code itself.

Sync Board exists to close that gap. It's a space where developers can:

- Post project ideas and gauge interest before writing a single line of code.
- Discover active projects that match their stack and interests.
- Request to join teams with a note about what they bring.
- Manage team requests, chat, and share a visual workspace — all in one place.

No more cold DMs. No more abandoned side projects. Just a board to sync on.

---

##  Features

###  Discovery & Feed
- **Three-column feed layout** — navigation sidebar, scrollable project cards, trending tags panel
- **Infinite scroll** — paginated via Intersection Observer, no "Load More" button
- **Search + filter** — by keyword, tag, or sort order (recent, trending)
- **Trending section** — horizontal carousel of hot projects
- **Project cards** — avatar, tech stack pills, like button, comment toggle, collaborate handshake

###  Collaboration
- **Join requests** — send a note with your request; owner sees all incoming in a dedicated view
- **Request management** — accept/reject with one click; accepted users join the project member list
- **Incoming & sent tabs** — track every request's status (pending / accepted / rejected)

###  Chat & Communication
- **Per-project chat** — real-time message panel (polling-based)
- **Persistent history** — messages stored in MongoDB per project
- **Global chat toggle** — open from any dashboard view via `ChatContext`

###  Dashboard & Projects
- **My Projects** — glassmorphism grid with filter tabs (All / Owned / Member), search, and stats
- **Project CRUD** — create, edit, and manage your own projects
- **Profile management** — editable contact info, LinkedIn, GitHub links with completeness tracker

###  Whiteboard (Alpha)
- **Draggable canvas** — move elements freely with Pointer Events
- **Sticky notes** — editable text, custom positioning
- **Idea cards** — badges, progress bars, draggable layout

###  UX / Polish
- **Dark theme default** — CSS custom properties with light/dark toggle (`useTheme` hook)
- **Glassmorphism design** — `backdrop-filter: blur`, gradient accents, hover lift effects
- **Toast notifications** — slide-in success/error banners via `Toast` component
- **Skeleton loaders** — shimmer animations during data fetching
- **Route-based navigation** — every view has its own URL (no state-driven view switching)

---

##  Tech Stack

| Layer              | Technology                                                                 |
|--------------------|----------------------------------------------------------------------------|
| **Frontend**       | React 19 + Vite 8 + Tailwind CSS 4 + React Router 7                       |
| **Backend**        | Node.js 24 + Express 5                                                     |
| **Database**       | MongoDB Atlas (MongoDB 7) + Mongoose 9 ODM                                 |
| **Authentication** | bcryptjs (password hashing) + jsonwebtoken (stateless JWT)                 |
| **Icons**          | lucide-react                                                               |
| **Dev Tools**      | nodemon (backend hot-reload), ESLint 10 (flat config), Vite HMR            |

---

##  Demo

> **Live site:** _Coming soon — frontend deploys to Vercel, backend to Render/Railway._

![Screenshot placeholder](https://via.placeholder.com/800x450/1e1e1e/6366f1?text=Sync+Board+Preview)

---

##  Getting Started

### Prerequisites

- **Node.js** >= 22 (project uses Node 24)
- **MongoDB Atlas** cluster (free tier works) or local MongoDB instance
- **npm** >= 10

### Clone

```bash
git clone https://github.com/yourusername/sync-board.git
cd sync-board
```

### Backend Setup

```bash
cd sync-board-b
npm install
cp .env.example .env    # fill in your credentials
npm run dev             # starts on :5000 with nodemon
```

### Frontend Setup

```bash
cd sync-board-f
npm install
npm run dev             # starts on :5173 with Vite HMR
```

Open [http://localhost:5173](http://localhost:5173) — the Vite dev server proxies `/api/*` requests to `localhost:5000`.

---

##  Environment Variables

### Backend (`sync-board-b/.env`)

```env
PORT=5000
NODE_ENV=development
MONGO_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=<app>
JWT_SECRET=<your-secret-key>
CORS_ORIGIN=http://localhost:5173
```

| Variable       | Required | Default               | Description                         |
|----------------|----------|-----------------------|-------------------------------------|
| `PORT`         | No       | `5000`                | Express server port                 |
| `NODE_ENV`     | No       | `development`         | Controls error verbosity            |
| `MONGO_URL`    | **Yes**  | —                     | MongoDB Atlas connection string     |
| `JWT_SECRET`   | **Yes**  | —                     | HMAC secret for signing JWT tokens  |
| `CORS_ORIGIN`  | No       | `http://localhost:5173` | Comma-separated allowed CORS origins |

### Frontend (`sync-board-f/.env`)

```env
VITE_API_BASE_URL=
```

| Variable             | Required | Default | Description                                                                 |
|----------------------|----------|---------|-----------------------------------------------------------------------------|
| `VITE_API_BASE_URL`  | No       | `''`    | Backend URL for production (empty = same-origin proxy in dev via Vite)      |

**Production note:** Set `VITE_API_BASE_URL=https://your-backend.onrender.com` when deploying the frontend separately.

---

##  API Reference

All routes are mounted under `/api/v1`. Auth is via `Authorization: Bearer <token>` header.

### Auth

| Method | Route             | Auth | Description          |
|--------|-------------------|------|----------------------|
| POST   | `/auth/signup`    | No   | Create an account    |
| POST   | `/auth/login`     | No   | Sign in, get JWT     |

### Feed & Projects

| Method | Route                        | Auth | Description                        |
|--------|------------------------------|------|------------------------------------|
| GET    | `/projects/feed`             | No   | Paginated feed (sort, search, tag) |
| POST   | `/projects/create`           | Yes  | Create a new project               |
| PUT    | `/projects/like/:id`         | Yes  | Toggle like on a project           |
| POST   | `/projects/comment/:id`      | Yes  | Add a comment                      |
| POST   | `/projects/request/:id`      | Yes  | Send join request                  |
| GET    | `/projects/incoming-requests`| Yes  | Requests for your projects         |
| GET    | `/projects/my-requests`      | Yes  | Requests you've sent               |
| PUT    | `/projects/request/:pid/:rid`| Yes  | Accept/reject a request            |
| GET    | `/projects/my-teams`         | Yes  | Projects you own or belong to      |
| DELETE | `/projects/:pid/members/:uid`| Yes  | Remove a member                    |

### Dashboard (Projects CRUD)

| Method | Route                          | Auth | Description                |
|--------|--------------------------------|------|----------------------------|
| GET    | `/projects/project`            | Yes  | List your own projects     |
| POST   | `/projects/add-projects`       | Yes  | Create dashboard project   |
| PATCH  | `/projects/edit-project/:id`   | Yes  | Edit your project          |

### Chat

| Method | Route                | Auth | Description                 |
|--------|----------------------|------|-----------------------------|
| GET    | `/chat/:projectId`   | Yes  | Get message history         |
| POST   | `/chat/:projectId`   | Yes  | Send a chat message         |

### Canvas (Whiteboard)

| Method | Route                             | Auth | Description                |
|--------|-----------------------------------|------|----------------------------|
| GET    | `/canvas/:projectId`              | Yes  | Get all canvas elements    |
| POST   | `/canvas/:projectId`              | Yes  | Create a canvas element    |
| PATCH  | `/canvas/:projectId/:elementId`   | Yes  | Update an element          |
| DELETE | `/canvas/:projectId/:elementId`   | Yes  | Delete an element          |

### Profile

| Method | Route            | Auth | Description               |
|--------|------------------|------|---------------------------|
| GET    | `/profile/`      | Yes  | Get your profile          |
| PATCH  | `/profile/edit`  | Yes  | Update profile fields     |

---

##  Project Structure

```
sync-board/
├── ARCHITECTURE.md                  # Deep-dive architecture docs
│
├── sync-board-b/                    # Backend — Express 5 REST API
│   ├── app.js                       # Entry: helmet, compression, CORS, route mount
│   ├── routes/
│   │   ├── index.js                 # Mounts all sub-routers at /api/v1
│   │   ├── authRoutes.js            # POST /signup, POST /login
│   │   ├── feed.js                  # Feed, likes, comments, join requests
│   │   ├── project.js               # Dashboard project CRUD
│   │   ├── chat.js                  # Per-project messaging
│   │   ├── canvas.js                # Whiteboard element CRUD
│   │   └── profile.js               # GET / and PATCH /edit
│   ├── models/
│   │   ├── User.js                  # username, email, password, profile fields
│   │   ├── Project.js               # title, techStack, likes, comments, members, requests
│   │   ├── Message.js               # chat messages per project
│   │   └── CanvasElement.js         # whiteboard elements
│   ├── middlewares/
│   │   ├── auth.js                  # JWT verification
│   │   └── errorHandler.js          # Global error handler
│   └── .env.example
│
├── sync-board-f/                    # Frontend — React 19 SPA
│   ├── src/
│   │   ├── main.jsx                 # BrowserRouter + dark theme default
│   │   ├── App.jsx                  # Route definitions (Login, Signup, Dashboard routes)
│   │   ├── api.js                   # API client — every endpoint as a named export
│   │   ├── pages/                   # Login, Signup, Feed, CreateProject
│   │   ├── components/              # ProjectCard, ChatPanel, Workspace, Profile + Whiteboard/
│   │   ├── context/                 # AuthContext (JWT state) + ChatContext (global chat)
│   │   ├── hooks/                   # useTheme, useDraggable
│   │   └── index.css                # ~4000 lines, CSS custom properties, glassmorphism
│   ├── .env
│   ├── vite.config.js               # Proxy /api → :5000 in dev
│   └── vercel.json                  # SPA rewrites + API proxy for production
```

---

##  Architecture

Sync Board follows a **client-server architecture** — a React SPA communicates with a stateless Express REST API over HTTP. The backend is organized as a flat route-layer with JWT middleware, Mongoose models, and no controller abstraction. The frontend uses React Router 7 for route-based navigation, a global `AuthContext` for JWT state management, and a collection of functional components with local state (no Redux/Zustand).

All API routes are mounted under a single `/api/v1` prefix via `routes/index.js`. The Vite dev server proxies `/api/*` requests to the Express backend, so the frontend never needs to know the backend URL during development. In production, the frontend reads `VITE_API_BASE_URL` from environment and hits the deployed backend directly.

> **→ [Read the full ARCHITECTURE.md](./ARCHITECTURE.md)** for data flow diagrams, schema details, known issues, and the complete roadmap.

---

##  Known Issues

| Severity | Issue |
|----------|-------|
|  Critical | Password hash exposed in signup/login API responses |
|  Critical | All endpoints return HTTP 200 regardless of success/failure |
|  High | Error messages leak internal details (MongoDB errors, stack traces) |
|  High | `useTheme` hook references undeclared variable (`root`) — will throw at runtime |
|  Medium | No input validation (email format, password strength) |
|  Medium | No rate limiting on auth endpoints — brute force possible |
|  Medium | No MongoDB connection retry — server starts even if DB is unreachable |
|  Low | Dead code: empty `authRoutes.js`, unused `cookie-parser` dependency |

See [ARCHITECTURE.md — Known Issues](./ARCHITECTURE.md#7-known-issues--security-gaps) for the full list.

---

##  Roadmap

### Short-term

- Strip password from API responses via Mongoose `toJSON` transform
- Return proper HTTP status codes (400, 401, 404, 500) across all endpoints
- Fix `useTheme` ReferenceError
- Add input validation (email regex, password strength, trimming)

### Medium-term

- `ProtectedRoute` wrapper at the router level (not component-level token checks)
- Rate limiting on `/auth/*` with `express-rate-limit`
- Consistent error response format `{ error: string, code: string }`
- Prevent self-requests on join requests

### Long-term

- Real-time collaboration via WebSocket (Socket.IO)
- Whiteboard persistence — save/load canvas elements from MongoDB
- File/image upload for projects and comments
- Team management with roles, permissions, and invites
- Responsive mobile layout for feed and workspace views

---

##  Contributing

Contributions are welcome. This project is early-stage and rough around the edges — if you want to help knock out the known issues or add features from the roadmap, jump in.

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push: `git push origin feat/your-feature`
5. Open a pull request

Please keep PRs focused on a single concern. For larger features, open an issue first to discuss.

---

##  License

[MIT](./LICENSE)
