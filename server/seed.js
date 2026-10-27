const { db, createEvent, registerParticipant } = require('./db');

function seedDatabase() {
  console.log('--- Initializing & Seeding Event Database ---');

  // Clear existing records to ensure fresh state
  db.exec('DELETE FROM registrations;');
  db.exec('DELETE FROM events;');
  db.exec("DELETE FROM sqlite_sequence WHERE name='events' OR name='registrations';");

  const sampleEvents = [
    {
      title: 'Global AI & Tech Summit 2026',
      category: 'Technology',
      date: '2026-11-20',
      time: '09:00 AM - 05:00 PM',
      venue: 'Metropolis Convention Center, Hall A, San Francisco, CA',
      capacity: 150,
      description: 'Join industry pioneers, AI researchers, and engineering leaders for an immersive summit exploring Next-Gen Artificial Intelligence, autonomous agents, and neural architectures. Features keynote panels, hands-on lab sessions, and exclusive networking.',
      image_url: '/assets/images/tech_summit.jpg',
      badge: 'Featured',
      price: 'Free',
      status: 'active'
    },
    {
      title: 'Euphoria Neon Music Festival',
      category: 'Music & Arts',
      date: '2026-11-28',
      time: '06:00 PM - 01:00 AM',
      venue: 'Sunset Arena & Open Amphitheater, Austin, TX',
      capacity: 250,
      description: 'An electrifying night celebrating indie electronic beats, live synth performances, holographic laser installations, and artisan food trucks under the stars. Featuring internationally renowned DJs and rising indie performers.',
      image_url: '/assets/images/music_festival.jpg',
      badge: 'Trending',
      price: 'Free',
      status: 'active'
    },
    {
      title: 'UX & Product Design Masterclass Jam',
      category: 'Design',
      date: '2026-12-05',
      time: '10:00 AM - 04:00 PM',
      venue: 'SoHo Innovation Loft & Studios, New York, NY',
      capacity: 45,
      description: 'A high-octane collaborative workshop for product designers, UX researchers, and creative technologists. Dive deep into design systems, accessible user journeys, and micro-interaction prototypes with feedback from industry leaders.',
      image_url: '/assets/images/design_jam.jpg',
      badge: 'Workshop',
      price: 'Free',
      status: 'active'
    },
    {
      title: 'Global Venture Pitch & Startup Summit',
      category: 'Business',
      date: '2026-12-12',
      time: '01:00 PM - 07:00 PM',
      venue: 'Skyline Financial Center, 42nd Floor, Chicago, IL',
      capacity: 100,
      description: 'Where visionary startup founders meet top venture capitalists and angel syndicates. 12 disruptive seed and Series-A stage companies pitch live on stage, followed by closed-door investor matchmaking and rooftop drinks.',
      image_url: '/assets/images/startup_summit.jpg',
      badge: 'High Demand',
      price: 'Free',
      status: 'active'
    },
    {
      title: 'Cybersecurity & Zero-Trust Defense Expo',
      category: 'Technology',
      date: '2026-12-18',
      time: '11:00 AM - 04:30 PM',
      venue: 'Cyber Innovation Lab, MIT Campus, Cambridge, MA',
      capacity: 80,
      description: 'A high-stakes practical masterclass on threat modeling, zero-trust cloud perimeter defense, and AI-driven automated threat hunting. Features live red-team vs blue-team attack-and-defend drills.',
      image_url: '/assets/images/tech_summit.jpg',
      badge: 'Masterclass',
      price: 'Free',
      status: 'active'
    },
    {
      title: 'Creative Web & Motion Graphics Workshop',
      category: 'Workshops',
      date: '2026-12-22',
      time: '02:00 PM - 06:30 PM',
      venue: 'Pioneer Square Creative Center, Seattle, WA',
      capacity: 60,
      description: 'Master the art of 60fps web animations, Three.js 3D canvas rendering, and dynamic micro-interactions. Bring your laptop and build a stunning portfolio experience alongside award-winning frontend engineers.',
      image_url: '/assets/images/design_jam.jpg',
      badge: 'Interactive',
      price: 'Free',
      status: 'active'
    }
  ];

  const createdEvents = [];
  for (const evt of sampleEvents) {
    const created = createEvent(evt);
    createdEvents.push(created);
    console.log(`Created event: ${created.title} (ID: ${created.id})`);
  }

  // Seed sample participants
  const sampleParticipants = [
    {
      event_id: createdEvents[0].id,
      full_name: 'Elena Rostova',
      email: 'elena.rostova@deeptech.io',
      phone: '+1 (415) 555-0192',
      organization: 'DeepTech Innovations',
      notes: 'Interested in AI research roundtables'
    },
    {
      event_id: createdEvents[0].id,
      full_name: 'Marcus Chen',
      email: 'marcus.chen@stanford.edu',
      phone: '+1 (650) 555-0143',
      organization: 'Stanford AI Lab',
      notes: 'Keynote speaker guest'
    },
    {
      event_id: createdEvents[0].id,
      full_name: 'Sophia Patel',
      email: 'sophia@cloudscale.net',
      phone: '+1 (408) 555-0178',
      organization: 'CloudScale Inc',
      notes: 'VIP Access'
    },
    {
      event_id: createdEvents[1].id,
      full_name: 'Liam Vance',
      email: 'liam.vance@musicflow.com',
      phone: '+1 (512) 555-0129',
      organization: 'MusicFlow Records',
      notes: 'Artist guest list'
    },
    {
      event_id: createdEvents[1].id,
      full_name: 'Aria Montgomery',
      email: 'aria.m@audiophile.org',
      phone: '+1 (512) 555-0187',
      organization: 'Independent',
      notes: 'Early entry request'
    },
    {
      event_id: createdEvents[2].id,
      full_name: 'Devon Hayes',
      email: 'devon@pixelcraft.design',
      phone: '+1 (212) 555-0198',
      organization: 'Pixelcraft Studio',
      notes: 'Bringing Figma prototype to critique'
    },
    {
      event_id: createdEvents[3].id,
      full_name: 'Alexander Wright',
      email: 'alex@apexventures.vc',
      phone: '+1 (312) 555-0165',
      organization: 'Apex Ventures',
      notes: 'Looking for Series-A deals in AI infrastructure'
    }
  ];

  for (const part of sampleParticipants) {
    const reg = registerParticipant(part);
    console.log(`Registered: ${reg.full_name} for "${reg.event_title}" -> Ticket: ${reg.ticket_number}`);
  }

  console.log('--- Database seeding completed successfully! ---');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
