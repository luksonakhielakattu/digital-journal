const test = require('node:test');
const assert = require('node:assert/strict');
const { app, request, setupTestDB, cleanTestDB, teardownTestDB } = require('./testHelper');

let userA = null;
let userB = null;
let entryAId = null;

test.before(async () => {
  await setupTestDB();
  await cleanTestDB();

  // Create User A agent
  userA = request.agent(app);
  await userA.post('/api/auth/register').send({
    name: 'User A',
    email: 'userA@journal.test',
    password: 'password123',
  });

  // Create User B agent
  userB = request.agent(app);
  await userB.post('/api/auth/register').send({
    name: 'User B',
    email: 'userB@journal.test',
    password: 'password123',
  });
});

test.after(async () => {
  await teardownTestDB();
});

test.describe('Journal Entry CRUD & Ownership Authorization Suite', () => {
  test('POST /api/journal should reject blank title or content', async () => {
    // Blank title
    const res1 = await userA.post('/api/journal').send({
      title: '   ',
      content: 'Valid content here',
      mood: 'Calm',
    });
    assert.equal(res1.status, 400);
    assert.equal(res1.body.success, false);

    // Blank content
    const res2 = await userA.post('/api/journal').send({
      title: 'Valid Title',
      content: '   ',
      mood: 'Calm',
    });
    assert.equal(res2.status, 400);
    assert.equal(res2.body.success, false);
  });

  test('POST /api/journal should successfully create entry with tags, mood, and favorite', async () => {
    const res = await userA.post('/api/journal').send({
      title: 'First Morning Reflection',
      content: 'Woke up early to watch the sunrise and read my favorite book.',
      date: new Date().toISOString(),
      mood: 'Calm',
      tags: ['sunrise', 'morning', 'books'],
      isFavorite: true,
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.entry.title, 'First Morning Reflection');
    assert.equal(res.body.entry.mood, 'Calm');
    assert.equal(res.body.entry.isFavorite, true);
    assert.equal(res.body.entry.wordCount, 12);
    assert.deepEqual(res.body.entry.tags, ['sunrise', 'morning', 'books']);

    entryAId = res.body.entry._id;
  });

  test('GET /api/journal should retrieve user entries and calculate word count', async () => {
    // Add another entry for User A
    await userA.post('/api/journal').send({
      title: 'Coding Marathon Day',
      content: 'Spent 5 hours learning Express and MongoDB for my university Web Technology IA3 evaluation.',
      mood: 'Excited',
      tags: ['coding', 'college'],
      isFavorite: false,
    });

    const res = await userA.get('/api/journal');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.total, 2);
    assert.equal(res.body.entries.length, 2);
  });

  test('GET /api/journal?search=... should filter entries by keyword in title/content', async () => {
    const res = await userA.get('/api/journal?search=sunrise');
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 1);
    assert.equal(res.body.entries[0].title, 'First Morning Reflection');
  });

  test('GET /api/journal?mood=... should filter entries by mood', async () => {
    const res = await userA.get('/api/journal?mood=Excited');
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 1);
    assert.equal(res.body.entries[0].title, 'Coding Marathon Day');
  });

  test('GET /api/journal/:id should return full entry for owner', async () => {
    const res = await userA.get(`/api/journal/${entryAId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.entry.title, 'First Morning Reflection');
  });

  test('PUT /api/journal/:id should update an existing entry', async () => {
    const res = await userA.put(`/api/journal/${entryAId}`).send({
      title: 'Updated Morning Reflection',
      mood: 'Grateful',
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.entry.title, 'Updated Morning Reflection');
    assert.equal(res.body.entry.mood, 'Grateful');
  });

  test('SECURITY: User B should NOT be able to view, update, or delete User A entry', async () => {
    // User B tries to view User A's entry
    const viewRes = await userB.get(`/api/journal/${entryAId}`);
    assert.equal(viewRes.status, 403);
    assert.equal(viewRes.body.success, false);

    // User B tries to update User A's entry
    const updateRes = await userB.put(`/api/journal/${entryAId}`).send({
      title: 'Hacked Title',
    });
    assert.equal(updateRes.status, 403);
    assert.equal(updateRes.body.success, false);

    // User B tries to delete User A's entry
    const deleteRes = await userB.delete(`/api/journal/${entryAId}`);
    assert.equal(deleteRes.status, 403);
    assert.equal(deleteRes.body.success, false);
  });

  test('DELETE /api/journal/:id should delete entry when requested by owner', async () => {
    const res = await userA.delete(`/api/journal/${entryAId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Confirm entry no longer exists
    const checkRes = await userA.get(`/api/journal/${entryAId}`);
    assert.equal(checkRes.status, 404);
  });
});
