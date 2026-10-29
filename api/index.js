/**
 * Vercel Serverless Function Handler
 * Seamlessly delegates all requests to the Express application in server.js
 */
const app = require('../server');

module.exports = app;
