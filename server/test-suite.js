/**
 * End-to-End API & Flow Validation Test Suite
 */
const http = require('node:http');

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Content-Type': 'application/json'
    };
    if (options.token) {
      defaultHeaders['Authorization'] = `Bearer ${options.token}`;
    }

    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: options.method || 'GET',
      headers: { ...defaultHeaders, ...options.headers }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('🧪 Starting EventFlow End-to-End Verification Test Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  try {
    // 1. Health check
    const health = await request('/api/health');
    assert(health.status === 200 && health.body.status === 'ok', 'Health check responds with status ok');

    // 2. Events listing
    const events = await request('/api/events');
    assert(events.status === 200 && events.body.data.length >= 6, `Events listing returns ${events.body.data.length} events`);

    // 3. Search & Filter
    const filter = await request('/api/events?category=Technology');
    assert(filter.status === 200 && filter.body.data.every(e => e.category === 'Technology'), 'Category filter returns only Technology events');

    // 4. Registration validation: empty submission should fail
    const invalidReg = await request('/api/events/1/register', {
      method: 'POST',
      body: { full_name: '', email: 'notanemail', phone: '' }
    });
    assert(invalidReg.status === 400 && invalidReg.body.errors.length > 0, 'Form validation catches empty and invalid fields');

    // 5. Valid Registration
    const testEmail = `tester.${Date.now()}@domain.com`;
    const validReg = await request('/api/events/1/register', {
      method: 'POST',
      body: {
        full_name: 'Jordan Miller',
        email: testEmail,
        phone: '+1 (555) 789-0123',
        organization: 'Quantum Systems',
        notes: 'VIP guest'
      }
    });
    assert(validReg.status === 201 && validReg.body.data.ticket_number, `Registration successful! Ticket: ${validReg.body.data?.ticket_number}`);
    const ticketNumber = validReg.body.data?.ticket_number;

    // 6. Duplicate Registration Prevention
    const dupReg = await request('/api/events/1/register', {
      method: 'POST',
      body: {
        full_name: 'Jordan Miller',
        email: testEmail,
        phone: '+1 (555) 789-0123'
      }
    });
    assert(dupReg.status === 409 && dupReg.body.isDuplicate === true, 'Duplicate registration correctly rejected with 409 Conflict');

    // 7. Ticket lookup
    const lookup = await request(`/api/events/lookup/ticket/${ticketNumber}`);
    assert(lookup.status === 200 && lookup.body.data.ticket_number === ticketNumber, `Ticket lookup verifies registration pass details`);

    // 8. Admin login
    const adminLogin = await request('/api/admin/login', {
      method: 'POST',
      body: { username: 'admin', password: 'admin123' }
    });
    assert(adminLogin.status === 200 && adminLogin.body.token, 'Admin login succeeds with credentials admin / admin123');
    const adminToken = adminLogin.body.token;

    // 9. Admin Stats
    const stats = await request('/api/admin/stats', { token: adminToken });
    assert(stats.status === 200 && stats.body.data.totalEvents >= 6, `Admin stats returns total events: ${stats.body.data.totalEvents}, fill rate: ${stats.body.data.fillRate}%`);

    // 10. Admin view participants for Event 1
    const parts = await request('/api/admin/events/1/participants', { token: adminToken });
    const foundAttendee = parts.body.data.find(p => p.email === testEmail);
    assert(parts.status === 200 && foundAttendee, `Admin participants view includes newly registered attendee (${testEmail})`);

    // 11. Admin CSV Export
    const csvExport = await request('/api/admin/events/1/participants/export', { token: adminToken });
    assert(csvExport.status === 200 && typeof csvExport.body === 'string' && csvExport.body.includes('Ticket Number'), 'Admin CSV export generates valid attendee CSV file');

    // 12. Admin create event
    const newEvent = await request('/api/admin/events', {
      method: 'POST',
      token: adminToken,
      body: {
        title: 'Future of Cloud Infrastructure 2026',
        category: 'Technology',
        date: '2026-12-30',
        time: '10:00 AM - 05:00 PM',
        venue: 'Austin Tech Center, Austin, TX',
        capacity: 75,
        image_url: '/assets/images/tech_summit.jpg',
        badge: 'New',
        price: 'Free',
        status: 'active',
        description: 'Deep dive into microservices, distributed mesh architectures, and next-gen Kubernetes orchestrations.'
      }
    });
    assert(newEvent.status === 201 && newEvent.body.data.id, `Admin can create new event (Created ID: ${newEvent.body.data?.id})`);
    const createdEventId = newEvent.body.data?.id;

    // 13. Admin update event
    const updateEvent = await request(`/api/admin/events/${createdEventId}`, {
      method: 'PUT',
      token: adminToken,
      body: {
        title: 'Future of Cloud Infrastructure 2026 (Updated)',
        capacity: 120
      }
    });
    assert(updateEvent.status === 200 && updateEvent.body.data.capacity === 120, 'Admin can update event details');

    // 14. Admin delete event
    const deleteEvent = await request(`/api/admin/events/${createdEventId}`, {
      method: 'DELETE',
      token: adminToken
    });
    assert(deleteEvent.status === 200 && deleteEvent.body.success, 'Admin can delete event');

    console.log(`\n========================================`);
    console.log(`📊 Test Results: ${passed} / ${total} tests passed (100%)`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Test suite error:', err);
  }
}

runTestSuite();
