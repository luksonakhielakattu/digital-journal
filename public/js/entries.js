/**
 * Digital Journal — Entries List, Filter, Search, and Viewer Logic
 */

let currentPage = 1;
let currentLimit = 12;
let activeFilters = {
  search: '',
  mood: 'All',
  favorite: 'all',
  startDate: '',
  endDate: '',
  tag: '',
  sort: 'newest',
};

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth({ requireAuth: true });
  if (!user) return;

  setupFilterListeners();
  loadEntries();

  // Check if deep-linked to view a specific entry: entries.html?view=XYZ
  const urlParams = new URLSearchParams(window.location.search);
  const viewId = urlParams.get('view');
  if (viewId) {
    viewEntryDetails(viewId);
  }
});

/**
 * Setup search input debouncing and filter triggers
 */
function setupFilterListeners() {
  const searchInput = document.getElementById('searchInput');
  const moodFilter = document.getElementById('moodFilter');
  const favoriteFilter = document.getElementById('favoriteFilter');
  const sortFilter = document.getElementById('sortFilter');
  const startDateInput = document.getElementById('startDateFilter');
  const endDateInput = document.getElementById('endDateFilter');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');

  let debounceTimer = null;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        activeFilters.search = searchInput.value.trim();
        currentPage = 1;
        loadEntries();
      }, 350);
    });
  }

  if (moodFilter) {
    moodFilter.addEventListener('change', () => {
      activeFilters.mood = moodFilter.value;
      currentPage = 1;
      loadEntries();
    });
  }

  if (favoriteFilter) {
    favoriteFilter.addEventListener('change', () => {
      activeFilters.favorite = favoriteFilter.value;
      currentPage = 1;
      loadEntries();
    });
  }

  if (sortFilter) {
    sortFilter.addEventListener('change', () => {
      activeFilters.sort = sortFilter.value;
      currentPage = 1;
      loadEntries();
    });
  }

  if (startDateInput) {
    startDateInput.addEventListener('change', () => {
      activeFilters.startDate = startDateInput.value;
      currentPage = 1;
      loadEntries();
    });
  }

  if (endDateInput) {
    endDateInput.addEventListener('change', () => {
      activeFilters.endDate = endDateInput.value;
      currentPage = 1;
      loadEntries();
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (moodFilter) moodFilter.value = 'All';
      if (favoriteFilter) favoriteFilter.value = 'all';
      if (sortFilter) sortFilter.value = 'newest';
      if (startDateInput) startDateInput.value = '';
      if (endDateInput) endDateInput.value = '';

      activeFilters = {
        search: '',
        mood: 'All',
        favorite: 'all',
        startDate: '',
        endDate: '',
        tag: '',
        sort: 'newest',
      };
      currentPage = 1;
      loadEntries();
    });
  }
}

/**
 * Filter by clicked tag
 */
window.filterByTag = function (tag) {
  activeFilters.tag = tag;
  currentPage = 1;
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = `tag:${tag}`;
  loadEntries();
};

/**
 * Fetch entries with applied query filters
 */
async function loadEntries() {
  const container = document.getElementById('entriesContainer');
  const countBadge = document.getElementById('entriesCountBadge');
  const paginationContainer = document.getElementById('paginationContainer');

  if (!container) return;

  container.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-lavender" role="status">
        <span class="visually-hidden">Loading entries...</span>
      </div>
      <p class="text-muted mt-2">Loading journal entries...</p>
    </div>
  `;

  try {
    const params = new URLSearchParams();
    if (activeFilters.search) params.append('search', activeFilters.search);
    if (activeFilters.mood && activeFilters.mood !== 'All') params.append('mood', activeFilters.mood);
    if (activeFilters.favorite === 'true') params.append('favorite', 'true');
    if (activeFilters.favorite === 'false') params.append('favorite', 'false');
    if (activeFilters.tag) params.append('tag', activeFilters.tag);
    if (activeFilters.startDate) params.append('startDate', activeFilters.startDate);
    if (activeFilters.endDate) params.append('endDate', activeFilters.endDate);
    if (activeFilters.sort) params.append('sort', activeFilters.sort);
    params.append('page', currentPage);
    params.append('limit', currentLimit);

    const res = await fetch(`/api/journal?${params.toString()}`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Error retrieving entries');
    }

    if (countBadge) {
      countBadge.textContent = `${data.total} ${data.total === 1 ? 'entry' : 'entries'}`;
    }

    if (data.entries.length === 0) {
      container.innerHTML = `
        <div class="col-12">
          <div class="empty-state">
            <div class="empty-state-icon">
              <i class="bi bi-search"></i>
            </div>
            <h5 class="empty-state-title">No Entries Found</h5>
            <p class="empty-state-desc">We couldn't find any reflections matching your current search or filters.</p>
            <button class="btn btn-outline-custom me-2" id="clearFilterEmptyBtn">Clear Filters</button>
            <a href="editor.html" class="btn btn-lavender">
              <i class="bi bi-pencil-square me-1"></i> New Entry
            </a>
          </div>
        </div>
      `;
      const clearBtn = document.getElementById('clearFilterEmptyBtn');
      if (clearBtn) {
        clearBtn.onclick = () => {
          document.getElementById('resetFiltersBtn')?.click();
        };
      }
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    // Render cards
    let html = '';
    data.entries.forEach((entry) => {
      const tagsHtml = (entry.tags || [])
        .map(
          (t) =>
            `<span class="tag-badge" style="cursor:pointer;" onclick="filterByTag('${escapeAttr(t)}')">#${escapeHtml(t)}</span>`
        )
        .join('');

      html += `
        <div class="col-md-6 col-xl-4">
          <div class="entry-card" id="card-${entry._id}">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="entry-date">${formatDate(entry.date)}</span>
              <div class="d-flex align-items-center gap-1">
                ${getMoodBadge(entry.mood)}
                <button class="favorite-star-btn ${entry.isFavorite ? 'active' : ''}" 
                  onclick="toggleFavoriteInline('${entry._id}', this)"
                  title="${entry.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}">
                  <i class="bi ${entry.isFavorite ? 'bi-star-fill text-warning' : 'bi-star'}"></i>
                </button>
              </div>
            </div>

            <h5 class="entry-title">${escapeHtml(entry.title)}</h5>
            <p class="entry-preview">${escapeHtml(entry.content)}</p>

            <div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top">
              <div class="d-flex flex-wrap flex-grow-1 me-2">${tagsHtml}</div>
              <span class="text-muted" style="font-size: 0.76rem; white-space: nowrap;">${entry.wordCount || 0} words</span>
            </div>

            <div class="d-flex justify-content-end gap-2 mt-3 pt-2">
              <button class="btn btn-sm btn-lavender-subtle" onclick="viewEntryDetails('${entry._id}')">
                <i class="bi bi-eye"></i> View
              </button>
              <a href="editor.html?id=${entry._id}" class="btn btn-sm btn-outline-custom">
                <i class="bi bi-pencil"></i> Edit
              </a>
              <button class="btn btn-sm btn-outline-danger" onclick="triggerDelete('${entry._id}', '${escapeAttr(entry.title)}')">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    renderPagination(data.currentPage, data.totalPages);
  } catch (err) {
    console.error('Entries loading error:', err);
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle-fill me-2"></i> Failed to load journal entries. Please ensure the database is connected.
        </div>
      </div>
    `;
  }
}

/**
 * Toggle favorite status directly from the card
 */
window.toggleFavoriteInline = async function (id, btn) {
  try {
    const res = await fetch(`/api/journal/${id}/favorite`, { method: 'PATCH' });
    const data = await res.json();
    if (res.ok && data.success) {
      if (data.isFavorite) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="bi bi-star-fill text-warning"></i>';
        showToast('Entry marked as favorite.');
      } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i class="bi bi-star"></i>';
        showToast('Entry removed from favorites.');
      }
    }
  } catch (err) {
    console.error('Favorite toggle failed:', err);
    showToast('Could not update favorite status.', 'error');
  }
};

/**
 * Open Full Entry Viewer Modal
 */
window.viewEntryDetails = async function (id) {
  const modalEl = document.getElementById('viewEntryModal');
  if (!modalEl) return;

  const modal = new bootstrap.Modal(modalEl);

  const titleEl = document.getElementById('modalEntryTitle');
  const dateEl = document.getElementById('modalEntryDate');
  const moodEl = document.getElementById('modalEntryMood');
  const contentEl = document.getElementById('modalEntryContent');
  const tagsEl = document.getElementById('modalEntryTags');
  const wordCountEl = document.getElementById('modalEntryWordCount');
  const editLink = document.getElementById('modalEditLink');

  titleEl.textContent = 'Loading reflection...';
  contentEl.textContent = '';
  modal.show();

  try {
    const res = await fetch(`/api/journal/${id}`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      showToast('Entry could not be loaded.', 'error');
      modal.hide();
      return;
    }

    const entry = data.entry;
    titleEl.textContent = entry.title;
    dateEl.textContent = formatDate(entry.date);
    moodEl.innerHTML = getMoodBadge(entry.mood);
    contentEl.innerHTML = escapeHtml(entry.content).replace(/\n/g, '<br>');
    wordCountEl.textContent = `${entry.wordCount || 0} words`;

    if (entry.tags && entry.tags.length > 0) {
      tagsEl.innerHTML = entry.tags
        .map((t) => `<span class="tag-badge">#${escapeHtml(t)}</span>`)
        .join(' ');
    } else {
      tagsEl.innerHTML = '<span class="text-muted" style="font-size:0.8rem;">No tags</span>';
    }

    if (editLink) {
      editLink.href = `editor.html?id=${entry._id}`;
    }
  } catch (err) {
    console.error('View modal load error:', err);
    showToast('Failed to load entry details.', 'error');
  }
};

/**
 * Trigger delete confirmation modal
 */
window.triggerDelete = function (id, title) {
  const modalEl = document.getElementById('deleteConfirmModal');
  if (!modalEl) return;

  const modal = new bootstrap.Modal(modalEl);
  const titlePreview = document.getElementById('deleteEntryTitlePreview');
  const confirmBtn = document.getElementById('confirmDeleteBtn');

  if (titlePreview) titlePreview.textContent = title;

  confirmBtn.onclick = async () => {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Deleting...';

    try {
      const res = await fetch(`/api/journal/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        modal.hide();
        showToast('Journal entry deleted.');
        loadEntries();
      } else {
        showToast(data.message || 'Delete failed.', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Error deleting entry.', 'error');
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = 'Delete Entry';
    }
  };

  modal.show();
};

/**
 * Render pagination controls
 */
function renderPagination(current, total) {
  const container = document.getElementById('paginationContainer');
  if (!container) return;

  if (total <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '<ul class="pagination pagination-sm mb-0 justify-content-center">';

  // Prev
  html += `
    <li class="page-item ${current === 1 ? 'disabled' : ''}">
      <button class="page-link" onclick="goToPage(${current - 1})" aria-label="Previous">&laquo;</button>
    </li>
  `;

  for (let i = 1; i <= total; i++) {
    html += `
      <li class="page-item ${i === current ? 'active' : ''}">
        <button class="page-link" onclick="goToPage(${i})">${i}</button>
      </li>
    `;
  }

  // Next
  html += `
    <li class="page-item ${current === total ? 'disabled' : ''}">
      <button class="page-link" onclick="goToPage(${current + 1})" aria-label="Next">&raquo;</button>
    </li>
  `;

  html += '</ul>';
  container.innerHTML = html;
}

window.goToPage = function (page) {
  currentPage = page;
  loadEntries();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  if (!str) return '';
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
