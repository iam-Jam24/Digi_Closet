# DigiCloset — Project Structure

This document provides a comprehensive overview of the DigiCloset repository layout, directory hierarchy, and key file responsibilities.

---

## High-Level Architecture

DigiCloset is architected as a clean client-server monorepo with separated concerns:

```
Digi_Closet/
├── backend/                # Node.js + Express + MongoDB REST API service
├── frontend/               # React 19 + Vite client application
├── docs/                   # Architectural, API, and setup documentation
├── .firebaserc             # Firebase CLI project targeting
├── firebase.json           # Firebase emulators configuration
├── storage.rules           # Cloud Storage security rules for wardrobe images
├── .gitignore              # Repository-wide ignore patterns
└── README.md               # Main project overview and getting started guide
```

---

## Detailed Directory Tree

### 1. Root Directory

| Path | Purpose |
|------|---------|
| `backend/` | Backend application root containing server logic, models, and routes. |
| `frontend/` | Frontend application root containing React components, pages, and styles. |
| `docs/` | In-depth engineering documentation, architecture guides, and API specs. |
| `.firebaserc` | Firebase target project configuration for emulators or cloud deployment. |
| `firebase.json` | Firebase configuration for running the local Auth emulator on port 9099. |
| `storage.rules` | Security rules for Firebase Cloud Storage bucket uploads. |
| `.gitignore` | Excludes `node_modules`, `.env`, local database dumps, temporary files, and OS artifacts. |
| `README.md` | Primary landing documentation for developers, contributors, and maintainers. |

---

### 2. Frontend Directory (`frontend/`)

```
frontend/
├── public/                         # Public static files served verbatim
│   ├── favicon.svg                 # Application favicon
│   └── icons.svg                   # SVG sprite definitions
├── src/
│   ├── components/                 # Reusable UI component library (15 components)
│   │   ├── Avatar.jsx              # User avatar with fallback initials
│   │   ├── Badge.jsx               # Status, tag, and category pill badges
│   │   ├── Button.jsx              # Configurable primary, secondary, outline buttons
│   │   ├── Card.jsx                # Glassmorphic card container with header/body/footer
│   │   ├── ChatBubble.jsx          # Chat message bubble with role styling & timestamps
│   │   ├── ClothingCard.jsx        # Wardrobe item card with quick tags & actions
│   │   ├── ColorSwatch.jsx         # Color swatch indicator with hex tooltip
│   │   ├── ConfirmDialog.jsx       # Modal confirmation for destructive operations
│   │   ├── EmptyState.jsx          # Friendly illustration and action for empty lists
│   │   ├── ErrorMessage.jsx        # Alert banner for runtime error display
│   │   ├── Input.jsx               # Form input with validation state and label
│   │   ├── LoadingSpinner.jsx      # Animated SVG loading spinner with size variants
│   │   ├── Modal.jsx               # Accessible dialog overlay with backdrop blur
│   │   ├── Navbar.jsx              # Top header with user profile menu & quick links
│   │   ├── OutfitCard.jsx          # Outfit recommendation card with item breakdown
│   │   ├── PageHeader.jsx          # Standardized page title, description, and action slot
│   │   ├── Select.jsx              # Dropdown select control
│   │   ├── Sidebar.jsx             # Collapsible side navigation with route badges
│   │   ├── Toast.jsx               # Notification toast system (success, error, info)
│   │   └── UploadDropzone.jsx      # Drag-and-drop file upload with live preview
│   ├── context/
│   │   └── AuthContext.jsx         # Authentication state provider & session sync
│   ├── hooks/                      # Custom React hooks encapsulating data & API logic
│   │   ├── useChat.js              # Conversation state, message sending, streaming
│   │   ├── useOutfits.js           # Outfit recommendation fetch & save actions
│   │   ├── useProducts.js          # Product catalog search, filtering, and favorites
│   │   ├── useProfile.js           # User profile management, export, and account deletion
│   │   ├── useShoppingList.js      # Budget shopping planner and list CRUD
│   │   ├── useTryOn.js             # Photo upload, job polling, and fit analysis
│   │   ├── useWardrobe.js          # Wardrobe item CRUD, category filters, upload
│   │   └── useWeather.js           # Geolocation-based weather and forecast fetching
│   ├── layout/
│   │   ├── AuthLayout.jsx          # Centered card layout for Login and Registration
│   │   └── MainLayout.jsx          # App shell combining Sidebar, Navbar, and content outlet
│   ├── pages/                      # Application route pages
│   │   ├── Chatbot.jsx             # AI fashion styling conversational assistant
│   │   ├── ColorAnalyzer.jsx       # Palette compatibility and color wheel suggestions
│   │   ├── Dashboard.jsx           # Home dashboard with weather widget & wardrobe analytics
│   │   ├── FashionCritic.jsx       # AI evaluation of outfits with score & improvement tips
│   │   ├── Home.jsx                # Public landing page with product introduction
│   │   ├── Login.jsx               # Email/Password and Google OAuth login
│   │   ├── OccasionStyling.jsx     # Event-specific styling (Casual, Formal, Date, Wedding)
│   │   ├── Onboarding.jsx          # 5-step style personality and body profile wizard
│   │   ├── OutfitRecommendations.jsx # Daily and personalized AI outfit builder
│   │   ├── Products.jsx            # Smart product search and discovery catalog
│   │   ├── Profile.jsx             # User measurements, face shape, style preferences
│   │   ├── Register.jsx            # Account creation with validation
│   │   ├── SavedItems.jsx          # Bookmarked outfits, products, and shopping lists
│   │   ├── Settings.jsx            # Account settings, themes, data export, danger zone
│   │   ├── ShoppingAssistant.jsx   # AI-guided budget shopping planner
│   │   └── TryOn.jsx               # Virtual try-on upload with Gemini fit analysis
│   ├── routes/
│   │   ├── AppRoutes.jsx           # Top-level route switchboard using React Router
│   │   └── ProtectedRoute.jsx      # Route guard requiring authenticated Firebase user
│   ├── services/
│   │   └── api.js                  # Axios client configured with `/api` proxy & auth headers
│   ├── styles/                     # Vanilla CSS design system
│   │   ├── tokens.css              # Color palettes, typography, spacing, border radiuses
│   │   ├── base.css                # Box sizing reset, typography defaults, scrollbars
│   │   ├── layout.css              # CSS Grid and Flexbox layouts for sidebar and shell
│   │   ├── pages.css               # Page-specific responsive layouts and widgets
│   │   ├── home.css                # Marketing landing page hero and showcase styles
│   │   └── components/             # Granular styles for buttons, cards, toasts, dialogs
│   ├── App.jsx                     # Root application container with ToastProvider
│   ├── firebase.js                 # Firebase Client SDK initialization
│   ├── index.css                   # Global stylesheet entry point
│   └── main.jsx                    # React 19 DOM bootstrap
├── .env.example                    # Template for frontend environment variables
├── .oxlintrc.json                  # Oxlint configuration for fast JavaScript/JSX linting
├── package.json                    # Dependencies, scripts, and package metadata
└── vite.config.js                  # Vite configuration with `/api` proxy to backend:5001
```

---

### 3. Backend Directory (`backend/`)

```
backend/
├── database/
│   └── seed.js                     # Populates MongoDB with 24 curated fashion catalog items
├── src/
│   ├── config/
│   │   ├── db.js                   # Mongoose connection manager with reconnection logic
│   │   ├── env.js                  # Environment variable schema validation & fallbacks
│   │   └── firebaseAdmin.js        # Firebase Admin SDK init with emulator support
│   ├── controllers/                # Request handlers mapping HTTP to domain services
│   │   ├── authController.js       # User synchronization from Firebase Auth to MongoDB
│   │   ├── chatController.js       # AI chat sessions and wardrobe-aware context injection
│   │   ├── colorAnalyzerController.js # Color harmony calculations and contrast analysis
│   │   ├── fashionCriticController.js # Outfit critique, scoring, and style critique
│   │   ├── occasionStylingController.js # Occasion-based look recommendations
│   │   ├── outfitController.js     # Wardrobe combination generator and saved outfits CRUD
│   │   ├── productController.js    # Catalog search, filtering, and favorites management
│   │   ├── profileController.js    # User profile updates, GDPR data export, account deletion
│   │   ├── shoppingController.js   # Budget breakdown and shopping lists management
│   │   ├── tryOnController.js      # Virtual try-on job submission, polling, fit analysis
│   │   ├── wardrobeController.js   # Clothing items CRUD with image upload & categorization
│   │   └── weatherController.js    # Open-Meteo weather forecast proxy and outfit hints
│   ├── middleware/
│   │   ├── authMiddleware.js       # Verifies Firebase Bearer token and injects `req.user`
│   │   ├── errorMiddleware.js      # Global JSON error handler and 404 interceptor
│   │   ├── rateLimitMiddleware.js  # Request throttling for AI and authentication routes
│   │   ├── uploadMiddleware.js     # Multer multipart upload parser with mime-type checking
│   │   └── validateMiddleware.js   # Input validation and sanitization helpers
│   ├── models/                     # 8 Mongoose Schema models
│   │   ├── ClothingItem.js         # User's uploaded wardrobe piece with tags & category
│   │   ├── Conversation.js         # Chat history with system prompt & message memory
│   │   ├── Product.js              # Curated fashion catalog item for discovery & shopping
│   │   ├── SavedOutfit.js          # Assembled outfit with composed wardrobe items
│   │   ├── SavedProduct.js         # User's bookmarked external catalog product
│   │   ├── ShoppingList.js         # Custom shopping list with budget tracking
│   │   ├── TryOnJob.js             # Try-on request record with fit analysis & status
│   │   └── User.js                 # Core user record with style profile & measurements
│   ├── routes/                     # Express router definitions mounted at `/api/*`
│   │   ├── authRoutes.js           # POST /api/auth/sync, GET /api/auth/me
│   │   ├── chatRoutes.js           # POST /api/chat, GET/DELETE /api/chat/history
│   │   ├── colorAnalyzerRoutes.js  # POST /api/colors/analyze
│   │   ├── fashionCriticRoutes.js  # POST /api/fashion/critique
│   │   ├── occasionStylingRoutes.js# POST /api/styling/recommend
│   │   ├── outfitRoutes.js         # POST /api/outfits/recommend, CRUD /api/outfits/saved
│   │   ├── productRoutes.js        # GET /api/products, POST /api/products/saved
│   │   ├── profileRoutes.js        # GET/PUT /api/profile, POST /export, DELETE /account
│   │   ├── shoppingRoutes.js       # POST /api/shopping/plan, CRUD /api/shopping/lists
│   │   ├── tryOnRoutes.js          # POST /api/try-on/submit, GET /api/try-on/:id
│   │   ├── wardrobeRoutes.js       # CRUD /api/wardrobe with image upload
│   │   ├── weatherRoutes.js        # GET /api/weather/current
│   │   └── index.js                # Master router mounting all sub-routes
│   ├── services/                   # Business logic and external API integrations
│   │   ├── geminiService.js        # Google Gemini AI prompts & robust offline fallbacks
│   │   ├── imageService.js         # Local disk storage & Firebase Cloud Storage adapter
│   │   ├── productSearchService.js # Catalog search and category matching logic
│   │   ├── tryOnService.js         # Try-on queue processor and fit analysis integration
│   │   └── weatherService.js       # Open-Meteo REST API wrapper
│   └── index.js                    # Express application entry point
├── uploads/                        # Local file uploads directory (gitignored)
├── .env.example                    # Environment variable template
└── package.json                    # Backend dependencies and lifecycle scripts
```
