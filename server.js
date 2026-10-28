require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

// Route handlers
const authRoutes = require('./routes/authRoutes');
const journalRoutes = require('./routes/journalRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
// Enable trust proxy for serverless reverse proxies (Vercel, Render)
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/digital_journal';
const DB_NAME = process.env.DB_NAME || 'digital_journal';
const SESSION_SECRET =
  process.env.SESSION_SECRET || 'digital_journal_fallback_dev_secret_key_2026';

// Helper to mask credentials in MongoDB URI for safe logging
function maskMongoUri(uri) {
  if (!uri) return '';
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
}

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Track database connection state
let isDbConnected = false;

// Attach connection event listeners
mongoose.connection.on('disconnected', () => {
  isDbConnected = false;
  console.warn('[Database] MongoDB connection lost/disconnected.');
});

mongoose.connection.on('error', (err) => {
  isDbConnected = false;
  console.error('[Database] MongoDB runtime error:', err.message);
});

async function connectDB(customUri) {
  if (mongoose.connection.readyState === 1) {
    isDbConnected = true;
    return;
  }
  const uri = customUri || MONGODB_URI;
  try {
    await mongoose.connect(uri, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 5000,
    });
    isDbConnected = true;
    console.log(`[Database] MongoDB connected successfully to database: '${DB_NAME}' at ${maskMongoUri(uri)}`);
  } catch (err) {
    isDbConnected = false;
    console.error('[Database] MongoDB connection error:', err.message);
    console.error('[Database] Connection Troubleshooting:');
    console.error('  - If using MongoDB Atlas, check your Network Access (IP Whitelist).');
    console.error('  - Verify your database credentials in .env (special characters in password must be URL-encoded).');
    console.error('  - Ensure your MONGODB_URI format is valid: mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority');
  }
}

// Session store configuration
const sessionStore = MongoStore.create({
  mongoUrl: MONGODB_URI,
  dbName: DB_NAME,
  collectionName: 'sessions',
  ttl: 14 * 24 * 60 * 60, // 14 days
  autoRemove: 'native',
});

sessionStore.on('error', (err) => {
  console.error('[Session Store] MongoStore Error:', err.message);
});

// Configure Express Sessions
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    name: 'journal.sid',
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

// Dedicated Database Health Check Endpoint (STEP 4)
app.get('/api/health/db', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'error',
        database: 'unavailable',
        message: 'Database is not connected',
      });
    }

    // Ping the active MongoDB database to confirm connectivity
    await mongoose.connection.db.admin().ping();

    res.status(200).json({
      status: 'ok',
      database: 'connected',
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      database: 'unavailable',
      message: 'Database health check failed',
    });
  }
});

// General server health check endpoint
app.get('/api/health', (req, res) => {
  const stateMap = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = stateMap[mongoose.connection.readyState] || 'unknown';
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    database: state,
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler for undefined API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error('[Global Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
  });
});

// Start listening if run directly
let serverInstance = null;
if (require.main === module) {
  connectDB().then(() => {
    serverInstance = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` Digital Journal Web Application is running!`);
      console.log(` URL: http://localhost:${PORT}`);
      console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`====================================================`);
    });

    serverInstance.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n[Server Error] Port ${PORT} is already in use by another process.`);
        console.error(`To fix this, close the application currently using port ${PORT}, or change PORT in your .env file.\n`);
      } else {
        console.error('[Server Error]', err);
      }
      process.exit(1);
    });
  });
}

module.exports = { app, connectDB, mongoose, sessionStore };
