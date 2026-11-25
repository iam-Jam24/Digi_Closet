# DigiCloset — Local Setup & Development Guide

This guide walks you through setting up DigiCloset from scratch on macOS, Linux, or Windows (WSL recommended).

---

## Prerequisites

Before starting, ensure you have the following installed:

| Tool | Version Requirement | Purpose |
|------|---------------------|---------|
| [Node.js](https://nodejs.org/) | `v18.0.0` or higher | JavaScript runtime |
| [npm](https://www.npmjs.com/) | `v9.0.0` or higher | Package manager |
| [MongoDB](https://www.mongodb.com/try/download/community) | `v6.0+` or MongoDB Atlas | Database engine |
| [Git](https://git-scm.com/) | Latest | Version control |
| [Firebase CLI](https://firebase.google.com/docs/cli) (optional) | Latest | Running local Firebase Auth emulator |

---

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/iam-Jam24/Digi_Closet.git
cd Digi_Closet
```

---

### 2. Configure the Backend

#### A. Install Backend Dependencies

```bash
cd backend
npm install
```

#### B. Setup Environment Variables

Create `.env` by copying the example file:

```bash
cp .env.example .env
```

Open `backend/.env` and review the configuration:

```ini
# Server Configuration
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/digi_closet

# Firebase Auth Emulator (Zero Setup Local Auth)
FIREBASE_PROJECT_ID=demo-digi-closet
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099

# Google Gemini AI (required for all AI features; no offline mode)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_FALLBACK_MODEL=gemini-3.1-flash-lite

# Try-On / Makeover images: Gemini (paid tier) first, then free Hugging Face
# Spaces. Works on a free Gemini key; HF_TOKEN (free) is optional and raises
# the daily GPU quota. See backend/.env.example for all options.
IMAGE_GENERATION_PROVIDERS=gemini,huggingface
HF_TOKEN=

# Live product listings for Clothes Finder / Budget Planner (optional, SerpApi)
PRODUCT_SEARCH_PROVIDER=serpapi
PRODUCT_SEARCH_API_KEY=

# File Storage (Leave blank for local filesystem storage in dev)
FIREBASE_STORAGE_BUCKET=
```

#### C. Start MongoDB

If using local MongoDB, DigiCloset provides convenient scripts:

```bash
# Starts mongod pointing to ~/.digi-closet/mongodb-data
npm run db:start
```

*Note: If you already run MongoDB as a system service (`brew services start mongodb-community` or `systemctl start mongod`), you do not need `npm run db:start`.*

#### D. Start the Firebase Auth Emulator

```bash
firebase emulators:start --only auth --project demo-digi-closet
```

#### E. Start Backend Dev Server

```bash
npm run dev
```

The backend server is now running at `http://localhost:5001`. You can test it by visiting:
```bash
curl http://localhost:5001/api/health
```

---

### 3. Configure the Frontend

Open a new terminal window:

#### A. Install Frontend Dependencies

```bash
cd frontend
npm install
```

#### B. Setup Environment Variables

```bash
cp .env.example .env
```

For local development the defaults work as-is: leave the Firebase values blank
to use the Auth Emulator demo config, and leave `VITE_API_BASE_URL` blank so
Vite proxies `/api` to the backend on port 5001.

```ini
# Blank = same-origin /api (Vite dev proxy)
VITE_API_BASE_URL=

# Blank = demo config for the local Firebase Auth Emulator
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=

# Connects to the Auth Emulator on 127.0.0.1:9099. Set to "false" with a real Firebase project.
VITE_USE_FIREBASE_EMULATOR=true
```

#### C. Start Frontend Dev Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

### 4. Running the Firebase Auth Emulator (Optional but Recommended)

If you prefer testing authentication without creating a real Google Firebase cloud project:

```bash
# From the repository root
firebase emulators:start --only auth --project demo-digi-closet
```

- Emulator runs on: `http://localhost:9099`
- Emulator UI: `http://localhost:4000` (inspect registered users and tokens)

---

## Quick Reference Summary

| Service | Local URL | Port |
|---------|-----------|------|
| **Frontend Web App** | `http://localhost:5173` | 5173 |
| **Backend REST API** | `http://localhost:5001/api` | 5001 |
| **MongoDB** | `mongodb://127.0.0.1:27017` | 27017 |
| **Firebase Auth Emulator** | `http://localhost:9099` | 9099 |
| **Firebase Emulator UI** | `http://localhost:4000` | 4000 |

---

## Stopping Background Processes

When you are finished developing:

```bash
# Stop MongoDB if started via npm script
cd backend && npm run db:stop
```
