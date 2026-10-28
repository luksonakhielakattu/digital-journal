/**
 * Digital Journal — Journal Editor Logic (Create & Edit CRUD)
 */

let currentEntryId = null;
let isFavoriteState = false;
let selectedMood = 'Calm';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth({ requireAuth: true });
  if (!user) return;

  // Initialize date input to today if creating new
  const dateInput = document.getElementById('entryDate');
  if (dateInput && !dateInput.value) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }

  // Check URL params for edit mode
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');

  // Setup mood pill selector
  setupMoodSelector();

  // Setup live character & word counting
  setupCounters();

  // Setup favorite toggle
  setupFavoriteToggle();

  // Setup form submission
  setupFormSubmit();

  if (editId) {
    currentEntryId = editId;
    loadEntryForEditing(editId);
  }
});

/**
 * Configure mood pill button click behavior
 */
function setupMoodSelector() {
  const pills = document.querySelectorAll('.mood-option-pill');
  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      selectedMood = pill.getAttribute('data-mood');
    });
  });
}

/**
 * Set active mood programmatically
 */
function setMood(mood) {
  selectedMood = mood;
  const pills = document.querySelectorAll('.mood-option-pill');
  pills.forEach((pill) => {
    if (pill.getAttribute('data-mood') === mood) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
}

/**
 * Configure live typing metrics (word count, character count, read time)
 */
function setupCounters() {
  const contentArea = document.getElementById('entryContent');
  const wordCountEl = document.getElementById('liveWordCount');
  const charCountEl = document.getElementById('liveCharCount');
  const readTimeEl = document.getElementById('liveReadTime');
  const titleInput = document.getElementById('entryTitle');
  const titleCharCountEl = document.getElementById('titleCharCount');

  if (contentArea) {
    contentArea.addEventListener('input', () => {
      const text = contentArea.value.trim();
      const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
      const chars = contentArea.value.length;
      const readMinutes = Math.max(1, Math.ceil(words / 200));

      if (wordCountEl) wordCountEl.textContent = `${words} word${words === 1 ? '' : 's'}`;
      if (charCountEl) charCountEl.textContent = `${chars} characters`;
      if (readTimeEl) readTimeEl.textContent = words > 0 ? `~${readMinutes} min read` : '0 min';
    });
  }

  if (titleInput && titleCharCountEl) {
    titleInput.addEventListener('input', () => {
      titleCharCountEl.textContent = `${titleInput.value.length}/120`;
    });
  }
}

/**
 * Setup star favorite toggle
 */
function setupFavoriteToggle() {
  const favBtn = document.getElementById('favoriteToggleBtn');
  if (!favBtn) return;

  favBtn.addEventListener('click', () => {
    isFavoriteState = !isFavoriteState;
    updateFavoriteBtnUI();
  });
}

function updateFavoriteBtnUI() {
  const favBtn = document.getElementById('favoriteToggleBtn');
  if (!favBtn) return;

  if (isFavoriteState) {
    favBtn.classList.add('active');
    favBtn.innerHTML = '<i class="bi bi-star-fill text-warning me-1"></i> Starred';
  } else {
    favBtn.classList.remove('active');
    favBtn.innerHTML = '<i class="bi bi-star me-1"></i> Add to Favorites';
  }
}

/**
 * Fetch existing entry and populate fields in Edit Mode
 */
async function loadEntryForEditing(id) {
  const pageTitle = document.getElementById('editorPageTitle');
  const breadcrumb = document.getElementById('editorBreadcrumb');
  const deleteBtn = document.getElementById('deleteEntryBtn');

  if (pageTitle) pageTitle.textContent = 'Edit Journal Entry';
  if (breadcrumb) breadcrumb.textContent = 'Edit Entry';
  if (deleteBtn) {
    deleteBtn.classList.remove('d-none');
    deleteBtn.addEventListener('click', () => confirmDelete(id));
  }

  try {
    const res = await fetch(`/api/journal/${id}`);
    if (!res.ok) {
      if (res.status === 404) {
        showToast('Entry not found or already deleted.', 'error');
      } else if (res.status === 403) {
        showToast('You do not have permission to edit this entry.', 'error');
      }
      setTimeout(() => {
        window.location.href = 'entries.html';
      }, 1500);
      return;
    }

    const data = await res.json();
    const entry = data.entry;

    document.getElementById('entryTitle').value = entry.title || '';
    document.getElementById('entryContent').value = entry.content || '';

    if (entry.date) {
      document.getElementById('entryDate').value = new Date(entry.date)
        .toISOString()
        .split('T')[0];
    }

    setMood(entry.mood || 'Calm');

    if (entry.tags && Array.isArray(entry.tags)) {
      document.getElementById('entryTags').value = entry.tags.join(', ');
    }

    isFavoriteState = Boolean(entry.isFavorite);
    updateFavoriteBtnUI();

    // Trigger counters
    document.getElementById('entryContent').dispatchEvent(new Event('input'));
    document.getElementById('entryTitle').dispatchEvent(new Event('input'));
  } catch (err) {
    console.error('Failed to load entry:', err);
    showToast('Could not load entry for editing.', 'error');
  }
}

/**
 * Handle form submission (Create or Update)
 */
function setupFormSubmit() {
  const form = document.getElementById('journalEntryForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('entryTitle').value.trim();
    const content = document.getElementById('entryContent').value.trim();
    const date = document.getElementById('entryDate').value;
    const tagsRaw = document.getElementById('entryTags').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!title) {
      showToast('Please provide an entry title.', 'warning');
      document.getElementById('entryTitle').focus();
      return;
    }

    if (!content) {
      showToast('Please write your journal entry content.', 'warning');
      document.getElementById('entryContent').focus();
      return;
    }

    const payload = {
      title,
      content,
      date: date || new Date().toISOString(),
      mood: selectedMood,
      tags: tagsRaw,
      isFavorite: isFavoriteState,
    };

    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2"></span>
      Saving Entry...
    `;

    try {
      const isEdit = Boolean(currentEntryId);
      const url = isEdit ? `/api/journal/${currentEntryId}` : '/api/journal';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast(isEdit ? 'Entry updated successfully!' : 'Entry published to your journal!');
        setTimeout(() => {
          window.location.href = 'entries.html';
        }, 700);
      } else {
        showToast(data.message || 'Failed to save entry.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    } catch (err) {
      console.error('Error saving entry:', err);
      showToast('Network error while saving journal entry.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

/**
 * Delete confirmation modal handler
 */
function confirmDelete(id) {
  const deleteModalEl = document.getElementById('deleteConfirmModal');
  if (!deleteModalEl) return;

  const modal = new bootstrap.Modal(deleteModalEl);
  const confirmBtn = document.getElementById('confirmDeleteBtn');

  confirmBtn.onclick = async () => {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Deleting...';

    try {
      const res = await fetch(`/api/journal/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        modal.hide();
        showToast('Journal entry deleted permanently.');
        setTimeout(() => {
          window.location.href = 'entries.html';
        }, 600);
      } else {
        showToast(data.message || 'Could not delete entry.', 'error');
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = 'Delete Entry';
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Network error during deletion.', 'error');
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = 'Delete Entry';
    }
  };

  modal.show();
}
