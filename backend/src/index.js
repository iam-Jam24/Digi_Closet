const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./config/env');
const connectDB = require('./config/db');
const routes = require('./routes');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Hosts like Render sit behind one proxy; trust it so rate limits see each
// user's real IP instead of the proxy's.
if (env.NODE_ENV === 'production') app.set('trust proxy', 1);

// Database
connectDB();

// Middleware
// CLIENT_URL (comma-separated) limits which sites may call the API.
// Unset allows any origin, which is fine for local development.
app.use(cors(env.CLIENT_URLS.length ? { origin: env.CLIENT_URLS } : undefined));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Express 5 leaves req.body undefined when a request has no body.
app.use((req, res, next) => {
  req.body ??= {};
  next();
});

// Local dev image storage (used only when no cloud storage is configured)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Digi Closet API',
    version: '1.0.0',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found.`,
  });
});

// Centralized error handler
app.use(errorHandler);

// Start server
const server = app.listen(env.PORT, () => {
  console.log(`\n  🚀 Digi Closet API running on http://localhost:${env.PORT}`);
  console.log(`  📦 Environment: ${env.NODE_ENV}\n`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

module.exports = app;
