const express = require('express');
const router = express.Router();
const db = require('../db');
const { adminAuth, ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SECRET_TOKEN } = require('../middleware/auth');

/**
 * POST /api/admin/login
 * Simple and secure admin authentication
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({
      success: true,
      message: 'Login successful',
      token: ADMIN_SECRET_TOKEN,
      user: { username: ADMIN_USERNAME, role: 'Administrator' }
    });
  }
  return res.status(401).json({
    success: false,
    message: 'Invalid username or password. Default is admin / admin123'
  });
});

// Protect all following routes with adminAuth
router.use(adminAuth);

/**
 * GET /api/admin/stats
 * Overview analytics for the admin dashboard
 */
router.get('/stats', (req, res) => {
  try {
    const stats = db.getAdminStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Failed to load stats.' });
  }
});

/**
 * GET /api/admin/events
 * Get all events with full details
 */
router.get('/events', (req, res) => {
  try {
    const events = db.getEvents();
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load events.' });
  }
});

/**
 * POST /api/admin/events
 * Create a new event
 */
router.post('/events', (req, res) => {
  try {
    const { title, category, date, time, venue, capacity, description, image_url, badge, price, status } = req.body;

    if (!title || !category || !date || !time || !venue || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, category, date, time, venue, and description.'
      });
    }

    const defaultImage = image_url && image_url.trim() !== '' 
      ? image_url 
      : '/assets/images/tech_summit.jpg';

    const created = db.createEvent({
      title,
      category,
      date,
      time,
      venue,
      capacity: Number(capacity) || 100,
      description,
      image_url: defaultImage,
      badge: badge || 'Featured',
      price: price || 'Free',
      status: status || 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      data: created
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create event.' });
  }
});

/**
 * PUT /api/admin/events/:id
 * Update an existing event
 */
router.put('/events/:id', (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const existing = db.getEventById(eventId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const { title, category, date, time, venue, capacity, description, image_url, badge, price, status } = req.body;

    const updated = db.updateEvent(eventId, {
      title: title || existing.title,
      category: category || existing.category,
      date: date || existing.date,
      time: time || existing.time,
      venue: venue || existing.venue,
      capacity: capacity !== undefined ? Number(capacity) : existing.capacity,
      description: description || existing.description,
      image_url: image_url || existing.image_url,
      badge: badge || existing.badge,
      price: price || existing.price,
      status: status || existing.status
    });

    res.json({
      success: true,
      message: 'Event updated successfully!',
      data: updated
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update event.' });
  }
});

/**
 * DELETE /api/admin/events/:id
 * Delete an event and cascading registrations
 */
router.delete('/events/:id', (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const existing = db.getEventById(eventId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const deleted = db.deleteEvent(eventId);
    if (deleted) {
      res.json({ success: true, message: `Event "${existing.title}" deleted successfully.` });
    } else {
      res.status(500).json({ success: false, message: 'Failed to delete event.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting event.' });
  }
});

/**
 * GET /api/admin/events/:id/participants
 * View all registered participants for a specific event
 */
router.get('/events/:id/participants', (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const event = db.getEventById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const participants = db.getRegistrationsByEvent(eventId);
    res.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        capacity: event.capacity,
        registered_count: event.registered_count
      },
      count: participants.length,
      data: participants
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load participants.' });
  }
});

/**
 * GET /api/admin/events/:id/participants/export
 * Download CSV file of participants for an event
 */
router.get('/events/:id/participants/export', (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const event = db.getEventById(eventId);
    if (!event) {
      return res.status(404).send('Event not found');
    }

    const participants = db.getRegistrationsByEvent(eventId);
    
    // Build CSV string
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
    const safeTitle = event.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="participants_${safeTitle}_${event.id}.csv"`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).send('Failed to export CSV');
  }
});

/**
 * DELETE /api/admin/registrations/:id
 * Remove / cancel a participant registration
 */
router.delete('/registrations/:id', (req, res) => {
  try {
    const regId = Number(req.params.id);
    const deleted = db.deleteRegistration(regId);
    if (deleted) {
      res.json({ success: true, message: 'Registration cancelled successfully.' });
    } else {
      res.status(404).json({ success: false, message: 'Registration not found.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel registration.' });
  }
});

module.exports = router;
