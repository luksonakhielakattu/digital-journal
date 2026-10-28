const test = require('node:test');
const assert = require('node:assert/strict');
const { app, request, setupTestDB, cleanTestDB, teardownTestDB } = require('./testHelper');

let statsUser = null;

test.before(async () => {
  await setupTestDB();
  await cleanTestDB();

  statsUser = request.agent(app);
  await statsUser.post('/api/auth/register').send({
    name: 'Stats Student',
    email: 'stats@journal.test',
    password: 'password123',
  });

  // Seed 3 entries with known moods, dates, and favorites
  await statsUser.post('/api/journal').send({
    title: 'Happy Day',
    content: 'Feeling great today with my project.',
    mood: 'Happy',
    date: new Date().toISOString(),
    isFavorite: true,
  });

  await statsUser.post('/api/journal').send({
    title: 'Another Happy Moment',
    content: 'Had a wonderful lunch with friends.',
    mood: 'Happy',
    date: new Date().toISOString(),
    isFavorite: true,
  });

  await statsUser.post('/api/journal').send({
    title: 'Calm Evening',
    content: 'Reading by candlelight before sleeping.',
    mood: 'Calm',
    date: new Date().toISOString(),
    isFavorite: false,
  });
});

test.after(async () => {
  await teardownTestDB();
});

test.describe('Dashboard Dynamic Statistics Suite', () => {
  test('GET /api/dashboard/stats returns dynamic database counts and mood breakdown', async () => {
    const res = await statsUser.get('/api/dashboard/stats');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    const stats = res.body.stats;
    assert.equal(stats.totalEntries, 3);
    assert.equal(stats.todayEntriesCount, 3);
    assert.equal(stats.favoritesCount, 2);
    assert.equal(stats.dominantMood, 'Happy');

    // Mood distribution verification
    assert.equal(stats.moodDistribution['Happy'], 2);
    assert.equal(stats.moodDistribution['Calm'], 1);
    assert.equal(stats.moodDistribution['Excited'], 0);
    assert.equal(stats.moodDistribution['Sad'], 0);

    // Percentage verification
    assert.equal(stats.moodPercentages['Happy'], 67);
    assert.equal(stats.moodPercentages['Calm'], 33);

    // Recent entries array verification
    assert.equal(res.body.recentEntries.length, 3);
    assert.equal(res.body.recentFavorites.length, 2);
  });
});
