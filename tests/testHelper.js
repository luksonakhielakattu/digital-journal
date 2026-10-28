process.env.NODE_ENV = 'test';
process.env.MONGODB_URI =
  process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/digital_journal_test';
process.env.DB_NAME = 'digital_journal_test';
process.env.SESSION_SECRET = 'test_session_secret_for_automated_testing_12345';

const request = require('supertest');
const { app, connectDB, mongoose, sessionStore } = require('../server');

const TEST_MONGODB_URI = process.env.MONGODB_URI;

async function setupTestDB() {
  if (mongoose.connection.readyState !== 1) {
    await connectDB(TEST_MONGODB_URI);
  }
}

async function cleanTestDB() {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}

async function teardownTestDB() {
  try {
    if (sessionStore && typeof sessionStore.close === 'function') {
      await sessionStore.close();
    }
  } catch (e) {
    // ignore
  }
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (e) {
    // ignore
  }
}

module.exports = {
  app,
  request,
  setupTestDB,
  cleanTestDB,
  teardownTestDB,
  TEST_MONGODB_URI,
};
