/**
 * Vercel Serverless Function Handler
 * Seamlessly delegates all /api requests to the Express application in server.js,
 * normalizing route paths across Vercel serverless proxy environments.
 */
const app = require('../server');

module.exports = (req, res) => {
  // If Vercel proxy stripped the /api prefix, restore it so Express route handlers match
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  return app(req, res);
};
