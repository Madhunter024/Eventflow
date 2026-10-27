require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');

// Ensure database has initial data if empty
const { db, getEvents } = require('./db');
const { seedDatabase } = require('./seed');

const eventsCount = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
if (eventsCount === 0) {
  console.log('No events found in database. Seeding initial event data...');
  seedDatabase();
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// API Routes
const eventsRouter = require('./routes/events');
const adminRouter = require('./routes/admin');

app.use('/api/events', eventsRouter);
app.use('/api/admin', adminRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Event Registration System'
  });
});

// Admin shortcut route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin.html'));
});

// Catch-all route for frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log('==================================================');
  console.log(`✨ Event Registration Platform is live!`);
  console.log(`🌐 Public App:      http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`🛡️  Admin Dashboard: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/admin`);
  console.log(`📡 API Base:        http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api/events`);
  console.log('==================================================');
});

module.exports = { app, server };
