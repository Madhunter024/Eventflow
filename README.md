# ⚡ EventFlow — Full-Stack Event Registration & Management Platform

A modern, functional, and visually stunning full-stack application for discovering events, registering attendees with instant digital passes, and managing events via an administrator dashboard.

---

## ✨ Features

### 🌟 1. User & Event Exploration
* **Curated Event Listings:** Real-time event cards with high-resolution imagery, date, time, venue, description, and status tags.
* **Instant Search & Category Filtering:** Live multi-category filtering (`Technology`, `Music & Arts`, `Design`, `Business`, `Workshops`) and keyword search.
* **Real-time Capacity Progress:** Dynamic seat availability meters showing remaining seats, percentage filled, and "Sold Out" state handling.
* **Modern Dark/Light Themes:** Built-in sleek dark theme with glowing violet/indigo glassmorphism and one-click light theme switch.

### 📝 2. Registration & Duplicate Prevention
* **Real-Time Client & Server Validation:** Form validation for full name, email syntax, phone format, and optional organization/notes.
* **Duplicate Registration Prevention:** Database-enforced `UNIQUE(event_id, email)` constraint preventing duplicate registrations. Returns existing Ticket ID if duplicate attempt occurs.
* **Instant Digital Ticket Pass:** Confetti burst and high-tech scannable boarding pass modal displaying attendee name, venue, date, and unique Ticket ID (e.g. `EVT-2026-1-X8K9M`).
* **Download & Calendar Integration:** One-click pass printing/PDF save and downloadable `.ics` calendar file for Google Calendar, Apple Calendar, and Outlook.
* **Ticket Pass Lookup:** Attendees can look up, view, and reprint their tickets anytime by entering their Ticket ID or email.

### 🛡️ 3. Admin Management Dashboard
* **Secure Authentication:** Administrator portal login with one-click demo credentials autofill (`admin` / `admin123`).
* **Live Analytics Summary:** Real-time metric cards for Total Events, Total Registrations, Capacity Utilization Fill Rate (%), and Active Events.
* **Full CRUD Operations:** Create new events, edit details (dates, venues, capacities, banner images, status), and delete events.
* **Participant Rosters:** Dedicated drawer/modal to inspect registered attendees for each event with contact information, registration timestamps, and attendee notes.
* **CSV Export:** One-click attendee roster export to `.csv` format for on-site check-in and records.
* **Attendee Registration Management:** Cancel/remove attendee bookings with instant seat recalculation.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Backend** | Node.js & Express.js | Clean RESTful API, CORS, centralized error handling |
| **Database** | SQLite via `node:sqlite` | Native Node 26 synchronous relational database with zero external compilation headaches |
| **Frontend** | HTML5, CSS3, Vanilla JS | Glassmorphic design system, CSS variables, zero runtime framework bloat |
| **Typography**| Google Fonts | *Plus Jakarta Sans* |

---

## 📁 Project Structure

```
event-registration-app/
├── server/
│   ├── db.js                 # SQLite connection, tables, indices, and queries
│   ├── seed.js               # Database seed script with 6 vibrant events & participants
│   ├── server.js             # Express application entry point & static server
│   ├── test-suite.js         # Automated end-to-end test suite (14/14 tests)
│   ├── middleware/
│   │   └── auth.js           # Admin authentication middleware
│   └── routes/
│       ├── events.js         # Public event browsing, registration, and pass lookup
│       └── admin.js          # Admin dashboard analytics, CRUD, and roster export
├── public/
│   ├── index.html            # Main public event explorer and registration UI
│   ├── admin.html            # Admin management dashboard & login
│   ├── css/
│   │   ├── style.css         # Glassmorphic CSS design system, dark/light theme
│   │   └── admin.css         # Admin table, metrics, and participant drawer styles
│   ├── js/
│   │   ├── app.js            # Public frontend logic: filtering, modals, tickets, toasts
│   │   └── admin.js          # Admin dashboard logic: auth, CRUD, attendee roster, CSV
│   └── assets/
│       └── images/           # High-resolution event banners
├── data/
│   └── events.db             # SQLite database file (created automatically)
├── .env.example              # Environment variables template
├── package.json              # Project scripts and dependencies
└── README.md                 # Complete documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have **Node.js (v20+ or v22+)** and **npm** installed:
```bash
node -v
npm -v
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Seed Database (Optional - Runs automatically on first startup)
```bash
npm run seed
```

### 4. Start the Application Server
```bash
npm start
```
The server will start at:
* 🌐 **Public Website:** [http://localhost:3000](http://localhost:3000)
* 🛡️ **Admin Portal:** [http://localhost:3000/admin](http://localhost:3000/admin)
* 📡 **Health Check:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

### 5. Run Automated Verification Tests
Run the built-in end-to-end test suite:
```bash
npm test
```
All 14 tests will execute, validating health check, event listings, form validation, duplicate prevention, ticket lookup, admin auth, CRUD, attendee rosters, and CSV export.

---

## 🔐 Admin Credentials

| Field | Default Value |
| :--- | :--- |
| **Username** | `admin` |
| **Password** | `admin123` |
| **Quick Login** | Click the **"💡 Quick Demo Login"** button on the login modal to auto-fill credentials |

---

## 📡 REST API Reference

### Public Endpoints (`/api/events`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/events` | List all events (supports `?category=...&search=...&sort=...`) |
| `GET` | `/api/events/:id` | Get details and remaining seats for a specific event |
| `POST`| `/api/events/:id/register` | Register an attendee with duplicate email check & pass generation |
| `GET` | `/api/events/lookup/ticket/:ticketNumber` | Look up a registration pass by Ticket ID |
| `GET` | `/api/events/lookup/email?email=...` | Look up all passes associated with an email |

### Admin Endpoints (`/api/admin`) *(Requires Bearer Token)*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/admin/login` | Authenticate admin credentials and receive bearer token |
| `GET` | `/api/admin/stats` | Retrieve total events, registrations, fill rate, and capacity |
| `GET` | `/api/admin/events` | List all events with detailed participant counters |
| `POST` | `/api/admin/events` | Create a new event |
| `PUT` | `/api/admin/events/:id` | Update an existing event |
| `DELETE`| `/api/admin/events/:id` | Delete an event and cascade-remove registrations |
| `GET` | `/api/admin/events/:id/participants` | Retrieve participant roster for an event |
| `GET` | `/api/admin/events/:id/participants/export` | Download attendee roster as CSV file |
| `DELETE`| `/api/admin/registrations/:id` | Cancel/remove an attendee registration |

---

## ☁️ Deployment Guide

This app has a single unified Node/Express backend that directly serves the static frontend, making deployment effortless:

### Deploying to Render.com
1. Push this project to a GitHub repository.
2. Sign in to [Render](https://render.com) and create a **New Web Service**.
3. Select your repository.
4. Set:
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
5. Click **Deploy Web Service**. Render will generate a live HTTPS URL.

### Deploying to Railway.app
1. Create a project in [Railway](https://railway.app).
2. Connect your GitHub repository.
3. Railway automatically detects `package.json` and runs `npm install && npm start`.
4. Add a public networking domain under Settings.

---

## 📄 License
This project is open-source under the MIT License.
