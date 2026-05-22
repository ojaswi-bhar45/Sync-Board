# Sync Board — Architecture

## 1. Overview

Sync Board is a collaborative whiteboard application with user authentication. It follows a **client-server architecture** with a React frontend communicating with an Express REST API over HTTP.

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
| **Styling** | Pure CSS with CSS custom properties |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Browser                          │
│  ┌───────────────────────────────────────────────┐  │
│  │           React SPA (:5173)                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │  │
│  │  │  Login   │  │  Signup  │  │  Dashboard   │  │  │
│  │  │  Page    │  │  Page    │  │  (placeholder)│  │  │
│  │  └────┬─────┘  └────┬─────┘  └─────────────┘  │  │
│  │       │              │                          │  │
│  │       └──────────────┘                          │  │
│  │                  │                              │  │
│  │            fetch / POST                         │  │
│  └──────────────────┼──────────────────────────────┘  │
└─────────────────────┼─────────────────────────────────┘
                      │ HTTP (JSON)
                      ▼
┌─────────────────────────────────────────────────────┐
│           Express Server (:5000)                     │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ CORS     │  │ JSON Parser  │  │ Auth Router   │  │
│  │ Middleware│  │ Middleware   │  │ /signup       │  │
│  │          │  │              │  │ /login        │  │
│  └──────────┘  └──────────────┘  └──────┬───────┘  │
│                                         │           │
│                                  Mongoose ODM       │
│                                         │           │
└─────────────────────────────────────────┼───────────┘
                                          │
                                    MongoDB Atlas
                                          │
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
│   ├── app.js                       # Express entry point
│   ├── package.json                 # Dependencies: express, mongoose, bcryptjs, etc.
│   ├── .env                         # PORT, MONGO_URL, JWT_SECRET
│   ├── .gitignore
│   ├── controllers/
│   │   └── authController.js        # Signup + login route handlers
│   ├── models/
│   │   └── User.js                  # Mongoose User schema
│   ├── routes/
│   │   └── authRoutes.js            # Empty (unused — routing lives in controller)
│   ├── middlewares/                  # Empty (JWT middleware not yet implemented)
│   └── node_modules/
│
└── sync-board-f/                    # Frontend
    ├── index.html                   # Vite HTML entry
    ├── vite.config.js               # Vite config (React plugin only)
    ├── package.json                 # Dependencies: react, react-dom, react-router-dom, lucide-react
    ├── eslint.config.js             # Flat ESLint config
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    └── src/
        ├── main.jsx                 # React entry, BrowserRouter, dark theme default
        ├── App.jsx                  # Routes definition
        ├── App.css                  # Empty (cleared — all styles in index.css)
        ├── index.css                # All styles (1121 lines, CSS custom properties)
        ├── pages/
        │   ├── Login.jsx            # Login page (email + password)
        │   └── Signup.jsx           # Signup page (username + email + password)
        ├── components/
        │   ├── Sidebar.jsx          # Navigation sidebar (orphaned)
        │   ├── Dashboard.jsx        # Project dashboard (orphaned)
        │   ├── ProjectCard.jsx      # Individual project card (orphaned)
        │   ├── Toolbar.jsx          # Floating tool palette (orphaned)
        │   ├── ChatPanel.jsx        # Floating chat panel (orphaned)
        │   └── Whiteboard/
        │       ├── Canvas.jsx        # Whiteboard container (orphaned)
        │       ├── IdeaCard.jsx      # Draggable idea card (orphaned)
        │       └── StickyNote.jsx    # Draggable sticky note (orphaned)
        ├── hooks/
        │   ├── useTheme.js          # Dark/light theme toggle
        │   └── useDraggable.js      # Pointer-based drag behavior
        └── assets/
            ├── hero.png
            ├── react.svg
            └── vite.svg
```

---

## 4. Backend Architecture

### 4.1 Entry Point (`app.js`)

The server setup follows a linear middleware chain:

```
require dotenv → create app → cors() → express.json() → mount routes → connect MongoDB → listen
```

| Step | What it does |
|------|-------------|
| `dns.setServers()` | Overrides DNS to Google (8.8.8.8, 8.8.4.4) for Atlas SRV resolution |
| `cors()` | Allows all origins (permissive, dev-only) |
| `express.json()` | Parses `application/json` request bodies |
| `app.use("/", authRoute)` | Mounts auth router at root path |
| `mongoose.connect()` | Connects to MongoDB Atlas (no retry logic) |
| `app.listen()` | Starts HTTP server on configured PORT |

### 4.2 API Endpoints

#### POST /signup

| Aspect | Detail |
|--------|--------|
| **Request body** | `{ username: string, email: string, password: string }` |
| **Validation** | Checks all fields present (after DB lookup — order issue) |
| **Duplicate check** | `User.findOne({ email })` — returns "already exists" if found |
| **Password hashing** | `bcrypt.hash(password, 10)` — 10 salt rounds |
| **Success response** | `{ message, user }` — **includes password hash** (security issue) |
| **Error response** | `{ message }` — leaks internal error messages |

#### POST /login

| Aspect | Detail |
|--------|--------|
| **Request body** | `{ email: string, password: string }` |
| **Validation** | Checks both fields present |
| **User lookup** | `User.findOne({ email })` |
| **Password verify** | `bcrypt.compare(password, user.password)` |
| **Token** | `jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1d" })` |
| **Success response** | `{ message, token, user }` — **includes password hash** |
| **Error response** | `{ message }` |

### 4.3 Database Schema (`User` model)

```javascript
{
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  Timestamp: { type: Date, default: Date.now }
}
```

- Mongoose creates a unique sparse index on `email`.
- No `timestamps: true` option — uses a hand-rolled `Timestamp` field.
- No password exclusion in `toJSON` — hashed password is included in all serialized output.

### 4.4 Dependencies

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

### 4.5 Environment Variables

| Variable | Required | Used In | Purpose |
|----------|----------|---------|---------|
| `PORT` | No* | `app.js` | HTTP server port (defaults to Express default ~3000) |
| `MONGO_URL` | Yes | `app.js` | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | `authController.js` | HMAC secret for JWT signing |

### 4.6 Known Backend Issues

| Issue | Severity |
|-------|----------|
| All responses return HTTP 200 (no 400/401/404/500) | High |
| Password hash exposed in API responses | Critical |
| Error messages leak internal details | High |
| No auth middleware for protected routes | High |
| Validation order bug (DB check before field check) | Medium |
| `routes/authRoutes.js` is empty / unused | Low |
| `middlewares/` is empty (no JWT verification) | High |
| `cookie-parser` installed but unused | Low |
| No input sanitization or rate limiting | Medium |

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
| `/dashboard` | `Home` (inline) | Placeholder post-login view |
| `*` | `Navigate to="/"` | Catch-all redirect |

- Programmatic navigation via `useNavigate` (login → dashboard, signup → login).
- `<Link>` components for auth page switching.

### 5.3 Auth Flow

```
Login                      Signup
  │                          │
  ▼                          ▼
fetch POST /login          fetch POST /signup
  │                          │
  ▼                          ▼
Check for token             Check for user
  │                          │
  ├─ Yes: localStorage      ├─ Yes: navigate('/')
  │   store token+user      └─ No: show error
  │   navigate('/dashboard')
  └─ No: show error
```

- Both pages use `FormData` to read values directly from the DOM on submit (handles autofill).
- Token and user object stored in `localStorage`.
- No auth context — token is written but never read by any component.

### 5.4 Component Tree

```
<BrowserRouter>
  <Routes>
    <Login />           → email + password form, password toggle
    <Signup />           → username + email + password form, password toggle
    <Home />             → centered placeholder text
    <Navigate />         → catch-all redirect to /
  </Routes>
</BrowserRouter>
```

### 5.5 Orphaned (Unwired) Components

The following components exist in the filesystem but are **not imported or rendered** by any route:

| Component | File | Purpose |
|-----------|------|---------|
| `Sidebar` | `components/Sidebar.jsx` | Navigation (Dashboard, Projects, Team, etc.) + theme toggle + user profile |
| `Dashboard` | `components/Dashboard.jsx` | Projects grid with 6 hardcoded project cards |
| `ProjectCard` | `components/ProjectCard.jsx` | Individual project stats + progress bar + team avatars |
| `Toolbar` | `components/Toolbar.jsx` | Floating tool palette (pen, shapes, sticky notes, share) |
| `ChatPanel` | `components/ChatPanel.jsx` | Floating chat with messages + input |
| `Canvas` | `components/Whiteboard/Canvas.jsx` | Whiteboard area with draggable elements + zoom controls |
| `StickyNote` | `components/Whiteboard/StickyNote.jsx` | Draggable sticky note with editable content |
| `IdeaCard` | `components/Whiteboard/IdeaCard.jsx` | Draggable idea card with badge + progress |

These were part of an earlier/planned main workspace layout (sidebar + toolbar + canvas + chat) that has not yet been wired into the routing.

### 5.6 State Management

All state is **local** — no Redux, no Context, no Zustand.

| Component | State |
|-----------|-------|
| `Login` | `form` (email, password), `showPassword`, `error`, `loading` |
| `Signup` | `form` (username, email, password), `showPassword`, `error`, `loading` |
| `StickyNote` | `text` (editable content) |
| `ChatPanel` | `isOpen`, `inputValue`, `messages` (hardcoded seed) |
| `useTheme` | `theme` ("dark" / "light") persisted to localStorage |
| `useDraggable` | `position` ({ top, left }), refs for drag tracking |

### 5.7 Custom Hooks

#### `useTheme`
- Reads initial value from `localStorage` (defaults to `"dark"`).
- Sets/removes `data-theme` attribute on `<html>`.
- Persists changes to `localStorage`.
- **Known bug**: references undeclared variable `root` — will throw `ReferenceError`.

#### `useDraggable`
- Uses Pointer Events API (`pointerdown`, `pointermove`, `pointerup`).
- Uses `setPointerCapture` / `releasePointerCapture` for reliable tracking.
- Prevents drag on textarea/input elements.
- Returns `{ position, dragHandlers }` for spread onto elements.

### 5.8 Styling Architecture

All styles live in a single file: **`src/index.css`** (1121 lines).

#### Theming via CSS Custom Properties

```css
:root { /* light theme (default) */
  --bg-dark: #ffffff;
  --accent-color: #4f46e5;
  --text-main: #0f172a;
  /* ... */
}

:root[data-theme='dark'] {
  --bg-dark: #121212;
  --accent-color: #6366f1;
  --text-main: #f3f4f6;
  /* ... */
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

#### Layout Classes

| Class | Layout | Purpose |
|-------|--------|---------|
| `.app-container` | flex row | Sidebar + main content split |
| `.sidebar` | 260px column | Navigation |
| `.main-content` | flex-1 | Right-side content area |
| `.auth-page` | centered flex | Full-Viewport auth layout |
| `.auth-card` | max 420px | Auth form card |
| `.whiteboard-area` | flex-1 | Canvas with grid background |
| `.floating-toolbar` | absolute, centered | Tool palette |
| `.floating-chat-panel` | absolute, right | Chat panel |
| `.dashboard-container` | scrollable | Dashboard page |
| `.projects-grid` | CSS Grid | Auto-fill project cards |

#### Animations

| Keyframe | Element | Effect |
|----------|---------|--------|
| `slideDown` | `.floating-toolbar` | Elastic slide from above |
| `slideLeft` | `.floating-chat-panel` | Slide from right |
| `slideUp` | `.chat-message` | Fade up on appear |
| `fadeIn` | `.projects-grid`, `.auth-card` | Fade in + translate up |

---

## 6. Data Flow

### 6.1 Signup Flow

```
User fills form → clicks "Create account"
  → handleSubmit reads form via FormData
  → Validates: all fields present, password >= 6 chars
  → fetch POST /signup  { username, email, password }
  → Backend validates, hashes password, creates user in MongoDB
  → Response: { message, user }
    ├─ Success (user exists) → navigate('/')
    └─ Error (message)       → show error banner
```

### 6.2 Login Flow

```
User fills form → clicks "Sign in"
  → handleSubmit reads form via FormData
  → Validates: both fields present
  → fetch POST /login  { email, password }
  → Backend looks up user, compares password, generates JWT
  → Response: { message, token, user }
    ├─ Success (token present) → localStorage.setItem('token', token)
    │                            localStorage.setItem('user', JSON.stringify(user))
    │                            navigate('/dashboard')
    └─ Error (message)         → show error banner
```

---

## 7. Known Issues & Security Gaps

### Critical

- **Password hash exposed in API responses** — both signup and login return the full user document including `password` field.
- **No JWT middleware** — `middlewares/` is empty; there is no way to protect routes.
- **All responses return HTTP 200** — validation errors, auth failures, and server errors all return 200 instead of proper status codes (400, 401, 404, 500).

### High

- **Error messages leak internals** — `catch` blocks return `err.message` directly to client (may expose MongoDB errors, etc.).
- **CORS wide open** — `cors()` with no options allows all origins.
- **No auth context or protected routes** — `/dashboard` is accessible without authentication; no route guards exist.
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
- Typos: "or port" → "on port", "exits" → "exists", "regiestered" → "registered".

---

## 8. Future Roadmap

### Short-term

1. **Wire up workspace components** — integrate Sidebar, Toolbar, Canvas, ChatPanel into a `/workspace` route.
2. **Create auth context** — add `AuthContext` to share user state across components, add `ProtectedRoute` wrapper.
3. **Fix `useTheme` bug** — declare `const root = document.documentElement`.
4. **Strip password from API responses** — add Mongoose `toJSON` transform.
5. **Use proper HTTP status codes** — 400, 401, 409, 500.

### Medium-term

6. **Add JWT verification middleware** — protect future routes.
7. **Input validation** — email regex, password strength, input trimming.
8. **Move API base URL to environment variable** — `VITE_API_URL` in `.env`.
9. **Add form validation feedback** — inline field-level errors.
10. **Rate limiting** on auth endpoints (`express-rate-limit`).

### Long-term

11. **Real-time collaboration** — WebSocket (Socket.IO) for multi-user whiteboard editing.
12. **Persist whiteboard data** — save/load board elements from MongoDB.
13. **File/image upload** — attach images to whiteboard or chat.
14. **Team management** — invite members, permissions.
15. **Responsive design** — mobile support for the workspace view.
