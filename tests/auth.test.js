const test = require('node:test');
const assert = require('node:assert/strict');
const { app, request, setupTestDB, cleanTestDB, teardownTestDB } = require('./testHelper');

test.before(async () => {
  await setupTestDB();
  await cleanTestDB();
});

test.after(async () => {
  await teardownTestDB();
});

test.describe('Authentication & Security API Suite', () => {
  test('POST /api/auth/register should fail when required fields are invalid or missing', async () => {
    // 1. Missing name
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({ name: '', email: 'test@example.com', password: 'password123' });
    assert.equal(res1.status, 400);
    assert.equal(res1.body.success, false);

    // 2. Invalid email format
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Valid Name', email: 'not-an-email', password: 'password123' });
    assert.equal(res2.status, 400);
    assert.equal(res2.body.success, false);

    // 3. Password too short (< 6 chars)
    const res3 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Valid Name', email: 'test@example.com', password: '123' });
    assert.equal(res3.status, 400);
    assert.equal(res3.body.success, false);
  });

  test('POST /api/auth/register should successfully create a new user and assign session', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Cooper',
        email: 'alice@journal.test',
        password: 'securePassword123',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.name, 'Alice Cooper');
    assert.equal(res.body.user.email, 'alice@journal.test');
    assert.equal(res.body.user.password, undefined); // Password must NEVER be exposed
  });

  test('POST /api/auth/register should reject duplicate email registration with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Duplicate',
        email: 'alice@journal.test',
        password: 'anotherPassword123',
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /already exists/i);
  });

  test('POST /api/auth/login should fail with invalid credentials', async () => {
    // Wrong password
    const res1 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@journal.test', password: 'wrongPassword' });
    assert.equal(res1.status, 401);
    assert.equal(res1.body.success, false);

    // Non-existent email
    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unknown@journal.test', password: 'securePassword123' });
    assert.equal(res2.status, 401);
    assert.equal(res2.body.success, false);
  });

  test('POST /api/auth/login should succeed with valid credentials and establish session', async () => {
    const agent = request.agent(app);

    const loginRes = await agent
      .post('/api/auth/login')
      .send({ email: 'alice@journal.test', password: 'securePassword123' });

    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.body.success, true);
    assert.equal(loginRes.body.user.email, 'alice@journal.test');

    // Verify GET /api/auth/me works on this session
    const meRes = await agent.get('/api/auth/me');
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.success, true);
    assert.equal(meRes.body.user.email, 'alice@journal.test');

    // Test POST /api/auth/logout
    const logoutRes = await agent.post('/api/auth/logout');
    assert.equal(logoutRes.status, 200);
    assert.equal(logoutRes.body.success, true);

    // Post-logout: session must be invalidated
    const postLogoutMe = await agent.get('/api/auth/me');
    assert.equal(postLogoutMe.status, 401);
  });

  test('Unauthorized requests to protected endpoints should be rejected with 401', async () => {
    // Unauthenticated GET /api/journal
    const res1 = await request(app).get('/api/journal');
    assert.equal(res1.status, 401);

    // Unauthenticated GET /api/dashboard/stats
    const res2 = await request(app).get('/api/dashboard/stats');
    assert.equal(res2.status, 401);

    // Unauthenticated GET /api/profile
    const res3 = await request(app).get('/api/profile');
    assert.equal(res3.status, 401);
  });
});
