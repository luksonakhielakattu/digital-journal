/**
 * Vercel Serverless Function Handler
 * Routes all API calls through the Express app and ensures active MongoDB connection.
 */
const { app, connectDB } = require('../server');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('[Vercel Serverless] Database connection error:', err);
  }
  return app(req, res);
};
