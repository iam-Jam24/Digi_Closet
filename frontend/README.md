# DigiCloset — Frontend Client

The frontend client for DigiCloset, built with **React 19**, **Vite 8**, **React Router v7**, and a bespoke vanilla CSS design system.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [React 19](https://react.dev/) | UI component library |
| [Vite 8](https://vite.dev/) | Fast build tool & dev server with HMR |
| [React Router v7](https://reactrouter.com/) | Client-side routing and protected routes |
| [Firebase JS SDK v13](https://firebase.google.com/) | Client-side authentication (Email/Password, Google) |
| [Axios](https://axios-http.com/) | REST API client with auth interceptors |
| [Lucide React](https://lucide.dev/) | Clean, modern iconography |
| [Vanilla CSS](src/styles/) | Design tokens, glassmorphism, responsive utilities (no Tailwind) |

---

## Directory Structure

```
frontend/
├── public/                 # Static assets (favicon, icons sprite)
├── src/
│   ├── components/         # 15 reusable UI components (Buttons, Cards, Modals, etc.)
│   ├── context/            # AuthContext (Firebase auth state & session sync)
│   ├── hooks/              # Custom React hooks (useWardrobe, useOutfits, useChat, etc.)
│   ├── layout/             # MainLayout (Sidebar + Navbar) & AuthLayout
│   ├── pages/              # 15 application views / routes
│   ├── routes/             # AppRoutes config & ProtectedRoute guard
│   ├── services/           # Axios instance (`api.js`) with bearer token injection
│   ├── styles/             # Modular CSS (tokens, base, layout, pages, components)
│   ├── App.jsx             # Top-level application shell with ToastProvider
│   ├── firebase.js         # Firebase App & Auth initialization
│   ├── index.css           # Global CSS imports and root styling
│   └── main.jsx            # React root mount
├── .env.example            # Sample client environment variables
├── package.json            # Frontend dependencies & npm scripts
└── vite.config.js          # Vite config with `/api` reverse proxy to backend
```

---

## Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your Firebase credentials:

```ini
VITE_API_BASE_URL=/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> **Note for Local Development:**
> If you are running the Firebase Auth Emulator locally (`localhost:9099`), set `VITE_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099`.

### 3. Run Dev Server

```bash
npm run dev
```

The frontend will run at `http://localhost:5173`. Requests to `/api/*` are automatically proxied to the backend at `http://localhost:5001`.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts Vite dev server with Hot Module Replacement on `http://localhost:5173` |
| `npm run build` | Compiles and bundles production-ready assets into `dist/` |
| `npm run preview` | Serves the production build locally for verification |
| `npm run lint` | Runs oxlint on all JSX and JS files |

---

## Styling Architecture

DigiCloset uses a clean, zero-dependency CSS variable architecture located in `src/styles/`:

- `tokens.css` — Color palettes, spacing scales, border radiuses, typography, box shadows
- `base.css` — Modern reset, body styling, custom scrollbars
- `layout.css` — App shell grid, sidebar navigation, top bar, content wrapper
- `pages.css` — Page-specific layouts (Wardrobe grid, Weather widget, Onboarding wizard, Try-On canvas)
- `home.css` — Landing page hero, feature showcases, call-to-actions
- `components/` — Scoped component styles for buttons, cards, dropzones, dialogs
