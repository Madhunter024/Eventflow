const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper: Basic email validation
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

/**
 * GET /api/events
 * List all events with optional filters (category, search, sort)
 */
router.get('/', (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const events = db.getEvents({ category, search, sort });
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, message: 'Failed to load events.' });
  }
});

/**
 * GET /api/events/categories
 * Get list of all distinct event categories
 */
router.get('/meta/categories', (req, res) => {
  try {
    const events = db.getEvents();
    const categories = Array.from(new Set(events.map(e => e.category)));
    res.json({ success: true, data: ['All', ...categories] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load categories.' });
  }
});

/**
 * GET /api/events/:id
 * Get single event details with real-time seat availability
 */
router.get('/:id', (req, res) => {
  try {
    const event = db.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ success: false, message: 'Failed to load event details.' });
  }
});

/**
 * POST /api/events/:id/register
 * User registration with validation and duplicate prevention
 */
router.post('/:id/register', (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const { full_name, email, phone, organization, notes } = req.body;

    // Form Validations
    const errors = [];
    if (!full_name || full_name.trim().length < 2) {
      errors.push('Full name is required (at least 2 characters).');
    }
    if (!email || !isValidEmail(email)) {
      errors.push('A valid email address is required.');
    }
    if (!phone || phone.trim().length < 7) {
      errors.push('A valid phone number is required (at least 7 characters).');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join(' '),
        errors
      });
    }

    // Attempt registration
    const registration = db.registerParticipant({
      event_id: eventId,
      full_name,
      email,
      phone,
      organization,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your digital ticket is ready.',
      data: registration
    });
  } catch (error) {
    if (error.code === 'DUPLICATE_REGISTRATION') {
      return res.status(409).json({
        success: false,
        message: error.message,
        isDuplicate: true,
        ticketNumber: error.ticketNumber
      });
    }

    if (error.message.includes('fully booked')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        isSoldOut: true
      });
    }

    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed due to a server error. Please try again.'
    });
  }
});

/**
 * GET /api/registrations/ticket/:ticketNumber
 * Lookup registration pass by ticket number
 */
router.get('/lookup/ticket/:ticketNumber', (req, res) => {
  try {
    const registration = db.getRegistrationByTicket(req.params.ticketNumber);
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Ticket not found. Please verify the ticket ID.' });
    }
    res.json({ success: true, data: registration });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to find ticket.' });
  }
});

/**
 * GET /api/registrations/lookup/email?email=...
 * Lookup all registrations by email address
 */
router.get('/lookup/email', (req, res) => {
  try {
    const email = req.query.email;
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email.' });
    }
    const registrations = db.getRegistrationsByEmail(email);
    res.json({ success: true, count: registrations.length, data: registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to look up tickets.' });
  }
});

module.exports = router;
