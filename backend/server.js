'use strict';

// Load environment variables first, before any other imports
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { initializeDatabase } = require('./db');
const { startNewsPoller } = require('./newsPoller');

const authRoutes = require('./routes/authRoutes');
const citizenRoutes = require('./routes/citizenRoutes');
const mpRoutes = require('./routes/mpRoutes');
const newsRoutes = require('./routes/newsRoutes');
const aiRoutes = require('./routes/aiRoutes');
const proposalRoutes = require('./routes/proposalRoutes');

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------
const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

// Body parsers — allow 10mb for potential base64 image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------------------------------------------------------------------------
// Health check (before auth-protected routes)
// ---------------------------------------------------------------------------
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      service: 'peoples-priorities-backend',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: "People's Priorities API is running",
      version: '1.0.0',
      docs: '/health',
    },
  });
});

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/citizen', citizenRoutes);
app.use('/api/mp', mpRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/proposals', proposalRoutes);

// ---------------------------------------------------------------------------
// 404 handler — must come after all valid routes
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ---------------------------------------------------------------------------
// Global error handler — must be last and have exactly 4 arguments
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err.message);
  console.error(err.stack);

  // Handle specific known error types
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Request body too large. Maximum size is 10MB.',
    });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body',
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred'
      : err.message || 'An internal server error occurred';

  return res.status(statusCode).json({
    success: false,
    error: message,
  });
});

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
const PORT = parseInt(process.env.PORT, 10) || 5000;

async function bootstrap() {
  try {
    console.log('[Server] Initializing database...');
    await initializeDatabase();
    console.log('[Server] Database initialized.');
  } catch (err) {
    console.error('[Server] FATAL: Database initialization failed:', err.message);
    process.exit(1);
  }

  // Start news poller non-blocking (failure here must not crash the server)
  try {
    startNewsPoller();
  } catch (err) {
    console.error('[Server] Warning: News poller failed to start:', err.message);
  }

  // Start HTTP server
  const server = app.listen(PORT, () => {
    console.log(`[Server] People's Priorities API listening on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Server] CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      console.error('[Server] Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server] Unhandled Promise Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('[Server] Uncaught Exception:', err.message);
    console.error(err.stack);
    process.exit(1);
  });

  return server;
}

bootstrap();

// Export app for testing
module.exports = app;
