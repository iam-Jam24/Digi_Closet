# DigiCloset

**An AI-powered personal stylist built around the clothes you already own.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-black?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6%2B-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Firebase Auth](https://img.shields.io/badge/Auth-Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

DigiCloset turns your wardrobe into a digital closet. It suggests what to wear, reviews your outfits and helps you shop smarter, all based on your own clothes, your profile and the weather.

---

## Contents

- [Why DigiCloset](#why-digicloset)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Project Layout](#project-layout)
- [Troubleshooting](#troubleshooting)
- [Security & Privacy](#security--privacy)
- [Contributing](#contributing)
- [License](#license)

---

## Why DigiCloset

Most people wear a small part of their wardrobe and still spend every morning deciding what to put on. Generic fashion apps don't help much: they ignore what you own, push new purchases, or give one-size-fits-all advice.

DigiCloset starts from **your real wardrobe**. Add your clothes once, and the AI stylist builds outfits, gives honest feedback and finds gaps worth filling, all tailored to your style, body profile and local weather.

---

## Features

### Your Space
- **My Wardrobe**: upload photos of your clothes and let AI tag the category, colour and style for you.
- **Saved Looks**: keep the outfits, try-ons and products you like in one place.
- **Overview dashboard**: today's weather, quick outfit ideas and wardrobe highlights at a glance.

### AI Studio
- **Outfit Generator**: complete outfits picked from your own wardrobe for any occasion.
- **Virtual Try-On**: see yourself wearing pieces from your wardrobe.
- **Style Makeover**: get a suggested new style and see it on you.
- **Colour Palette**: find the colours that suit you and how well your clothes match them.
- **Fashion Critic**: upload an outfit photo for a rating, feedback and styling tips.
- **AI Stylist chat**: ask fashion questions and get answers that know your wardrobe.

### Discover
- **Weather Looks**: outfit ideas that fit the forecast where you are.
- **Clothes Finder**: describe what you want in plain words and get matching products.
- **Budget Planner**: plan purchases that fill real wardrobe gaps within your budget.
- **Location Finds**: physical clothing stores, boutiques and ethnic-wear shops within 5 km, sorted by speciality (ethnic, bridal, formal, streetwear…), on a map with directions.

### Planning
- **Outfit Calendar**: plan outfits by date and track what you've worn.
- **Wardrobe Insights**: see what you wear most, what you never wear and where the gaps are.

### Account
- Sign in with **email and password**, **Google** or **phone number (OTP)**.
- Guided onboarding to set up your style profile.
- Export your data or delete your account at any time from Settings.

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, Vite 8, React Router 7, Axios, Lucide icons, custom CSS design system |
| **Backend** | Node.js, Express 5, Mongoose |
| **Database** | MongoDB |
| **Authentication** | Firebase Authentication (Firebase Auth Emulator for local development) |
| **AI** | Google Gemini (text, vision and image generation) |
| **Integrations** | Open-Meteo (weather), OpenStreetMap (Overpass, Nominatim, Leaflet map), optional product search provider |
| **Tooling** | Nodemon, Oxlint |

---

## Getting Started

### Prerequisites

- **Node.js** 18 or newer
- **MongoDB** 6 or newer, running locally (or a hosted connection string)
- **Java**, needed by the Firebase Auth Emulator in local development
- **Firebase CLI**: `npm install -g firebase-tools`
- A **Google Gemini API key** from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone and install

```bash
git clone https://github.com/iam-Jam24/Digi_Closet.git
cd Digi_Closet

cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Configure environment variables

Each app ships with a template. Copy it, then fill in your own values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

The comments in each `.env.example` explain every setting. Locally, the defaults work with the Firebase Auth Emulator, so the only value you must add is your Gemini API key.

> **Never commit your `.env` files.** They are already in `.gitignore`.

### 3. Run the app

Use four terminal tabs:

```bash
# 1. Database
cd backend && npm run db:start

# 2. Local authentication emulator
cd backend && npm run auth:start

# 3. API server
cd backend && npm run dev

# 4. Web client
cd frontend && npm run dev
```

Then open **http://localhost:5173** and create an account.

For a detailed walkthrough, see [`docs/setup-guide.md`](docs/setup-guide.md).

---

## Scripts

### Backend (`backend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the API with auto-reload |
| `npm start` | Start the API in production mode |
| `npm run db:start` | Start a local MongoDB instance |
| `npm run db:stop` | Stop the local MongoDB instance |
| `npm run auth:start` | Start the Firebase Auth Emulator (local accounts are kept between restarts) |
| `npm run auth:save` | Save the emulator's local accounts right away |

### Frontend (`frontend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint the code with Oxlint |

---

## Project Layout

```
Digi_Closet/
├── backend/      # Express API: routes, controllers, models, AI and weather services
├── frontend/     # React client: pages, components, hooks, styles
├── docs/         # Setup guide and developer documentation
└── firebase.json # Local emulator configuration
```

More detail is in [`backend/README.md`](backend/README.md), [`frontend/README.md`](frontend/README.md) and the [`docs/`](docs/) folder.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Database connection refused | MongoDB isn't running. Start it with `npm run db:start` in `backend/`. |
| Sign-in fails with a network error | The Auth Emulator isn't running. Start it with `npm run auth:start` in `backend/`. |
| Pages fail to load data | The API server isn't running. Start it with `npm run dev` in `backend/`. |
| AI features say they aren't available | Check the API server log for the reason. Usually `GEMINI_API_KEY` is missing or invalid in `backend/.env`; fix it and restart the API server. |
| AI features say "busy" or "overloaded" | The AI service is under high demand. Wait a moment and try again. |
| Try-On or Makeover says image generation isn't available | On a free Gemini key, images come from free Hugging Face Spaces (`IMAGE_GENERATION_PROVIDERS=gemini,huggingface`). The banner appears when their daily GPU quota is used up or the Spaces are down; the API log says which. Add a free `HF_TOKEN` to `backend/.env` for a larger quota, wait and try later, or enable billing on your Gemini key. |
| Clothes Finder shows no product listings | Live listings need an optional product search key (see `backend/.env.example`). |
| Phone sign-in code doesn't arrive locally | No real SMS is sent in local development. The code appears on the sign-in screen and in the emulator terminal. |

---

## Security & Privacy

- Secrets live only in local `.env` files and are never committed. Use the `.env.example` templates.
- Every private request is authenticated, and each user can only access their own data.
- AI features are rate-limited, and inputs and uploads are validated.
- Users can export or permanently delete their data at any time.

If you find a security issue, please report it privately to the maintainer instead of opening a public issue.

---

## Contributing

1. Fork the repository and create a branch, for example `feature/your-feature` or `fix/your-fix`.
2. Keep changes consistent with the existing code style.
3. Run `npm run lint` in `frontend/` before committing.
4. Use clear commit messages, for example `feat(wardrobe): add tag filter`.
5. Open a pull request against `main`.

---

## License

Released under the [ISC License](https://opensource.org/licenses/ISC).
