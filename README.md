# DigiCloset — AI-Powered Personal Fashion Assistant

[![GitHub Repository](https://img.shields.io/badge/GitHub-iam--Jam24%2FDigi__Closet-blue?logo=github)](https://github.com/iam-Jam24/Digi_Closet.git)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-5.x-black?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0%2B-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.0%20Flash-4285F4?logo=google)](https://ai.google.dev/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

> **DigiCloset** is an intelligent personal styling companion and digital wardrobe manager. It bridges the gap between what you own and what you wear, harnessing multimodal AI to curate daily outfits, critique style choices, analyze color palettes, and optimize shopping decisions based on your real wardrobe and personal body profile.

---

## Table of Contents

- [Project Title & Introduction](#project-title--introduction)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Available Scripts](#available-scripts)
- [API Documentation Overview](#api-documentation-overview)
- [Troubleshooting Guide](#troubleshooting-guide)
- [GitHub Contribution Guide](#github-contribution-guide)
- [Security & Privacy](#security--privacy)
- [Roadmap](#roadmap)
- [License](#license)

---

## Project Title & Introduction

### The Problem
Most people wear only 20% of the clothing in their wardrobe, suffering from "closet paralysis" — spending valuable time every morning wondering what to wear. Traditional fashion apps either require tedious manual logging, push aggressive fast-fashion advertising, or offer generic advice that ignores what you actually own, your body type, and local weather conditions.

### The Solution
**DigiCloset** digitizes your existing closet in minutes and acts as a 24/7 private stylist in your pocket. Using **Google Gemini AI**, DigiCloset understands your clothing items visually, cross-references local weather forecasts, honors your personalized style and fit metrics, and delivers context-aware, cohesive outfit combinations directly from your closet.

### Target Audience
- **Busy Professionals & Students:** Looking to streamline their morning routine and look sharp effortlessly.
- **Conscious Consumers & Minimalists:** Striving to build a versatile capsule wardrobe and minimize impulse shopping.
- **Fashion Explorers:** Eager to discover fresh color harmonies, try new aesthetics, and receive constructive styling feedback.

---

## Technology Stack

### Frontend Client
- **Core:** [React 19](https://react.dev/) + [Vite 8](https://vite.dev/) (lightning-fast HMR)
- **Routing:** [React Router v7](https://reactrouter.com/) (declarative routing with protected route guards)
- **Styling:** Bespoke **Vanilla CSS** design system (tokens, glassmorphism, responsive grid layouts — no Tailwind dependency)
- **Authentication:** [Firebase JS SDK v13](https://firebase.google.com/) (Email/Password & Google Sign-In)
- **API Client:** [Axios](https://axios-http.com/) (configured with Bearer token interceptor and `/api` proxy)
- **Icons:** [Lucide React](https://lucide.dev/) (consistent modern icons)
- **Code Quality:** [Oxlint](https://oxc.rs/) (high-speed JavaScript/JSX linting)

### Backend Service
- **Runtime:** [Node.js](https://nodejs.org/) (`v18+` or `v20+`)
- **Server Framework:** [Express.js v5](https://expressjs.com/)
- **Database & ODM:** [MongoDB](https://www.mongodb.com/) with [Mongoose v9](https://mongoosejs.com/)
- **Authentication Verification:** [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) (token validation & emulator support)
- **Artificial Intelligence:** [Google Gemini API](https://ai.google.dev/) (`gemini-2.0-flash`) with transparent offline fallbacks
- **Weather Service:** [Open-Meteo API](https://open-meteo.com/) (zero-config, keyless weather data)
- **File Uploads:** [Multer](https://github.com/expressjs/multer) (multipart form data with MIME validation)
- **Rate Limiting:** [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)

---

## Project Structure

```
Digi_Closet/
├── backend/
│   ├── database/
│   │   └── seed.js             # Seeds initial catalog with 24 curated fashion items
│   ├── src/
│   │   ├── config/             # Database connection, env loader, Firebase Admin init
│   │   ├── controllers/        # 12 Express controllers for each functional domain
│   │   ├── middleware/         # Auth verification, file upload, error handling, rate limiting
│   │   ├── models/             # 8 Mongoose schemas (User, ClothingItem, SavedOutfit, etc.)
│   │   ├── routes/             # 12 Modular route definitions mounted under /api
│   │   ├── services/           # Gemini AI, weather, image storage, try-on services
│   │   └── index.js            # Express app initialization and HTTP listener
│   ├── uploads/                # Local uploads directory (auto-created in dev, gitignored)
│   ├── .env.example            # Backend environment template
│   ├── package.json            # Backend scripts and dependencies
│   └── README.md               # Backend-specific architecture guide
├── frontend/
│   ├── public/                 # Static assets (favicons, SVG sprites)
│   ├── src/
│   │   ├── components/         # 15 reusable UI components (Buttons, Modals, Cards, Toasts)
│   │   ├── context/            # AuthContext (Firebase auth lifecycle)
│   │   ├── hooks/              # 8 custom hooks (useWardrobe, useOutfits, useChat, etc.)
│   │   ├── layout/             # MainLayout (Sidebar + Navbar) and AuthLayout
│   │   ├── pages/              # 15 React route pages (Dashboard, Wardrobe, Critic, etc.)
│   │   ├── routes/             # AppRoutes and ProtectedRoute authentication guard
│   │   ├── services/           # Axios instance with auth interceptor
│   │   ├── styles/             # Modular CSS architecture (tokens, base, layout, pages)
│   │   ├── App.jsx             # Top-level application shell with ToastProvider
│   │   ├── firebase.js         # Firebase Client SDK initialization
│   │   ├── index.css           # Global stylesheet entry point
│   │   └── main.jsx            # DOM entry point
│   ├── .env.example            # Frontend environment template
│   ├── .oxlintrc.json          # Oxlint linter configuration
│   ├── package.json            # Frontend scripts and dependencies
│   ├── vite.config.js          # Vite config with reverse proxy to backend
│   └── README.md               # Frontend-specific development guide
├── docs/
│   ├── api-reference.md        # Complete endpoint documentation with request/response specs
│   ├── project-structure.md    # Detailed codebase anatomy and file hierarchy
│   └── setup-guide.md          # Step-by-step local development setup tutorial
├── .firebaserc                 # Firebase CLI configuration
├── firebase.json               # Firebase Emulator Suite configuration
├── storage.rules               # Cloud Storage security rules
├── .gitignore                  # Global Git ignore rules
└── README.md                   # Main project documentation (this file)
```

---

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/iam-Jam24/Digi_Closet.git
cd Digi_Closet
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### 3. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

## Running the Application

Follow these steps across separate terminal tabs to run DigiCloset locally:

### Step 1: Start MongoDB
```bash
cd backend
npm run db:start
```
*(Starts a local MongoDB instance isolated to `~/.digi-closet/mongodb-data`)*

### Step 2: Seed Catalog Products (First Time Only)
```bash
cd backend
npm run seed
```

### Step 3: Start the Backend Server
```bash
cd backend
npm run dev
```
*(Runs backend at `http://localhost:5001` with nodemon auto-reload)*

### Step 4: Start the Frontend Client
```bash
cd frontend
npm run dev
```
*(Runs Vite client at `http://localhost:5173`)*

### Step 5: (Optional) Start Firebase Auth Emulator
If you wish to test signups locally without connecting to Google Cloud:
```bash
firebase emulators:start --only auth --project demo-digi-closet
```

Now open **`http://localhost:5173`** in your browser to begin exploring DigiCloset!

---

## Available Scripts

### Backend Scripts (`backend/package.json`)
| Command | Action |
|---------|--------|
| `npm run dev` | Runs the Express API with `nodemon` for instant hot-reload on file edits. |
| `npm start` | Launches the server in standard production mode using `node src/index.js`. |
| `npm run seed` | Populates the MongoDB database with 24 fashion products for testing. |
| `npm run db:start` | Launches a background `mongod` daemon pointing to local storage directory. |
| `npm run db:stop` | Gracefully shuts down the background `mongod` instance. |

### Frontend Scripts (`frontend/package.json`)
| Command | Action |
|---------|--------|
| `npm run dev` | Launches the Vite development server with Hot Module Replacement on port `5173`. |
| `npm run build` | Compiles and optimizes React code into the production `dist/` bundle. |
| `npm run preview` | Spins up a local static server to test the production build before deployment. |
| `npm run lint` | Analyzes code with `oxlint` for high-speed syntax and style checks. |

---

## API Documentation Overview

The DigiCloset backend exposes 12 domain route modules. Detailed request and response examples can be found in [`docs/api-reference.md`](docs/api-reference.md).

| Base Route | Methods | Authentication | Description |
|------------|:-------:|:--------------:|-------------|
| `/api/auth` | `GET`, `POST` | Required | Synchronize Firebase credentials with MongoDB; fetch current user profile. |
| `/api/profile` | `GET`, `PUT`, `POST`, `DELETE` | Required | Manage measurements & preferences; export personal data (GDPR); delete account. |
| `/api/wardrobe` | `GET`, `POST`, `PUT`, `DELETE` | Required | CRUD wardrobe garments with image upload, categories, tags, and colors. |
| `/api/outfits` | `GET`, `POST`, `DELETE` | Required | Generate AI outfit recommendations; bookmark and manage saved outfits. |
| `/api/fashion` | `POST` | Required | AI Fashion Critic: rate outfits (0-10), analyze silhouette, provide tips. |
| `/api/colors` | `POST` | Required | Color Analyzer: evaluate primary and secondary color harmony. |
| `/api/styling` | `POST` | Required | Occasion-based styling suggestions (Weddings, Date Night, Casual, etc.). |
| `/api/products`| `GET`, `POST` | Optional / Required | Search curated fashion items; filter by category and price; bookmark favorites. |
| `/api/shopping`| `GET`, `POST`, `PUT`, `DELETE` | Required | AI budget shopping planner; manage custom shopping lists and costs. |
| `/api/try-on`  | `POST`, `GET` | Required | Submit photo for try-on; fetch job status with Gemini Fit & Silhouette analysis. |
| `/api/chat`    | `POST`, `DELETE` | Required | AI conversational assistant with context injection from user's wardrobe. |
| `/api/weather` | `GET` | Public | Real-time weather proxy using Open-Meteo API. |

---

## Troubleshooting Guide

### 1. "MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017"
- **Cause:** MongoDB is not running on your machine.
- **Solution:** Run `npm run db:start` inside the `backend/` directory, or verify that your system MongoDB service is active.

### 2. "Firebase: Error (auth/network-request-failed)"
- **Cause:** The client is trying to reach the Firebase Auth Emulator, but the emulator is not running.
- **Solution:** Either run `firebase emulators:start --only auth --project demo-digi-closet` in your terminal, or configure real Firebase credentials in `frontend/.env` and remove `VITE_FIREBASE_AUTH_EMULATOR_HOST`.

### 3. "AI features return offline fallback results"
- **Cause:** `GEMINI_API_KEY` is not provided in `backend/.env`.
- **Solution:** This is intentional designed behavior! DigiCloset falls back to deterministic rule-based algorithms so the app remains fully functional without an API key. To enable live Gemini AI, generate a key at [Google AI Studio](https://aistudio.google.com/) and paste it into `backend/.env`.

### 4. "Vite: Failed to load /api/wardrobe (500 Internal Server Error)"
- **Cause:** The backend server is not running on port 5001.
- **Solution:** Ensure `npm run dev` is running inside the `backend/` directory.

### 5. "Image upload fails or broken image links"
- **Cause:** In local development, uploaded images are saved to `backend/uploads/` and served statically.
- **Solution:** Verify `backend/uploads/` exists and is writable. For production, supply `FIREBASE_STORAGE_BUCKET` in your `.env`.

---

## GitHub Contribution Guide

Contributions are welcome! Please follow these standards:

### 1. Branch Naming Conventions
- `feature/feature-name` — for new capabilities (e.g., `feature/color-filter`)
- `fix/bug-description` — for defect resolutions (e.g., `fix/token-expiry-handling`)
- `docs/doc-update` — for documentation improvements
- `refactor/scope` — for code cleanliness without behavioral change

### 2. Development Workflow
1. Fork the repository and clone your fork.
2. Create a descriptive branch: `git checkout -b feature/my-new-feature`.
3. Make your changes adhering to existing architectural standards.
4. Run the linter: `cd frontend && npm run lint`.
5. Commit your changes with clear, semantic commit messages:
   ```bash
   git commit -m "feat(wardrobe): add multi-tag search filter"
   ```
6. Push to your branch and open a Pull Request against `main`.

---

## Security & Privacy

- **Never Commit Secrets:** Real API keys, database credentials, and service account keys are excluded via `.gitignore`. Always use `.env.example` as a template.
- **Bearer Token Verification:** All private API endpoints verify the caller's Firebase ID token via the Firebase Admin SDK on every request.
- **Rate Limiting:** AI endpoints and authentication routes are guarded with `express-rate-limit` to prevent brute-force attacks and API quota exhaustion.
- **Data Protection & GDPR:** Users can export all personal data (profile, wardrobe, outfits, lists) in machine-readable JSON or permanently delete their account and all associated data via the `/api/profile` endpoints.

---

## Roadmap

### Phase 1: Core Foundation (Completed ✅)
- [x] Full Digital Wardrobe management with multi-criteria filtering
- [x] Multimodal AI Outfit Recommendations with weather integration
- [x] AI Fashion Critic with numerical scores and actionable styling advice
- [x] Color Harmony Analyzer with interactive color wheel suggestions
- [x] Occasion Styling generator for 6 core social scenarios
- [x] Budget Shopping Assistant with saved shopping lists
- [x] AI Fashion Chatbot with wardrobe context awareness
- [x] 5-step Style Profile Onboarding & user measurement tracking
- [x] GDPR data export and account self-deletion

### Phase 2: Enhanced Integrations (In Progress 🔄)
- [ ] Connect live affiliate shopping APIs (ASOS, Amazon, Uniqlo) to replace dev catalog
- [ ] Full 3D neural garment warping for Virtual Try-On via external diffusion model provider
- [ ] Automated background removal for uploaded wardrobe photos using Canvas / WASM

### Phase 3: Mobile & Social (Planned 🗺️)
- [ ] React Native / Expo mobile app companion
- [ ] Closet sharing with friends and collaborative outfit curation
- [ ] Laundry and dry-cleaning wear-frequency tracker

---

## License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC) — see the package configuration files for full details.

---

<p align="center">
  Crafted with care for fashion enthusiasts and clean-code advocates.
</p>
