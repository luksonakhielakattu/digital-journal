/**
 * Digital Journal — Dashboard Logic
 * Loads dynamic database statistics, mood breakdown, and recent entries
 */

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth({ requireAuth: true });
  if (!user) return;

  setupGreeting(user.name);
  loadDashboardData();

  if (user.role === 'admin' || user.email === 'admin@journal.com') {
    loadAdminData();
  }
});

/**
 * Configure dynamic greeting based on local time
 */
function setupGreeting(userName) {
  const greetingEl = document.getElementById('userGreeting');
  const quoteEl = document.getElementById('mindfulQuote');

  const hour = new Date().getHours();
  let timeOfDay = 'day';
  if (hour < 12) timeOfDay = 'morning';
  else if (hour < 17) timeOfDay = 'afternoon';
  else timeOfDay = 'evening';

  if (greetingEl) {
    greetingEl.textContent = `Good ${timeOfDay}, ${userName.split(' ')[0]}!`;
  }

  const quotes = [
    '"Journaling is like whispering to oneself and listening at the same time." — Mina Murray',
    '"Fill your paper with the breathings of your heart." — William Wordsworth',
    '"In the journal I do not just express myself more openly than I could to any person; I create myself." — Susan Sontag',
    '"Documenting little details of your everyday life becomes a celebration of who you are." — Carolyn V. Hamilton',
  ];

  if (quoteEl) {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteEl.textContent = randomQuote;
  }
}

/**
 * Fetch and render authenticated user statistics from MongoDB
 */
async function loadDashboardData() {
  const loadingOverlay = document.getElementById('dashboardLoading');
  const contentArea = document.getElementById('dashboardContent');

  try {
    const res = await fetch('/api/dashboard/stats');
    if (!res.ok) throw new Error('Failed to fetch dashboard data');

    const data = await res.json();
    const { stats, recentEntries, recentFavorites } = data;

    // Render Stat Counters
    document.getElementById('totalEntriesCount').textContent = stats.totalEntries;
    document.getElementById('todayEntriesCount').textContent = stats.todayEntriesCount;
    document.getElementById('favoritesCount').textContent = stats.favoritesCount;
    document.getElementById('totalWordsCount').textContent = stats.totalWords.toLocaleString();

    // Render Mood Summary
    renderMoodBreakdown(stats);

    // Render Recent Entries
    renderRecentEntries(recentEntries);

    // Render Recent Favorites
    renderRecentFavorites(recentFavorites);

    if (loadingOverlay) loadingOverlay.classList.add('d-none');
    if (contentArea) contentArea.classList.remove('d-none');
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
    showToast('Failed to load live statistics. Please refresh.', 'error');
  }
}

/**
 * Render visual mood distribution bars and percentages
 */
function renderMoodBreakdown(stats) {
  const container = document.getElementById('moodBreakdownContainer');
  const dominantMoodEl = document.getElementById('dominantMoodBadge');

  if (dominantMoodEl) {
    if (stats.dominantMood && stats.dominantMood !== 'None') {
      dominantMoodEl.innerHTML = `Most Frequent: ${getMoodBadge(stats.dominantMood)}`;
    } else {
      dominantMoodEl.innerHTML = `<span class="badge bg-light text-muted">No entries yet</span>`;
    }
  }

  if (!container) return;

  const moods = [
    { name: 'Happy', emoji: '😊', colorClass: 'bg-mood-happy' },
    { name: 'Calm', emoji: '🌿', colorClass: 'bg-mood-calm' },
    { name: 'Excited', emoji: '⚡', colorClass: 'bg-mood-excited' },
    { name: 'Sad', emoji: '🌧️', colorClass: 'bg-mood-sad' },
    { name: 'Stressed', emoji: '🌪️', colorClass: 'bg-mood-stressed' },
    { name: 'Grateful', emoji: '🌸', colorClass: 'bg-mood-grateful' },
  ];

  let html = '';
  moods.forEach((m) => {
    const count = stats.moodDistribution[m.name] || 0;
    const pct = stats.moodPercentages[m.name] || 0;

    html += `
      <div class="mb-3">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="d-flex align-items-center gap-2" style="font-size: 0.88rem; font-weight: 600;">
            <span>${m.emoji}</span>
            <span>${m.name}</span>
          </span>
          <span class="text-muted" style="font-size: 0.82rem;">${count} entries (${pct}%)</span>
        </div>
        <div class="progress" style="height: 7px; background-color: var(--bg-surface-subtle); border-radius: 4px;">
          <div class="progress-bar ${m.colorClass}" role="progressbar" style="width: ${pct}%;" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Render recent journal entries list
 */
function renderRecentEntries(entries) {
  const listContainer = document.getElementById('recentEntriesList');
  if (!listContainer) return;

  if (!entries || entries.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state py-4">
        <div class="empty-state-icon">
          <i class="bi bi-journal-plus"></i>
        </div>
        <h5 class="empty-state-title">No Journal Entries Yet</h5>
        <p class="empty-state-desc">Your personal space is ready. Pen your very first reflection today to track your thoughts and mood.</p>
        <a href="editor.html" class="btn btn-lavender">
          <i class="bi bi-pencil-square me-1"></i> Write First Entry
        </a>
      </div>
    `;
    return;
  }

  let html = '<div class="row g-3">';
  entries.forEach((entry) => {
    const tagsHtml = (entry.tags || [])
      .slice(0, 3)
      .map((t) => `<span class="tag-badge">#${t}</span>`)
      .join('');

    html += `
      <div class="col-md-6 col-xl-12">
        <div class="entry-card">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="entry-date">${formatDate(entry.date)}</span>
            ${getMoodBadge(entry.mood)}
          </div>
          <h5 class="entry-title">${escapeHtml(entry.title)}</h5>
          <p class="entry-preview">${escapeHtml(entry.content)}</p>
          <div class="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
            <div class="d-flex flex-wrap">${tagsHtml}</div>
            <div class="d-flex gap-2">
              <a href="editor.html?id=${entry._id}" class="btn btn-sm btn-outline-custom" title="Edit Entry">
                <i class="bi bi-pencil"></i> Edit
              </a>
              <a href="entries.html?view=${entry._id}" class="btn btn-sm btn-lavender-subtle" title="Read Entry">
                <i class="bi bi-eye"></i> View
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';

  listContainer.innerHTML = html;
}

/**
 * Render recent favorite entries list
 */
function renderRecentFavorites(favorites) {
  const favContainer = document.getElementById('favoritesList');
  if (!favContainer) return;

  if (!favorites || favorites.length === 0) {
    favContainer.innerHTML = `
      <div class="text-center py-4 text-muted">
        <i class="bi bi-star fs-3 d-block mb-2 text-subtle"></i>
        <p class="mb-0" style="font-size: 0.88rem;">No starred entries yet.<br>Click the star icon on any entry to pin it here.</p>
      </div>
    `;
    return;
  }

  let html = '<div class="d-flex flex-column gap-2">';
  favorites.forEach((entry) => {
    html += `
      <a href="entries.html?view=${entry._id}" class="p-3 card-custom text-decoration-none d-flex justify-content-between align-items-center" style="border-radius: var(--radius-sm);">
        <div>
          <div class="fw-semibold text-main mb-1" style="font-size: 0.93rem;">${escapeHtml(entry.title)}</div>
          <div class="text-muted" style="font-size: 0.8rem;">${formatDate(entry.date)} &bull; ${entry.mood}</div>
        </div>
        <i class="bi bi-star-fill text-warning fs-5"></i>
      </a>
    `;
  });
  html += '</div>';

  favContainer.innerHTML = html;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Fetch and render all registered users for administrators
 */
async function loadAdminData() {
  const adminPanel = document.getElementById('adminPanelSection');
  const tbody = document.getElementById('adminUsersTableBody');
  const totalBadge = document.getElementById('adminTotalUsersBadge');

  if (!adminPanel) return;
  adminPanel.classList.remove('d-none');

  try {
    const res = await fetch('/api/admin/users');
    if (!res.ok) return;

    const data = await res.json();
    if (!data.success) return;

    if (totalBadge) {
      totalBadge.textContent = `${data.totalUsers} registered users • ${data.totalSystemEntries} system reflections`;
    }

    if (tbody && data.users) {
      tbody.innerHTML = data.users
        .map((u) => {
          const initials =
            u.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase() || 'U';

          const roleBadge =
            u.role === 'admin'
              ? '<span class="badge border" style="background:#faeefa; color:#8c2494;">Admin</span>'
              : '<span class="badge bg-light text-muted border">User</span>';

          const latest = u.latestEntry
            ? `<span class="fw-medium">${escapeHtml(u.latestEntry.title)}</span> <small class="text-muted">(${u.latestEntry.mood})</small>`
            : '<span class="text-muted fst-italic">No reflections yet</span>';

          return `
            <tr>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="user-avatar" style="width:32px; height:32px; font-size:0.8rem;">${initials}</div>
                  <span class="fw-semibold">${escapeHtml(u.name)}</span>
                </div>
              </td>
              <td><code>${escapeHtml(u.email)}</code></td>
              <td>${roleBadge}</td>
              <td><span class="badge bg-light text-dark border px-2 py-1">${u.entryCount} reflections</span></td>
              <td>${latest}</td>
              <td class="text-muted small">${formatDate(u.createdAt)}</td>
            </tr>
          `;
        })
        .join('');
    }
  } catch (err) {
    console.error('Failed to load admin user data:', err);
  }
}
