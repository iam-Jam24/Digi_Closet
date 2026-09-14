# ✨ Digi Closet

> **Your Personal AI-Powered Fashion Companion**

A scalable full-stack fashion platform built with React, Express.js, and PostgreSQL. Designed to evolve into a comprehensive AI-powered fashion assistant with virtual try-on, style DNA profiling, and intelligent outfit recommendations.

---

## 📋 Project Status

### ✅ Currently Implemented (Phase 1)

| Feature | Description |
|---------|-------------|
| **Authentication** | Register, login, logout with JWT + bcrypt |
| **Dashboard** | Personalized greeting, stats, quick actions |
| **User Profile** | Style preferences, colors, occasions, budget |
| **Digital Wardrobe** | Add, view, filter, delete clothing items |
| **Product Catalog** | 24 seeded products with filters (category, style, color, price) |
| **Design System** | 13+ reusable UI components |
| **Responsive Design** | Desktop, tablet, and mobile support |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React, Vite, JavaScript, Tailwind CSS, React Router v6, Axios, Lucide React |
| **Backend** | Node.js, Express.js, REST API |
| **Database** | PostgreSQL, Prisma ORM |
| **Authentication** | JWT, bcrypt |
| **AI (Future)** | Gemini API (service abstraction ready) |

---

## 🏗️ Architecture

```
digi-closet/
├── frontend/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # AuthContext provider
│   │   ├── hooks/             # Custom hooks (useProfile, useWardrobe, useProducts)
│   │   ├── layout/            # AuthLayout, MainLayout
│   │   ├── pages/             # Home, Login, Register, Dashboard, Profile, Wardrobe, Products, ComingSoon
│   │   ├── routes/            # AppRoutes, ProtectedRoute
│   │   ├── services/          # API service (Axios)
│   │   └── index.css          # Design system + Tailwind
│   └── vite.config.js
│
├── backend/                   # Node.js + Express backend
│   ├── database/
│   │   └── prisma/
│   │       ├── schema.prisma  # Database schema
│   │       └── seed.js        # Seed data (24 products)
│   └── src/
│       ├── config/            # db.js, env.js
│       ├── controllers/       # auth, profile, wardrobe, product
│       ├── middleware/        # authMiddleware, errorMiddleware, validateMiddleware
│       ├── routes/            # authRoutes, profileRoutes, wardrobeRoutes, productRoutes
│       └── services/          # AI service abstractions
│
├── .env.example               # Environment variable template
├── .gitignore
└── README.md
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** (v18+)
- **PostgreSQL** (running locally)
- **npm**

### 1. Set up the backend

```bash
cd backend
npm install
```

### 2. Configure environment

Create `backend/.env`:

```env
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/digi_closet?schema=public"
JWT_SECRET="your-secret-key"
GEMINI_API_KEY=""
PORT=5001
NODE_ENV=development
```

### 3. Run Prisma migrations & seed

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Start backend server

```bash
cd backend
npm run dev
# Server running on http://localhost:5001
```

### 5. Set up and start frontend

```bash
cd frontend
npm install
npm run dev
# App running on http://localhost:5173
```
