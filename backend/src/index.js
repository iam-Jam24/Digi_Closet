const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
