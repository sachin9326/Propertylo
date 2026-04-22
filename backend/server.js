const express = require('express');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const aiRoutes = require('./routes/aiRoutes');
const visitRoutes = require('./routes/visitRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

// Enable gzip/brotli compression for all responses — HUGE speed boost
app.use(compression({ level: 6, threshold: 1024 }));

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Allow if no origin (like mobile apps or curl) or if it's from localhost / allowed list
    if (!origin || origin.includes('localhost') || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      console.log('CORS Blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Health Check for Render keep-alive
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Root route for backend
app.get('/', (req, res) => {
  res.status(200).json({
    message: "Propertylo Backend is running",
    version: "1.0.0",
    docs: "Please use /api/auth or other /api routes"
  });
});

// Request logging with timing for performance tracking
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 500) {
      console.log(`⚠️ SLOW ${req.method} ${req.url} — ${duration}ms`);
    } else {
      console.log(`${req.method} ${req.url} — ${duration}ms`);
    }
  });
  next();
});
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/reviews', reviewRoutes);

// Express 5 error handler - must have exactly 4 parameters
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Warm up the database connection pool on startup
  // This eliminates the Neon cold-start penalty on the first user request
  try {
    const prisma = require('./db');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection warmed up');
  } catch (e) {
    console.warn('⚠️ DB warm-up failed (will retry on first request):', e.message);
  }

  // ============================================================
  // KEEP-ALIVE: Prevent Render free-tier cold starts
  // Render spins down after 15 min of inactivity → 30s+ cold start
  // This self-ping every 14 min keeps the server alive
  // ============================================================
  const KEEP_ALIVE_INTERVAL = 14 * 60 * 1000; // 14 minutes
  setInterval(async () => {
    try {
      const http = require('http');
      const url = `http://localhost:${PORT}/api/health`;
      http.get(url, (res) => {
        console.log(`🏓 Keep-alive ping: ${res.statusCode}`);
      }).on('error', () => {});
    } catch (e) {}
  }, KEEP_ALIVE_INTERVAL);
  console.log('🏓 Keep-alive pinger started (every 14 min)');
});
