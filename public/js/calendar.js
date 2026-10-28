/**
 * Digital Journal — Interactive Calendar History View
 */

let calendarDate = new Date(); // Current viewing month/year
let calendarEntries = []; // Fetched entries for active view

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth({ requireAuth: true });
  if (!user) return;

  setupCalendarNavigation();
  loadCalendarData();
});

function setupCalendarNavigation() {
  const prevBtn = document.getElementById('prevMonthBtn');
  const nextBtn = document.getElementById('nextMonthBtn');
  const todayBtn = document.getElementById('todayBtn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      calendarDate.setMonth(calendarDate.getMonth() - 1);
      loadCalendarData();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      calendarDate.setMonth(calendarDate.getMonth() + 1);
      loadCalendarData();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      calendarDate = new Date();
      loadCalendarData();
    });
  }
}

async function loadCalendarData() {
  const monthTitle = document.getElementById('calendarMonthTitle');
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth() + 1; // 1-indexed

  if (monthTitle) {
    monthTitle.textContent = `${MONTH_NAMES[calendarDate.getMonth()]} ${year}`;
  }

  try {
    const res = await fetch(`/api/journal/calendar?year=${year}&month=${month}`);
    const data = await res.json();
    if (res.ok && data.success) {
      calendarEntries = data.entries || [];
      renderCalendarGrid(year, calendarDate.getMonth(), calendarEntries);
    }
  } catch (err) {
    console.error('Failed to load calendar data:', err);
    showToast('Failed to load calendar entries.', 'error');
  }
}

function renderCalendarGrid(year, monthIndex, entries) {
  const gridContainer = document.getElementById('calendarDaysGrid');
  if (!gridContainer) return;

  gridContainer.innerHTML = '';

  const firstDay = new Date(year, monthIndex, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, monthIndex, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthIndex;

  // Map entries by date key: "YYYY-MM-DD"
  const entriesByDate = {};
  entries.forEach((e) => {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!entriesByDate[key]) entriesByDate[key] = [];
    entriesByDate[key].push(e);
  });

  // 1. Prev month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const cell = document.createElement('div');
    cell.className = 'calendar-cell other-month';
    cell.innerHTML = `<span class="calendar-date-number text-muted">${dayNum}</span>`;
    gridContainer.appendChild(cell);
  }

  // 2. Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    const isToday = isCurrentMonth && today.getDate() === d;
    cell.className = `calendar-cell ${isToday ? 'today' : ''}`;

    const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEntries = entriesByDate[dateKey] || [];

    let entriesHtml = '';
    if (dayEntries.length > 0) {
      entriesHtml += '<div class="calendar-entries-container">';
      dayEntries.slice(0, 2).forEach((e) => {
        const moodClass = e.mood ? e.mood.toLowerCase() : 'calm';
        entriesHtml += `
          <div class="calendar-entry-pill mood-badge mood-${moodClass}">
            ${escapeHtml(e.title)}
          </div>
        `;
      });
      if (dayEntries.length > 2) {
        entriesHtml += `
          <span class="text-muted" style="font-size: 0.7rem; font-weight: 600;">
            +${dayEntries.length - 2} more
          </span>
        `;
      }
      entriesHtml += '</div>';
    }

    cell.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <span class="calendar-date-number ${isToday ? 'text-primary' : ''}">${d}</span>
        ${dayEntries.length > 0 ? `<span class="badge rounded-pill bg-light text-dark" style="font-size:0.68rem;">${dayEntries.length}</span>` : ''}
      </div>
      ${entriesHtml}
    `;

    cell.addEventListener('click', () => {
      openDayDetailsModal(dateKey, dayEntries);
    });

    gridContainer.appendChild(cell);
  }

  // 3. Next month leading days to complete row grid (total cells multiple of 7)
  const totalCellsSoFar = firstDay + daysInMonth;
  const remainingCells = (7 - (totalCellsSoFar % 7)) % 7;
  for (let nextDay = 1; nextDay <= remainingCells; nextDay++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell other-month';
    cell.innerHTML = `<span class="calendar-date-number text-muted">${nextDay}</span>`;
    gridContainer.appendChild(cell);
  }
}

/**
 * Open day inspection modal displaying all entries written on that day
 */
function openDayDetailsModal(dateKey, entries) {
  const modalEl = document.getElementById('calendarDayModal');
  if (!modalEl) return;

  const modal = new bootstrap.Modal(modalEl);
  const modalDateTitle = document.getElementById('modalCalendarDayTitle');
  const modalList = document.getElementById('modalCalendarEntriesList');
  const addEntryBtn = document.getElementById('modalAddEntryForDateBtn');

  const formattedDay = new Date(dateKey + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (modalDateTitle) modalDateTitle.textContent = formattedDay;
  if (addEntryBtn) {
    addEntryBtn.href = `editor.html?date=${dateKey}`;
  }

  if (entries.length === 0) {
    modalList.innerHTML = `
      <div class="text-center py-4 text-muted">
        <i class="bi bi-calendar-x fs-2 d-block mb-2"></i>
        <p class="mb-3">No reflections recorded on this date.</p>
        <a href="editor.html?date=${dateKey}" class="btn btn-sm btn-lavender">
          <i class="bi bi-pencil me-1"></i> Write Entry for this Day
        </a>
      </div>
    `;
  } else {
    let html = '<div class="d-flex flex-column gap-3">';
    entries.forEach((e) => {
      html += `
        <div class="card-custom p-3" style="border-radius: var(--radius-sm);">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <h6 class="mb-0 fw-bold">${escapeHtml(e.title)}</h6>
            ${getMoodBadge(e.mood)}
          </div>
          <div class="text-muted mb-2" style="font-size:0.8rem;">
            ${e.wordCount || 0} words ${e.isFavorite ? '&bull; <i class="bi bi-star-fill text-warning"></i> Starred' : ''}
          </div>
          <div class="d-flex gap-2">
            <a href="entries.html?view=${e._id}" class="btn btn-sm btn-lavender-subtle">
              <i class="bi bi-eye"></i> View Full
            </a>
            <a href="editor.html?id=${e._id}" class="btn btn-sm btn-outline-custom">
              <i class="bi bi-pencil"></i> Edit
            </a>
          </div>
        </div>
      `;
    });
    html += '</div>';
    modalList.innerHTML = html;
  }

  modal.show();
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
