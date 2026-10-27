/**
 * EventFlow — Main Public Application Logic
 * Fast, reactive vanilla JavaScript with zero external runtime bloat
 */

// Application State
const state = {
  events: [],
  selectedCategory: 'All',
  searchQuery: '',
  sortBy: 'date-asc',
  currentEvent: null,
  currentTicket: null
};

// DOM Element Selectors
const elements = {
  eventsGrid: document.getElementById('events-grid'),
  resultsCount: document.getElementById('results-count'),
  searchInput: document.getElementById('search-input'),
  sortSelect: document.getElementById('sort-select'),
  categoryPills: document.getElementById('category-pills-container'),
  statTotalEvents: document.getElementById('stat-total-events'),
  statTotalAttendees: document.getElementById('stat-total-attendees'),
  statAvailableSpots: document.getElementById('stat-available-spots'),
  themeToggleBtn: document.getElementById('btn-theme-toggle'),

  // Registration Modal
  regModal: document.getElementById('registration-modal'),
  btnCloseRegModal: document.getElementById('btn-close-reg-modal'),
  regForm: document.getElementById('registration-form'),
  modalEventImage: document.getElementById('modal-event-image'),
  modalEventTitle: document.getElementById('modal-event-title'),
  modalEventDesc: document.getElementById('modal-event-description'),
  modalEventDate: document.getElementById('modal-event-date'),
  modalEventTime: document.getElementById('modal-event-time'),
  modalEventVenue: document.getElementById('modal-event-venue'),
  modalEventSeats: document.getElementById('modal-event-seats'),
  regEventId: document.getElementById('reg-event-id'),
  regName: document.getElementById('reg-name'),
  regEmail: document.getElementById('reg-email'),
  regPhone: document.getElementById('reg-phone'),
  regOrganization: document.getElementById('reg-organization'),
  regNotes: document.getElementById('reg-notes'),
  regAlertBox: document.getElementById('reg-alert-box'),
  regAlertText: document.getElementById('reg-alert-text'),
  btnRegText: document.getElementById('btn-reg-text'),
  btnRegSpinner: document.getElementById('btn-reg-spinner'),
  btnSubmitReg: document.getElementById('btn-submit-registration'),

  // Ticket Modal
  ticketModal: document.getElementById('ticket-modal'),
  btnCloseTicketModal: document.getElementById('btn-close-ticket-modal'),
  ticketDisplayId: document.getElementById('ticket-display-id'),
  ticketDisplayEvent: document.getElementById('ticket-display-event'),
  ticketDisplayName: document.getElementById('ticket-display-name'),
  ticketDisplayEmail: document.getElementById('ticket-display-email'),
  ticketDisplayDatetime: document.getElementById('ticket-display-datetime'),
  ticketDisplayVenue: document.getElementById('ticket-display-venue'),
  btnPrintPass: document.getElementById('btn-print-pass'),
  btnCalendarIcs: document.getElementById('btn-calendar-ics'),

  // Lookup Modal
  lookupModal: document.getElementById('lookup-modal'),
  btnOpenLookup: document.getElementById('btn-open-lookup'),
  btnCloseLookupModal: document.getElementById('btn-close-lookup-modal'),
  lookupInput: document.getElementById('lookup-input'),
  btnDoLookup: document.getElementById('btn-do-lookup'),
  lookupResultsList: document.getElementById('lookup-results-list'),

  // Toasts
  toastContainer: document.getElementById('toast-container')
};

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initEventListeners();
  loadEvents();
});

/* ==========================================================================
   THEME TOGGLE
   ========================================================================== */
function initTheme() {
  const savedTheme = localStorage.getItem('eventflow_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('eventflow_theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  if (elements.themeToggleBtn) {
    elements.themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

/* ==========================================================================
   EVENT LISTENERS
   ========================================================================== */
function initEventListeners() {
  // Theme button
  elements.themeToggleBtn.addEventListener('click', toggleTheme);

  // Search input with debounce
  let debounceTimer;
  elements.searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.searchQuery = e.target.value.trim();
      loadEvents();
    }, 250);
  });

  // Sort selector
  elements.sortSelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    loadEvents();
  });

  // Category filter pills
  elements.categoryPills.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;

    elements.categoryPills.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
    pill.classList.add('active');

    state.selectedCategory = pill.dataset.category;
    loadEvents();
  });

  // Modal close buttons
  elements.btnCloseRegModal.addEventListener('click', closeRegistrationModal);
  elements.btnCloseTicketModal.addEventListener('click', closeTicketModal);
  elements.btnCloseLookupModal.addEventListener('click', closeLookupModal);

  // Close modals when clicking backdrop
  [elements.regModal, elements.ticketModal, elements.lookupModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      elements.regModal.classList.remove('active');
      elements.ticketModal.classList.remove('active');
      elements.lookupModal.classList.remove('active');
    }
  });

  // Form submission
  elements.regForm.addEventListener('submit', handleRegistrationSubmit);

  // Ticket actions
  elements.btnPrintPass.addEventListener('click', handlePrintPass);
  elements.btnCalendarIcs.addEventListener('click', handleCalendarDownload);

  // Ticket lookup
  elements.btnOpenLookup.addEventListener('click', openLookupModal);
  elements.btnDoLookup.addEventListener('click', handleDoLookup);
  elements.lookupInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleDoLookup();
  });
}

/* ==========================================================================
   DATA FETCHING & RENDERING
   ========================================================================== */
async function loadEvents() {
  try {
    elements.resultsCount.textContent = 'Searching events...';
    
    const params = new URLSearchParams();
    if (state.selectedCategory && state.selectedCategory !== 'All') {
      params.append('category', state.selectedCategory);
    }
    if (state.searchQuery) {
      params.append('search', state.searchQuery);
    }
    if (state.sortBy) {
      params.append('sort', state.sortBy);
    }

    const res = await fetch(`/api/events?${params.toString()}`);
    const result = await res.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch events');
    }

    state.events = result.data;
    renderEvents();
    updateLiveStats();
  } catch (error) {
    console.error('Error loading events:', error);
    elements.eventsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px;">
        <p style="font-size: 1.2rem; color: var(--accent-rose); margin-bottom: 12px;">⚠️ Unable to load events right now.</p>
        <button class="btn btn-secondary" onclick="loadEvents()">Try Again</button>
      </div>
    `;
    elements.resultsCount.textContent = 'Error loading events';
  }
}

function renderEvents() {
  const events = state.events;
  elements.resultsCount.textContent = `${events.length} event${events.length === 1 ? '' : 's'} found`;

  if (events.length === 0) {
    elements.eventsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">🔍</div>
        <h3 style="font-size: 1.3rem; margin-bottom: 8px;">No matching events found</h3>
        <p style="color: var(--text-muted); margin-bottom: 20px;">Try adjusting your keyword or switching categories.</p>
        <button class="btn btn-secondary" onclick="resetFilters()">Clear Filters</button>
      </div>
    `;
    return;
  }

  elements.eventsGrid.innerHTML = events.map(event => {
    const fillPercent = Math.min(100, Math.round((event.registered_count / event.capacity) * 100));
    const isSoldOut = event.seats_left <= 0;
    const isAlmostFull = !isSoldOut && fillPercent >= 80;

    const formattedDate = formatDateDisplay(event.date);

    return `
      <article class="event-card" data-id="${event.id}">
        <div class="card-media">
          <img class="card-image" src="${escapeHtml(event.image_url)}" alt="${escapeHtml(event.title)}" loading="lazy">
          <div class="card-badges">
            <span class="badge-category">${escapeHtml(event.category)}</span>
            <span class="badge-status ${isSoldOut ? 'sold-out' : ''}">
              ${isSoldOut ? 'Sold Out' : (event.badge || 'Open')}
            </span>
          </div>
        </div>

        <div class="card-content">
          <div class="card-date-row">
            <span>📅 ${formattedDate}</span>
            <span>⏰ ${escapeHtml(event.time)}</span>
          </div>

          <h3 class="card-title">${escapeHtml(event.title)}</h3>

          <div class="card-venue">
            <span>📍</span>
            <span>${escapeHtml(event.venue)}</span>
          </div>

          <p class="card-description">${escapeHtml(event.description)}</p>

          <div class="card-capacity">
            <div class="capacity-header">
              <span class="capacity-label">Availability</span>
              <span class="capacity-value">
                ${isSoldOut ? 'Sold Out' : `${event.seats_left} seats remaining`}
              </span>
            </div>
            <div class="progress-track" title="${event.registered_count} of ${event.capacity} seats booked">
              <div 
                class="progress-fill ${isAlmostFull ? 'almost-full' : ''}" 
                style="width: ${fillPercent}%;"
              ></div>
            </div>
          </div>

          <div class="card-actions">
            <button 
              class="btn btn-primary" 
              onclick="openRegistrationModal(${event.id})"
              ${isSoldOut ? 'disabled' : ''}
            >
              ${isSoldOut ? 'Sold Out' : 'Register Now'}
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function updateLiveStats() {
  const events = state.events;
  const totalEvents = events.length;
  const totalAttendees = events.reduce((acc, e) => acc + (e.registered_count || 0), 0);
  const availableSpots = events.reduce((acc, e) => acc + (e.seats_left || 0), 0);

  if (elements.statTotalEvents) elements.statTotalEvents.textContent = totalEvents;
  if (elements.statTotalAttendees) elements.statTotalAttendees.textContent = totalAttendees;
  if (elements.statAvailableSpots) elements.statAvailableSpots.textContent = availableSpots;
}

function resetFilters() {
  elements.searchInput.value = '';
  state.searchQuery = '';
  state.selectedCategory = 'All';
  elements.categoryPills.querySelectorAll('.filter-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === 'All');
  });
  loadEvents();
}

/* ==========================================================================
   REGISTRATION FLOW & VALIDATION
   ========================================================================== */
window.openRegistrationModal = function(eventId) {
  const event = state.events.find(e => e.id === Number(eventId));
  if (!event) return;

  state.currentEvent = event;

  // Reset form inputs & errors
  elements.regForm.reset();
  clearFormValidationErrors();
  hideRegAlert();

  // Populate Event Info
  elements.regEventId.value = event.id;
  elements.modalEventTitle.textContent = event.title;
  elements.modalEventDesc.textContent = event.description;
  elements.modalEventDate.textContent = formatDateDisplay(event.date);
  elements.modalEventTime.textContent = event.time;
  elements.modalEventVenue.textContent = event.venue;
  elements.modalEventSeats.textContent = `${event.seats_left} seats remaining`;
  elements.modalEventImage.src = event.image_url;

  // Open modal
  elements.regModal.classList.add('active');
  elements.regName.focus();
};

function closeRegistrationModal() {
  elements.regModal.classList.remove('active');
  state.currentEvent = null;
}

async function handleRegistrationSubmit(e) {
  e.preventDefault();

  const eventId = elements.regEventId.value;
  const name = elements.regName.value.trim();
  const email = elements.regEmail.value.trim();
  const phone = elements.regPhone.value.trim();
  const organization = elements.regOrganization.value.trim();
  const notes = elements.regNotes.value.trim();

  // Clear previous alerts
  clearFormValidationErrors();
  hideRegAlert();

  // Client validation
  let hasErrors = false;

  if (name.length < 2) {
    showFieldError('error-reg-name', elements.regName);
    hasErrors = true;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showFieldError('error-reg-email', elements.regEmail);
    hasErrors = true;
  }

  if (phone.length < 7) {
    showFieldError('error-reg-phone', elements.regPhone);
    hasErrors = true;
  }

  if (hasErrors) {
    return;
  }

  // Toggle button loading state
  setRegistrationLoading(true);

  try {
    const res = await fetch(`/api/events/${eventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: name,
        email: email,
        phone: phone,
        organization: organization,
        notes: notes
      })
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 409 && data.isDuplicate) {
        // Duplicate Registration Prevention Caught!
        showRegAlert('warning', `Duplicate Registration: ${data.message}`);
        showToast('You are already registered for this event!', 'error');
        return;
      }
      throw new Error(data.message || 'Registration failed');
    }

    // Success!
    closeRegistrationModal();
    showToast('Registration successful! Digital pass generated.', 'success');
    
    // Open Ticket Pass Modal with registration record
    openTicketModal(data.data);

    // Refresh events to show updated seats count in background
    loadEvents();
  } catch (err) {
    console.error('Registration failed:', err);
    showRegAlert('error', err.message || 'Failed to complete registration.');
    showToast(err.message || 'Error completing registration', 'error');
  } finally {
    setRegistrationLoading(false);
  }
}

function showFieldError(errorElementId, inputElement) {
  const errEl = document.getElementById(errorElementId);
  if (errEl) errEl.classList.add('visible');
  if (inputElement) inputElement.classList.add('input-error');
}

function clearFormValidationErrors() {
  document.querySelectorAll('.field-error-msg').forEach(el => el.classList.remove('visible'));
  document.querySelectorAll('.form-input').forEach(el => el.classList.remove('input-error'));
}

function showRegAlert(type, message) {
  elements.regAlertBox.className = `alert-box visible ${type}`;
  elements.regAlertText.textContent = message;
}

function hideRegAlert() {
  elements.regAlertBox.className = 'alert-box';
  elements.regAlertText.textContent = '';
}

function setRegistrationLoading(loading) {
  elements.btnSubmitReg.disabled = loading;
  elements.btnRegText.style.display = loading ? 'none' : 'inline';
  elements.btnRegSpinner.style.display = loading ? 'inline' : 'none';
}

/* ==========================================================================
   TICKET PASS MODAL & ACTIONS
   ========================================================================== */
function openTicketModal(ticketData) {
  state.currentTicket = ticketData;

  elements.ticketDisplayId.textContent = ticketData.ticket_number;
  elements.ticketDisplayEvent.textContent = ticketData.event_title || (state.currentEvent ? state.currentEvent.title : 'Event');
  elements.ticketDisplayName.textContent = ticketData.full_name;
  elements.ticketDisplayEmail.textContent = ticketData.email;
  elements.ticketDisplayDatetime.textContent = `${formatDateDisplay(ticketData.event_date)} • ${ticketData.event_time}`;
  elements.ticketDisplayVenue.textContent = ticketData.event_venue || 'Main Venue';

  elements.ticketModal.classList.add('active');
}

function closeTicketModal() {
  elements.ticketModal.classList.remove('active');
  state.currentTicket = null;
}

function handlePrintPass() {
  window.print();
}

function handleCalendarDownload() {
  const ticket = state.currentTicket;
  if (!ticket) return;

  const eventTitle = ticket.event_title || 'Event Registration';
  const venue = ticket.event_venue || '';
  const dateStr = ticket.event_date ? ticket.event_date.replace(/-/g, '') : '20261120';
  
  // Format iCalendar (.ics) content
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EventFlow//Event Registration//EN',
    'BEGIN:VEVENT',
    `UID:${ticket.ticket_number}@eventflow.local`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${dateStr}T140000Z`,
    `DTEND:${dateStr}T180000Z`,
    `SUMMARY:${eventTitle}`,
    `LOCATION:${venue}`,
    `DESCRIPTION:Official Ticket Pass: ${ticket.ticket_number}\\nAttendee: ${ticket.full_name}\\nEventFlow Registration.`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${ticket.ticket_number}_calendar.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('Calendar .ics file downloaded!', 'info');
}

/* ==========================================================================
   TICKET LOOKUP MODAL
   ========================================================================== */
function openLookupModal() {
  elements.lookupInput.value = '';
  elements.lookupResultsList.style.display = 'none';
  elements.lookupResultsList.innerHTML = '';
  elements.lookupModal.classList.add('active');
  elements.lookupInput.focus();
}

function closeLookupModal() {
  elements.lookupModal.classList.remove('active');
}

async function handleDoLookup() {
  const term = elements.lookupInput.value.trim();
  if (!term) {
    showToast('Please enter a ticket number or email.', 'error');
    return;
  }

  elements.lookupResultsList.style.display = 'block';
  elements.lookupResultsList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Searching...</p>';

  try {
    let results = [];
    if (term.includes('@')) {
      const res = await fetch(`/api/events/lookup/email?email=${encodeURIComponent(term)}`);
      const data = await res.json();
      if (data.success && data.data) results = data.data;
    } else {
      const res = await fetch(`/api/events/lookup/ticket/${encodeURIComponent(term)}`);
      const data = await res.json();
      if (data.success && data.data) results = [data.data];
    }

    if (results.length === 0) {
      elements.lookupResultsList.innerHTML = `
        <div style="padding: 16px; background: rgba(255, 255, 255, 0.04); border-radius: var(--radius-md); text-align: center;">
          <p style="color: var(--text-muted);">No registrations found for "<strong>${escapeHtml(term)}</strong>".</p>
        </div>
      `;
      return;
    }

    elements.lookupResultsList.innerHTML = results.map(ticket => `
      <div style="padding: 14px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
        <div>
          <div style="font-weight: 700; color: var(--text-primary);">${escapeHtml(ticket.event_title)}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); font-family: monospace;">${escapeHtml(ticket.ticket_number)} • ${formatDateDisplay(ticket.event_date)}</div>
        </div>
        <button class="btn btn-secondary" style="padding: 6px 14px; font-size: 0.82rem;" onclick="viewLookupTicket('${ticket.ticket_number}')">
          View Pass
        </button>
      </div>
    `).join('');
  } catch (err) {
    elements.lookupResultsList.innerHTML = '<p style="color: var(--accent-rose); text-align: center;">Lookup failed. Please check connection.</p>';
  }
}

window.viewLookupTicket = async function(ticketNumber) {
  try {
    const res = await fetch(`/api/events/lookup/ticket/${encodeURIComponent(ticketNumber)}`);
    const data = await res.json();
    if (data.success && data.data) {
      closeLookupModal();
      openTicketModal(data.data);
    }
  } catch (err) {
    showToast('Failed to load pass', 'error');
  }
};

/* ==========================================================================
   HELPERS & TOASTS
   ========================================================================== */
function formatDateDisplay(dateString) {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return dateString;
}

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
  elements.toastContainer.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
