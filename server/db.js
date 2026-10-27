const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

// Ensure database directory exists
const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'events.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    venue TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 100,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    badge TEXT DEFAULT 'Popular',
    price TEXT DEFAULT 'Free',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    ticket_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    organization TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE(event_id, email)
  );

  CREATE INDEX IF NOT EXISTS idx_reg_event ON registrations(event_id);
  CREATE INDEX IF NOT EXISTS idx_reg_email ON registrations(email);
  CREATE INDEX IF NOT EXISTS idx_reg_ticket ON registrations(ticket_number);
`);

/**
 * Generate a clean, readable, unique ticket number
 */
function generateTicketNumber(eventId) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const year = new Date().getFullYear();
  return `EVT-${year}-${eventId}-${rand}`;
}

// Database helper functions
const dbHelpers = {
  getEvents: ({ category, search, sort } = {}) => {
    let sql = `
      SELECT 
        e.*,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered_count,
        MAX(0, e.capacity - (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id)) AS seats_left
      FROM events e
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'All') {
      sql += ` AND LOWER(e.category) = LOWER(?)`;
      params.push(category);
    }

    if (search && search.trim() !== '') {
      sql += ` AND (LOWER(e.title) LIKE LOWER(?) OR LOWER(e.venue) LIKE LOWER(?) OR LOWER(e.description) LIKE LOWER(?))`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (sort === 'date-asc') {
      sql += ` ORDER BY e.date ASC`;
    } else if (sort === 'date-desc') {
      sql += ` ORDER BY e.date DESC`;
    } else if (sort === 'popularity') {
      sql += ` ORDER BY registered_count DESC, e.date ASC`;
    } else {
      sql += ` ORDER BY e.date ASC, e.id DESC`;
    }

    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },

  getEventById: (id) => {
    const stmt = db.prepare(`
      SELECT 
        e.*,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered_count,
        MAX(0, e.capacity - (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id)) AS seats_left
      FROM events e
      WHERE e.id = ?
    `);
    return stmt.get(Number(id));
  },

  createEvent: ({ title, category, date, time, venue, capacity, description, image_url, badge, price, status }) => {
    const stmt = db.prepare(`
      INSERT INTO events (title, category, date, time, venue, capacity, description, image_url, badge, price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      title.trim(),
      category.trim(),
      date,
      time.trim(),
      venue.trim(),
      Number(capacity) || 100,
      description.trim(),
      image_url.trim(),
      badge || 'Featured',
      price || 'Free',
      status || 'active'
    );
    return dbHelpers.getEventById(result.lastInsertRowid);
  },

  updateEvent: (id, { title, category, date, time, venue, capacity, description, image_url, badge, price, status }) => {
    const stmt = db.prepare(`
      UPDATE events
      SET title = ?, category = ?, date = ?, time = ?, venue = ?, capacity = ?, description = ?, image_url = ?, badge = ?, price = ?, status = ?
      WHERE id = ?
    `);
    stmt.run(
      title.trim(),
      category.trim(),
      date,
      time.trim(),
      venue.trim(),
      Number(capacity) || 100,
      description.trim(),
      image_url.trim(),
      badge || 'Featured',
      price || 'Free',
      status || 'active',
      Number(id)
    );
    return dbHelpers.getEventById(id);
  },

  deleteEvent: (id) => {
    const stmt = db.prepare(`DELETE FROM events WHERE id = ?`);
    const result = stmt.run(Number(id));
    return result.changes > 0;
  },

  registerParticipant: ({ event_id, full_name, email, phone, organization, notes }) => {
    const event = dbHelpers.getEventById(event_id);
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.status !== 'active') {
      throw new Error('This event is currently not accepting registrations.');
    }

    if (event.seats_left <= 0) {
      throw new Error('Sorry, this event is already fully booked!');
    }

    // Check duplicate email for this event
    const existing = db.prepare(`SELECT id, ticket_number FROM registrations WHERE event_id = ? AND LOWER(email) = LOWER(?)`).get(event_id, email.trim());
    if (existing) {
      const err = new Error(`You are already registered for "${event.title}" with email ${email.trim()}. Your Ticket ID is ${existing.ticket_number}.`);
      err.code = 'DUPLICATE_REGISTRATION';
      err.ticketNumber = existing.ticket_number;
      throw err;
    }

    const ticketNumber = generateTicketNumber(event_id);
    const stmt = db.prepare(`
      INSERT INTO registrations (event_id, ticket_number, full_name, email, phone, organization, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(
        Number(event_id),
        ticketNumber,
        full_name.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        (organization || '').trim(),
        (notes || '').trim()
      );

      const reg = db.prepare(`
        SELECT r.*, e.title as event_title, e.date as event_date, e.time as event_time, e.venue as event_venue, e.category as event_category
        FROM registrations r
        JOIN events e ON e.id = r.event_id
        WHERE r.id = ?
      `).get(result.lastInsertRowid);

      return reg;
    } catch (err) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        const dupErr = new Error(`You are already registered for this event with email ${email}.`);
        dupErr.code = 'DUPLICATE_REGISTRATION';
        throw dupErr;
      }
      throw err;
    }
  },

  getRegistrationsByEvent: (eventId) => {
    const stmt = db.prepare(`
      SELECT id, event_id, ticket_number, full_name, email, phone, organization, notes, created_at
      FROM registrations
      WHERE event_id = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(Number(eventId));
  },

  getRegistrationByTicket: (ticketNumber) => {
    const stmt = db.prepare(`
      SELECT 
        r.*, 
        e.title as event_title, 
        e.category as event_category, 
        e.date as event_date, 
        e.time as event_time, 
        e.venue as event_venue, 
        e.image_url as event_image,
        e.price as event_price
      FROM registrations r
      JOIN events e ON e.id = r.event_id
      WHERE LOWER(r.ticket_number) = LOWER(?)
    `);
    return stmt.get(ticketNumber.trim());
  },

  getRegistrationsByEmail: (email) => {
    const stmt = db.prepare(`
      SELECT 
        r.*, 
        e.title as event_title, 
        e.category as event_category, 
        e.date as event_date, 
        e.time as event_time, 
        e.venue as event_venue
      FROM registrations r
      JOIN events e ON e.id = r.event_id
      WHERE LOWER(r.email) = LOWER(?)
      ORDER BY r.created_at DESC
    `);
    return stmt.all(email.trim());
  },

  deleteRegistration: (id) => {
    const stmt = db.prepare(`DELETE FROM registrations WHERE id = ?`);
    const result = stmt.run(Number(id));
    return result.changes > 0;
  },

  getAdminStats: () => {
    const totalEvents = db.prepare(`SELECT COUNT(*) as count FROM events`).get().count;
    const activeEvents = db.prepare(`SELECT COUNT(*) as count FROM events WHERE status = 'active'`).get().count;
    const totalRegistrations = db.prepare(`SELECT COUNT(*) as count FROM registrations`).get().count;
    const totalCapacity = db.prepare(`SELECT SUM(capacity) as total FROM events`).get().total || 0;
    
    // Top 5 popular events
    const popularEvents = db.prepare(`
      SELECT 
        e.id, e.title, e.category, e.date, e.capacity, e.status,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered_count
      FROM events e
      ORDER BY registered_count DESC
      LIMIT 5
    `).all();

    // Registrations breakdown by category
    const categoryBreakdown = db.prepare(`
      SELECT e.category, COUNT(r.id) as registrations
      FROM events e
      LEFT JOIN registrations r ON r.event_id = e.id
      GROUP BY e.category
      ORDER BY registrations DESC
    `).all();

    return {
      totalEvents,
      activeEvents,
      totalRegistrations,
      totalCapacity,
      fillRate: totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0,
      popularEvents,
      categoryBreakdown
    };
  }
};

module.exports = {
  db,
  ...dbHelpers
};
