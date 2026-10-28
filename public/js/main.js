/**
 * Digital Journal — Common Client Utilities
 * Handles session verification, toast alerts, sidebar toggles, and formatting
 */

const MOOD_EMOJIS = {
  Happy: '😊',
  Calm: '🌿',
  Excited: '⚡',
  Sad: '🌧️',
  Stressed: '🌪️',
  Grateful: '🌸',
};

// Global container for authenticated user
window.currentUser = null;

/**
 * Display a modern toast notification
 * @param {string} message - Notification text
 * @param {'success'|'error'|'info'|'warning'} type - Visual styling type
 */
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container-custom';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast-custom';

  let icon = 'bi-check-circle-fill text-success';
  if (type === 'error') icon = 'bi-exclamation-triangle-fill text-danger';
  if (type === 'warning') icon = 'bi-exclamation-circle-fill text-warning';
  if (type === 'info') icon = 'bi-info-circle-fill text-primary';

  toast.innerHTML = `
    <i class="bi ${icon} fs-5"></i>
    <div class="flex-grow-1" style="font-size: 0.88rem; font-weight: 500;">${message}</div>
    <button type="button" class="btn-close btn-close-sm ms-2" aria-label="Close"></button>
  `;

  const closeBtn = toast.querySelector('.btn-close');
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });

  container.appendChild(toast);

  // Auto dismiss after 4 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

/**
 * Verify authentication state against API
 * @param {Object} options
 * @param {boolean} options.requireAuth - If true, redirects unauthenticated user to login.html
 * @param {boolean} options.redirectIfAuth - If true, redirects logged-in user to dashboard.html
 */
async function checkAuth(options = {}) {
  const { requireAuth = false, redirectIfAuth = false } = options;

  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      window.currentUser = data.user;

      // Update sidebar if user info elements exist
      updateSidebarUserInfo(data.user);

      if (redirectIfAuth) {
        window.location.href = 'dashboard.html';
        return;
      }
      return data.user;
    } else {
      window.currentUser = null;
      if (requireAuth) {
        window.location.href = 'login.html';
        return null;
      }
    }
  } catch (err) {
    console.error('Session check failed:', err);
    if (requireAuth) {
      window.location.href = 'login.html';
    }
  }
  return null;
}

/**
 * Populate sidebar user name and avatar
 */
function updateSidebarUserInfo(user) {
  if (!user) return;

  const nameEl = document.getElementById('sidebarUserName');
  const emailEl = document.getElementById('sidebarUserEmail');
  const avatarEl = document.getElementById('sidebarUserAvatar');

  if (nameEl) {
    if (user.role === 'admin' || user.email === 'admin@journal.com') {
      nameEl.innerHTML = `${user.name} <span class="badge" style="font-size:0.62rem; background:var(--lavender-600); color:#fff; vertical-align:middle;">ADMIN</span>`;
    } else {
      nameEl.textContent = user.name;
    }
  }
  if (emailEl) emailEl.textContent = user.email;
  if (avatarEl) {
    const initials = user.name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    avatarEl.textContent = initials || 'U';
  }
}

/**
 * Log out active user and redirect to login
 */
async function handleLogout() {
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Logged out successfully.');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 500);
    }
  } catch (err) {
    console.error('Logout error:', err);
    window.location.href = 'login.html';
  }
}

/**
 * Format date string into human friendly format
 */
function formatDate(dateString, style = 'medium') {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;

  if (style === 'short') {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Return HTML badge markup for mood
 */
function getMoodBadge(mood) {
  const emoji = MOOD_EMOJIS[mood] || '✨';
  const moodClass = mood ? mood.toLowerCase() : 'calm';
  return `<span class="mood-badge mood-${moodClass}">${emoji} ${mood || 'Calm'}</span>`;
}

// Mobile sidebar drawer toggling
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('mobileSidebarToggle');
  const sidebar = document.querySelector('.app-sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');

  if (toggleBtn && sidebar && backdrop) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('show');
      backdrop.classList.toggle('show');
    });

    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('show');
      backdrop.classList.remove('show');
    });
  }

  // Bind logout buttons
  document.querySelectorAll('[data-action="logout"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  });
});
