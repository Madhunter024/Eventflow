/**
 * EventFlow — Admin Portal Logic
 * Secure event creation, editing, participant management, and CSV export
 */

const adminState = {
  token: localStorage.getItem('eventflow_admin_token') || null,
  events: [],
  currentEventId: null,
  currentParticipants: [],
  participantSearchQuery: ''
};

// DOM Elements
const adminElements = {
  mainView: document.getElementById('admin-main-view'),
  loginModal: document.getElementById('login-modal'),
  loginForm: document.getElementById('admin-login-form'),
  loginUsername: document.getElementById('login-username'),
  loginPassword: document.getElementById('login-password'),
  loginAlertBox: document.getElementById('login-alert-box'),
  loginAlertMsg: document.getElementById('login-alert-msg'),
  btnFillDemo: document.getElementById('btn-fill-demo'),
  btnLogout: document.getElementById('btn-admin-logout'),
  themeToggleBtn: document.getElementById('btn-theme-toggle'),

  // Stats
  statEvents: document.getElementById('stat-admin-events'),
  statRegistrations: document.getElementById('stat-admin-registrations'),
  statFillRate: document.getElementById('stat-admin-fillrate'),
  statCapacity: document.getElementById('stat-admin-capacity'),

  // Events Table
  eventsTbody: document.getElementById('admin-events-tbody'),
  eventsCount: document.getElementById('admin-events-count'),
  tableSearch: document.getElementById('admin-table-search'),
  btnOpenCreateEvent: document.getElementById('btn-open-create-event'),

  // Event Editor Modal
  editorModal: document.getElementById('event-editor-modal'),
  btnCloseEditor: document.getElementById('btn-close-editor-modal'),
  btnCancelEditor: document.getElementById('btn-cancel-editor'),
  editorForm: document.getElementById('event-editor-form'),
  editorModalTitle: document.getElementById('editor-modal-title'),
  editorId: document.getElementById('editor-event-id'),
  editorTitle: document.getElementById('editor-title'),
  editorCategory: document.getElementById('editor-category'),
  editorCapacity: document.getElementById('editor-capacity'),
  editorDate: document.getElementById('editor-date'),
  editorTime: document.getElementById('editor-time'),
  editorVenue: document.getElementById('editor-venue'),
  editorImage: document.getElementById('editor-image'),
  editorBadge: document.getElementById('editor-badge'),
  editorStatus: document.getElementById('editor-status'),
  editorDescription: document.getElementById('editor-description'),

  // Participants Modal
  participantsModal: document.getElementById('participants-modal'),
  btnCloseParticipantsModal: document.getElementById('btn-close-participants-modal'),
  partModalEventTitle: document.getElementById('part-modal-event-title'),
  partModalEventMeta: document.getElementById('part-modal-event-meta'),
  partSearchInput: document.getElementById('part-search-input'),
  participantsTbody: document.getElementById('participants-tbody'),
  btnExportCsv: document.getElementById('btn-export-csv'),

  // Toast Container
  toastContainer: document.getElementById('toast-container')
};

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAdminEventListeners();

  if (adminState.token) {
    verifySession();
  } else {
    showLoginModal();
  }
});

function initTheme() {
  const savedTheme = localStorage.getItem('eventflow_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (adminElements.themeToggleBtn) {
    adminElements.themeToggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
  }
}

function initAdminEventListeners() {
  // Theme toggle
  if (adminElements.themeToggleBtn) {
    adminElements.themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('eventflow_theme', newTheme);
      adminElements.themeToggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });
  }

  // Demo Credentials Fill
  adminElements.btnFillDemo.addEventListener('click', () => {
    adminElements.loginUsername.value = 'admin';
    adminElements.loginPassword.value = 'admin123';
    showToast('Demo credentials filled!', 'info');
  });

  // Login Form
  adminElements.loginForm.addEventListener('submit', handleAdminLogin);

  // Logout Button
  adminElements.btnLogout.addEventListener('click', handleAdminLogout);

  // Table Search Filter
  adminElements.tableSearch.addEventListener('input', (e) => {
    filterEventsTable(e.target.value.toLowerCase());
  });

  // Open Create Event Modal
  adminElements.btnOpenCreateEvent.addEventListener('click', openCreateEventModal);

  // Close Event Editor Modal
  adminElements.btnCloseEditor.addEventListener('click', closeEditorModal);
  adminElements.btnCancelEditor.addEventListener('click', closeEditorModal);

  // Event Editor Form Submit
  adminElements.editorForm.addEventListener('submit', handleSaveEvent);

  // Participants Modal Close
  adminElements.btnCloseParticipantsModal.addEventListener('click', closeParticipantsModal);

  // Participants Search Filter
  adminElements.partSearchInput.addEventListener('input', (e) => {
    adminState.participantSearchQuery = e.target.value.toLowerCase();
    renderParticipantsTable();
  });

  // Export CSV Button
  adminElements.btnExportCsv.addEventListener('click', handleExportCsv);
}

/* ==========================================================================
   AUTHENTICATION
   ========================================================================== */
async function handleAdminLogin(e) {
  e.preventDefault();
  hideLoginAlert();

  const username = adminElements.loginUsername.value.trim();
  const password = adminElements.loginPassword.value.trim();

  // If in static / GitHub Pages mode
  if (window.ClientDB && window.ClientDB.isStaticMode()) {
    if (username === 'admin' && password === 'admin123') {
      adminState.token = 'demo_admin_static_token';
      localStorage.setItem('eventflow_admin_token', adminState.token);
      hideLoginModal();
      showToast('Welcome, Administrator!', 'success');
      loadDashboardData();
      return;
    } else {
      showLoginAlert('Invalid credentials. Use admin / admin123');
      return;
    }
  }

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Invalid credentials');
    }

    // Save token
    adminState.token = data.token;
    localStorage.setItem('eventflow_admin_token', data.token);

    hideLoginModal();
    showToast('Welcome, Administrator!', 'success');
    loadDashboardData();
  } catch (err) {
    // If backend is unreachable, fallback to static auth if valid
    if (username === 'admin' && password === 'admin123') {
      window.__FORCE_CLIENT_DB__ = true;
      adminState.token = 'demo_admin_static_token';
      localStorage.setItem('eventflow_admin_token', adminState.token);
      hideLoginModal();
      showToast('Welcome, Administrator! (Offline Mode)', 'success');
      loadDashboardData();
      return;
    }
    showLoginAlert(err.message || 'Login failed');
  }
}

async function verifySession() {
  if (window.ClientDB && window.ClientDB.isStaticMode()) {
    hideLoginModal();
    loadDashboardData();
    return;
  }

  try {
    const res = await fetchWithAuth('/api/admin/stats');
    if (res.ok) {
      hideLoginModal();
      loadDashboardData();
    } else {
      handleAdminLogout();
    }
  } catch (err) {
    if (window.ClientDB) {
      window.__FORCE_CLIENT_DB__ = true;
      hideLoginModal();
      loadDashboardData();
      return;
    }
    handleAdminLogout();
  }
}

function handleAdminLogout() {
  adminState.token = null;
  localStorage.removeItem('eventflow_admin_token');
  showLoginModal();
  showToast('Logged out successfully', 'info');
}

function showLoginModal() {
  adminElements.loginModal.classList.add('active');
  adminElements.mainView.style.display = 'none';
  adminElements.btnLogout.style.display = 'none';
}

function hideLoginModal() {
  adminElements.loginModal.classList.remove('active');
  adminElements.mainView.style.display = 'block';
  adminElements.btnLogout.style.display = 'inline-flex';
}

function showLoginAlert(msg) {
  adminElements.loginAlertBox.classList.add('visible', 'error');
  adminElements.loginAlertMsg.textContent = msg;
}

function hideLoginAlert() {
  adminElements.loginAlertBox.className = 'alert-box';
  adminElements.loginAlertMsg.textContent = '';
}

function fetchWithAuth(url, options = {}) {
  const headers = options.headers || {};
  headers['Authorization'] = `Bearer ${adminState.token}`;
  return fetch(url, { ...options, headers });
}

/* ==========================================================================
   DASHBOARD DATA & STATS
   ========================================================================== */
async function loadDashboardData() {
  if (window.ClientDB && window.ClientDB.isStaticMode()) {
    const stats = window.ClientDB.getStats();
    adminElements.statEvents.textContent = stats.totalEvents;
    adminElements.statRegistrations.textContent = stats.totalRegistrations;
    adminElements.statFillRate.textContent = `${stats.fillRate}%`;
    adminElements.statCapacity.textContent = stats.totalCapacity;

    adminState.events = window.ClientDB.getEvents();
    renderEventsTable(adminState.events);
    return;
  }

  try {
    // 1. Fetch Stats
    const statsRes = await fetchWithAuth('/api/admin/stats');
    const statsData = await statsRes.json();
    if (statsData.success) {
      adminElements.statEvents.textContent = statsData.data.totalEvents;
      adminElements.statRegistrations.textContent = statsData.data.totalRegistrations;
      adminElements.statFillRate.textContent = `${statsData.data.fillRate}%`;
      adminElements.statCapacity.textContent = statsData.data.totalCapacity;
    }

    // 2. Fetch Events
    const eventsRes = await fetchWithAuth('/api/admin/events');
    const eventsData = await eventsRes.json();
    if (eventsData.success) {
      adminState.events = eventsData.data;
      renderEventsTable(adminState.events);
    }
  } catch (err) {
    console.warn('Error loading dashboard via API, falling back to ClientDB:', err);
    if (window.ClientDB) {
      window.__FORCE_CLIENT_DB__ = true;
      loadDashboardData();
      return;
    }
    showToast('Failed to load dashboard data', 'error');
  }
}

function renderEventsTable(events) {
  adminElements.eventsCount.textContent = `${events.length} total events`;

  if (events.length === 0) {
    adminElements.eventsTbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px; color: var(--text-muted);">
          No events found. Click "Create New Event" to get started!
        </td>
      </tr>
    `;
    return;
  }

  adminElements.eventsTbody.innerHTML = events.map(event => {
    const fillPercent = Math.min(100, Math.round((event.registered_count / event.capacity) * 100));

    return `
      <tr>
        <td>
          <div class="table-event-cell">
            <img class="table-thumb" src="${escapeHtml(event.image_url)}" alt="">
            <div class="table-event-info">
              <strong>${escapeHtml(event.title)}</strong>
              <span>ID: #${event.id} • ${escapeHtml(event.badge || 'Standard')}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="badge-tag">${escapeHtml(event.category)}</span>
        </td>
        <td>
          <div><strong>${event.date}</strong></div>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(event.time)}</span>
        </td>
        <td>
          <span style="font-size: 0.85rem;">${escapeHtml(event.venue)}</span>
        </td>
        <td>
          <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
            ${event.registered_count} / ${event.capacity} <small>(${fillPercent}%)</small>
          </div>
          <div class="progress-track" style="height: 4px; width: 100px;">
            <div class="progress-fill" style="width: ${fillPercent}%;"></div>
          </div>
        </td>
        <td>
          <span class="badge-status-pill ${event.status === 'active' ? 'active' : 'inactive'}">
            ${event.status}
          </span>
        </td>
        <td style="text-align: right;">
          <div class="table-actions" style="justify-content: flex-end;">
            <button class="action-btn participants" title="View Registered Participants" onclick="openParticipantsModal(${event.id})">
              👥 Attendees (${event.registered_count})
            </button>
            <button class="action-btn" title="Edit Event Details" onclick="openEditEventModal(${event.id})">
              ✏️ Edit
            </button>
            <button class="action-btn danger" title="Delete Event" onclick="handleDeleteEvent(${event.id}, '${escapeHtml(event.title)}')">
              🗑️ Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterEventsTable(term) {
  if (!term) {
    renderEventsTable(adminState.events);
    return;
  }
  const filtered = adminState.events.filter(e => 
    e.title.toLowerCase().includes(term) || 
    e.venue.toLowerCase().includes(term) ||
    e.category.toLowerCase().includes(term)
  );
  renderEventsTable(filtered);
}

/* ==========================================================================
   EVENT CREATE & EDIT
   ========================================================================== */
function openCreateEventModal() {
  adminElements.editorModalTitle.textContent = 'Create New Event';
  adminElements.editorForm.reset();
  adminElements.editorId.value = '';
  adminElements.editorImage.value = '/assets/images/tech_summit.jpg';
  adminElements.editorBadge.value = 'Featured';
  adminElements.editorStatus.value = 'active';

  // Default to tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 14);
  adminElements.editorDate.value = tomorrow.toISOString().split('T')[0];
  adminElements.editorTime.value = '10:00 AM - 04:30 PM';

  adminElements.editorModal.classList.add('active');
  adminElements.editorTitle.focus();
}

window.openEditEventModal = function(id) {
  const event = adminState.events.find(e => e.id === Number(id));
  if (!event) return;

  adminElements.editorModalTitle.textContent = 'Edit Event Details';
  adminElements.editorId.value = event.id;
  adminElements.editorTitle.value = event.title;
  adminElements.editorCategory.value = event.category;
  adminElements.editorCapacity.value = event.capacity;
  adminElements.editorDate.value = event.date;
  adminElements.editorTime.value = event.time;
  adminElements.editorVenue.value = event.venue;
  adminElements.editorImage.value = event.image_url;
  adminElements.editorBadge.value = event.badge || '';
  adminElements.editorStatus.value = event.status || 'active';
  adminElements.editorDescription.value = event.description;

  adminElements.editorModal.classList.add('active');
};

function closeEditorModal() {
  adminElements.editorModal.classList.remove('active');
}

window.setPresetImage = function(url) {
  adminElements.editorImage.value = url;
};

async function handleSaveEvent(e) {
  e.preventDefault();

  const id = adminElements.editorId.value;
  const isEdit = Boolean(id);

  const payload = {
    title: adminElements.editorTitle.value.trim(),
    category: adminElements.editorCategory.value,
    capacity: Number(adminElements.editorCapacity.value),
    date: adminElements.editorDate.value,
    time: adminElements.editorTime.value.trim(),
    venue: adminElements.editorVenue.value.trim(),
    image_url: adminElements.editorImage.value.trim(),
    badge: adminElements.editorBadge.value.trim() || 'Featured',
    status: adminElements.editorStatus.value,
    description: adminElements.editorDescription.value.trim()
  };

  if (window.ClientDB && window.ClientDB.isStaticMode()) {
    window.ClientDB.saveEvent(payload, id);
    closeEditorModal();
    showToast(isEdit ? 'Event updated successfully!' : 'Event created successfully!', 'success');
    loadDashboardData();
    return;
  }

  try {
    const url = isEdit ? `/api/admin/events/${id}` : '/api/admin/events';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetchWithAuth(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to save event');
    }

    closeEditorModal();
    showToast(isEdit ? 'Event updated successfully!' : 'Event created successfully!', 'success');
    loadDashboardData();
  } catch (err) {
    showToast(err.message || 'Error saving event', 'error');
  }
}

window.handleDeleteEvent = async function(id, title) {
  const confirmed = confirm(`Are you sure you want to delete the event "${title}"?\n\nThis will permanently delete the event and cancel all associated participant registrations.`);
  if (!confirmed) return;

  if (window.ClientDB && window.ClientDB.isStaticMode()) {
    window.ClientDB.deleteEvent(id);
    showToast(`Event deleted successfully`, 'success');
    loadDashboardData();
    return;
  }

  try {
    const res = await fetchWithAuth(`/api/admin/events/${id}`, {
      method: 'DELETE'
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete');

    showToast(`Event deleted successfully`, 'success');
    loadDashboardData();
  } catch (err) {
    showToast(err.message || 'Error deleting event', 'error');
  }
};

/* ==========================================================================
   PARTICIPANTS MODAL & MANAGEMENT
   ========================================================================== */
window.openParticipantsModal = async function(eventId) {
  adminState.currentEventId = eventId;
  adminState.participantSearchQuery = '';
  adminElements.partSearchInput.value = '';

  adminElements.partModalEventTitle.textContent = 'Loading participants...';
  adminElements.partModalEventMeta.textContent = '';
  adminElements.participantsTbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px;">Loading roster...</td></tr>';
  adminElements.participantsModal.classList.add('active');

  if (window.ClientDB && window.ClientDB.isStaticMode()) {
    const event = window.ClientDB.getEventById(eventId);
    const participants = window.ClientDB.getParticipants(eventId);

    adminState.currentParticipants = participants;
    adminElements.partModalEventTitle.textContent = event ? event.title : 'Event Participants';
    adminElements.partModalEventMeta.textContent = `${participants.length} registered attendee${participants.length === 1 ? '' : 's'}`;

    renderParticipantsTable();
    return;
  }

  try {
    const res = await fetchWithAuth(`/api/admin/events/${eventId}/participants`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Failed to fetch participants');

    adminState.currentParticipants = data.data;
    adminElements.partModalEventTitle.textContent = data.event.title;
    adminElements.partModalEventMeta.textContent = `${data.count} registered attendee${data.count === 1 ? '' : 's'} (${data.event.capacity - data.count} seats remaining)`;

    renderParticipantsTable();
  } catch (err) {
    adminElements.participantsTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--accent-rose); padding: 20px;">${err.message}</td></tr>`;
  }
};

function closeParticipantsModal() {
  adminElements.participantsModal.classList.remove('active');
  adminState.currentEventId = null;
  adminState.currentParticipants = [];
}

function renderParticipantsTable() {
  const query = adminState.participantSearchQuery;
  let list = adminState.currentParticipants;

  if (query) {
    list = list.filter(p => 
      p.full_name.toLowerCase().includes(query) ||
      p.email.toLowerCase().includes(query) ||
      p.ticket_number.toLowerCase().includes(query) ||
      (p.organization && p.organization.toLowerCase().includes(query))
    );
  }

  if (list.length === 0) {
    adminElements.participantsTbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 32px; color: var(--text-muted);">
          No registered participants found.
        </td>
      </tr>
    `;
    return;
  }

  adminElements.participantsTbody.innerHTML = list.map(p => {
    const initials = p.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const dateFormatted = p.created_at ? new Date(p.created_at).toLocaleDateString() : '';

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center;">
            <span class="avatar-initials">${initials}</span>
            <div>
              <strong style="color: var(--text-primary); font-size: 0.95rem;">${escapeHtml(p.full_name)}</strong>
              ${p.notes ? `<div style="font-size: 0.78rem; color: var(--accent-cyan);">Note: ${escapeHtml(p.notes)}</div>` : ''}
            </div>
          </div>
        </td>
        <td>
          <code style="font-family: monospace; font-size: 0.85rem; padding: 2px 6px; background: rgba(99, 102, 241, 0.15); color: #a5b4fc; border-radius: 4px;">
            ${escapeHtml(p.ticket_number)}
          </code>
        </td>
        <td>
          <div><a href="mailto:${escapeHtml(p.email)}" style="color: #818cf8; text-decoration: none;">${escapeHtml(p.email)}</a></div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(p.phone)}</div>
        </td>
        <td>
          <span>${escapeHtml(p.organization || '—')}</span>
        </td>
        <td>
          <span style="font-size: 0.85rem; color: var(--text-muted);">${dateFormatted}</span>
        </td>
        <td style="text-align: right;">
          <button class="action-btn danger" style="padding: 4px 8px; font-size: 0.78rem;" onclick="handleRemoveParticipant(${p.id}, '${escapeHtml(p.full_name)}')">
            Cancel Registration
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.handleRemoveParticipant = async function(regId, name) {
  const confirmed = confirm(`Cancel registration for attendee "${name}"?`);
  if (!confirmed) return;

  if (window.ClientDB && window.ClientDB.isStaticMode()) {
    window.ClientDB.deleteRegistration(regId);
    showToast(`Cancelled registration for ${name}`, 'success');
    openParticipantsModal(adminState.currentEventId);
    loadDashboardData();
    return;
  }

  try {
    const res = await fetchWithAuth(`/api/admin/registrations/${regId}`, {
      method: 'DELETE'
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to remove participant');

    showToast(`Cancelled registration for ${name}`, 'success');
    openParticipantsModal(adminState.currentEventId);
    loadDashboardData();
  } catch (err) {
    showToast(err.message || 'Error removing participant', 'error');
  }
};

function handleExportCsv() {
  if (!adminState.currentEventId) return;

  if (window.ClientDB && window.ClientDB.isStaticMode()) {
    const participants = window.ClientDB.getParticipants(adminState.currentEventId);
    const headers = ['Ticket Number', 'Full Name', 'Email', 'Phone', 'Organization', 'Notes', 'Registration Date'];
    const rows = participants.map(p => [
      `"${p.ticket_number}"`,
      `"${(p.full_name || '').replace(/"/g, '""')}"`,
      `"${(p.email || '').replace(/"/g, '""')}"`,
      `"${(p.phone || '').replace(/"/g, '""')}"`,
      `"${(p.organization || '').replace(/"/g, '""')}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
      `"${p.created_at}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event_${adminState.currentEventId}_attendees.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    showToast('CSV export downloaded successfully!', 'success');
    return;
  }

  const exportUrl = `/api/admin/events/${adminState.currentEventId}/participants/export`;
  fetch(exportUrl, {
    headers: { 'Authorization': `Bearer ${adminState.token}` }
  })
    .then(res => {
      if (!res.ok) throw new Error('Export failed');
      return res.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event_${adminState.currentEventId}_attendees.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('CSV export downloaded successfully!', 'success');
    })
    .catch(err => {
      showToast('Failed to export CSV', 'error');
    });
}

/* ==========================================================================
   HELPERS & TOASTS
   ========================================================================== */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
  adminElements.toastContainer.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
