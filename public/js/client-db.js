/**
 * EventFlow — Client-Side Database Engine
 * Enables 100% full functionality when deployed statically to GitHub Pages
 * with identical validation, duplicate prevention, ticket generation, and admin management.
 */

(function(window) {
  const SEED_EVENTS = [
    {
      id: 1,
      title: 'Global AI & Tech Summit 2026',
      category: 'Technology',
      date: '2026-11-20',
      time: '09:00 AM - 05:00 PM',
      venue: 'Metropolis Convention Center, Hall A, San Francisco, CA',
      capacity: 150,
      description: 'Join industry pioneers, AI researchers, and engineering leaders for an immersive summit exploring Next-Gen Artificial Intelligence, autonomous agents, and neural architectures.',
      image_url: './assets/images/tech_summit.jpg',
      badge: 'Featured',
      price: 'Free',
      status: 'active'
    },
    {
      id: 2,
      title: 'Euphoria Neon Music Festival',
      category: 'Music & Arts',
      date: '2026-11-28',
      time: '06:00 PM - 01:00 AM',
      venue: 'Sunset Arena & Open Amphitheater, Austin, TX',
      capacity: 250,
      description: 'An electrifying night celebrating indie electronic beats, live synth performances, holographic laser installations, and artisan food trucks under the stars.',
      image_url: './assets/images/music_festival.jpg',
      badge: 'Trending',
      price: 'Free',
      status: 'active'
    },
    {
      id: 3,
      title: 'UX & Product Design Masterclass Jam',
      category: 'Design',
      date: '2026-12-05',
      time: '10:00 AM - 04:00 PM',
      venue: 'SoHo Innovation Loft & Studios, New York, NY',
      capacity: 45,
      description: 'A high-octane collaborative workshop for product designers, UX researchers, and creative technologists. Dive deep into design systems and micro-interactions.',
      image_url: './assets/images/design_jam.jpg',
      badge: 'Workshop',
      price: 'Free',
      status: 'active'
    },
    {
      id: 4,
      title: 'Global Venture Pitch & Startup Summit',
      category: 'Business',
      date: '2026-12-12',
      time: '01:00 PM - 07:00 PM',
      venue: 'Skyline Financial Center, 42nd Floor, Chicago, IL',
      capacity: 100,
      description: 'Where visionary startup founders meet top venture capitalists and angel syndicates. 12 disruptive companies pitch live on stage followed by matchmaking.',
      image_url: './assets/images/startup_summit.jpg',
      badge: 'High Demand',
      price: 'Free',
      status: 'active'
    },
    {
      id: 5,
      title: 'Cybersecurity & Zero-Trust Defense Expo',
      category: 'Technology',
      date: '2026-12-18',
      time: '11:00 AM - 04:30 PM',
      venue: 'Cyber Innovation Lab, MIT Campus, Cambridge, MA',
      capacity: 80,
      description: 'A high-stakes practical masterclass on threat modeling, zero-trust cloud perimeter defense, and automated threat hunting.',
      image_url: './assets/images/tech_summit.jpg',
      badge: 'Masterclass',
      price: 'Free',
      status: 'active'
    },
    {
      id: 6,
      title: 'Creative Web & Motion Graphics Workshop',
      category: 'Workshops',
      date: '2026-12-22',
      time: '02:00 PM - 06:30 PM',
      venue: 'Pioneer Square Creative Center, Seattle, WA',
      capacity: 60,
      description: 'Master the art of 60fps web animations, Three.js 3D canvas rendering, and dynamic micro-interactions.',
      image_url: './assets/images/design_jam.jpg',
      badge: 'Interactive',
      price: 'Free',
      status: 'active'
    }
  ];

  const SEED_PARTICIPANTS = [
    {
      id: 1,
      event_id: 1,
      ticket_number: 'EVT-2026-1-J8PQ5',
      full_name: 'Elena Rostova',
      email: 'elena.rostova@deeptech.io',
      phone: '+1 (415) 555-0192',
      organization: 'DeepTech Innovations',
      notes: 'Interested in AI research roundtables',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 2,
      event_id: 1,
      ticket_number: 'EVT-2026-1-66SJN',
      full_name: 'Marcus Chen',
      email: 'marcus.chen@stanford.edu',
      phone: '+1 (650) 555-0143',
      organization: 'Stanford AI Lab',
      notes: 'Keynote speaker guest',
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 3,
      event_id: 2,
      ticket_number: 'EVT-2026-2-XUKCG',
      full_name: 'Liam Vance',
      email: 'liam.vance@musicflow.com',
      phone: '+1 (512) 555-0129',
      organization: 'MusicFlow Records',
      notes: 'Artist guest list',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString()
    }
  ];

  function getStoredEvents() {
    try {
      const data = localStorage.getItem('eventflow_client_events');
      if (data) return JSON.parse(data);
    } catch (e) {}
    localStorage.setItem('eventflow_client_events', JSON.stringify(SEED_EVENTS));
    return SEED_EVENTS;
  }

  function saveStoredEvents(events) {
    localStorage.setItem('eventflow_client_events', JSON.stringify(events));
  }

  function getStoredRegistrations() {
    try {
      const data = localStorage.getItem('eventflow_client_registrations');
      if (data) return JSON.parse(data);
    } catch (e) {}
    localStorage.setItem('eventflow_client_registrations', JSON.stringify(SEED_PARTICIPANTS));
    return SEED_PARTICIPANTS;
  }

  function saveStoredRegistrations(regs) {
    localStorage.setItem('eventflow_client_registrations', JSON.stringify(regs));
  }

  function generateTicketId(eventId) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 5; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
    return `EVT-2026-${eventId}-${rand}`;
  }

  const ClientDB = {
    isStaticMode: () => {
      return window.location.hostname.includes('github.io') || 
             window.location.protocol === 'file:' || 
             window.__FORCE_CLIENT_DB__ === true;
    },

    getEvents: ({ category, search, sort } = {}) => {
      let events = getStoredEvents();
      const regs = getStoredRegistrations();

      // Attach dynamic registered_count and seats_left
      events = events.map(e => {
        const count = regs.filter(r => r.event_id === e.id).length;
        const seatsLeft = Math.max(0, e.capacity - count);
        // Normalize image paths for GitHub Pages subfolder
        let img = e.image_url;
        if (img.startsWith('/assets/')) img = '.' + img;
        return { ...e, image_url: img, registered_count: count, seats_left: seatsLeft };
      });

      if (category && category !== 'All') {
        events = events.filter(e => e.category.toLowerCase() === category.toLowerCase());
      }

      if (search && search.trim() !== '') {
        const term = search.trim().toLowerCase();
        events = events.filter(e => 
          e.title.toLowerCase().includes(term) || 
          e.venue.toLowerCase().includes(term) || 
          e.description.toLowerCase().includes(term)
        );
      }

      if (sort === 'popularity') {
        events.sort((a, b) => b.registered_count - a.registered_count);
      } else if (sort === 'date-desc') {
        events.sort((a, b) => b.date.localeCompare(a.date));
      } else {
        events.sort((a, b) => a.date.localeCompare(b.date));
      }

      return events;
    },

    getEventById: (id) => {
      const events = ClientDB.getEvents();
      return events.find(e => e.id === Number(id)) || null;
    },

    register: ({ event_id, full_name, email, phone, organization, notes }) => {
      const event = ClientDB.getEventById(event_id);
      if (!event) throw new Error('Event not found');
      if (event.status !== 'active') throw new Error('Event is not currently active');
      if (event.seats_left <= 0) throw new Error('Sorry, this event is already fully booked!');

      const regs = getStoredRegistrations();
      const existing = regs.find(r => r.event_id === Number(event_id) && r.email.toLowerCase() === email.trim().toLowerCase());
      if (existing) {
        const err = new Error(`You are already registered for "${event.title}" with email ${email.trim()}. Your Ticket ID is ${existing.ticket_number}.`);
        err.isDuplicate = true;
        err.ticketNumber = existing.ticket_number;
        throw err;
      }

      const ticketNumber = generateTicketId(event_id);
      const newReg = {
        id: Date.now(),
        event_id: Number(event_id),
        ticket_number: ticketNumber,
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        organization: (organization || '').trim(),
        notes: (notes || '').trim(),
        created_at: new Date().toISOString()
      };

      regs.unshift(newReg);
      saveStoredRegistrations(regs);

      return {
        ...newReg,
        event_title: event.title,
        event_date: event.date,
        event_time: event.time,
        event_venue: event.venue,
        event_category: event.category
      };
    },

    lookupTicket: (ticketNumber) => {
      const regs = getStoredRegistrations();
      const reg = regs.find(r => r.ticket_number.toLowerCase() === ticketNumber.trim().toLowerCase());
      if (!reg) return null;
      const event = ClientDB.getEventById(reg.event_id);
      return {
        ...reg,
        event_title: event ? event.title : 'Event',
        event_date: event ? event.date : '',
        event_time: event ? event.time : '',
        event_venue: event ? event.venue : ''
      };
    },

    lookupEmail: (email) => {
      const regs = getStoredRegistrations();
      const list = regs.filter(r => r.email.toLowerCase() === email.trim().toLowerCase());
      return list.map(r => {
        const event = ClientDB.getEventById(r.event_id);
        return {
          ...r,
          event_title: event ? event.title : 'Event',
          event_date: event ? event.date : '',
          event_time: event ? event.time : '',
          event_venue: event ? event.venue : ''
        };
      });
    },

    getStats: () => {
      const events = ClientDB.getEvents();
      const regs = getStoredRegistrations();
      const totalCapacity = events.reduce((acc, e) => acc + e.capacity, 0);
      return {
        totalEvents: events.length,
        activeEvents: events.filter(e => e.status === 'active').length,
        totalRegistrations: regs.length,
        totalCapacity,
        fillRate: totalCapacity > 0 ? Math.round((regs.length / totalCapacity) * 100) : 0
      };
    },

    saveEvent: (eventData, id = null) => {
      let events = getStoredEvents();
      if (id) {
        events = events.map(e => e.id === Number(id) ? { ...e, ...eventData, id: Number(id) } : e);
      } else {
        const newId = events.length > 0 ? Math.max(...events.map(e => e.id)) + 1 : 1;
        events.push({ ...eventData, id: newId });
      }
      saveStoredEvents(events);
      return true;
    },

    deleteEvent: (id) => {
      let events = getStoredEvents();
      events = events.filter(e => e.id !== Number(id));
      saveStoredEvents(events);

      let regs = getStoredRegistrations();
      regs = regs.filter(r => r.event_id !== Number(id));
      saveStoredRegistrations(regs);
      return true;
    },

    getParticipants: (eventId) => {
      const regs = getStoredRegistrations();
      return regs.filter(r => r.event_id === Number(eventId));
    },

    deleteRegistration: (id) => {
      let regs = getStoredRegistrations();
      regs = regs.filter(r => r.id !== Number(id));
      saveStoredRegistrations(regs);
      return true;
    }
  };

  window.ClientDB = ClientDB;
})(window);
