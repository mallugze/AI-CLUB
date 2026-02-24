# ⚡ AI Club — Event Management Platform

A full-stack web app for managing AI Club events, teams, scoring, and leaderboards. Built with a futuristic AI aesthetic.

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Router v6 |
| Backend | Node.js + Express |
| Database | SQLite (via `better-sqlite3`) |
| Auth | JWT + bcryptjs |
| UI Theme | Orbitron + Exo 2 fonts, dark AI aesthetic |

---

## 🚀 Setup & Run

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # Edit JWT_SECRET
node server.js              # Starts on port 5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start                   # Starts on port 3000
```

> The frontend proxies API calls to `localhost:5000` automatically.

---

## 👥 User Roles

| Role | Permissions |
|------|------------|
| **Admin** (Committee) | Create/edit/delete events, assign scores, manage all teams |
| **Member** | View events, register teams (2–4 members), view leaderboards |

> To create an admin account, select **Admin** role during registration.

---

## 📋 Features

### Events
- ✅ Admins create, edit, delete events (title, description, date, venue, status)
- ✅ Members view all events with team count

### Teams
- ✅ Any user can register a team for an event
- ✅ Team size: **minimum 2, maximum 4** members
- ✅ Same team can register for multiple events
- ✅ Multiple teams per event (no limit)

### Scoring
- ✅ Admins assign scores (0–10, decimal allowed) with optional feedback note
- ✅ Scores can be updated (upsert)
- ✅ Only admins can score teams

### Leaderboards
- ✅ **Per-event leaderboard** — ranked teams for a specific event
- ✅ **Overall club leaderboard** — top teams across all events
- ✅ **Team history** — all event scores for a specific team

### UI / UX
- ✅ Futuristic dark AI theme (Orbitron font, neon cyan/purple)
- ✅ Animated scanline, floating orbs, glowing cards
- ✅ Animated score bars, medal ranks (🥇🥈🥉)
- ✅ Role-based UI (admin controls only visible to admins)
- ✅ Responsive grid layout

---

## 📁 Project Structure

```
ai-club/
├── backend/
│   ├── server.js          # All API routes + SQLite setup
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── public/index.html
    ├── src/
    │   ├── App.js
    │   ├── index.js
    │   ├── index.css          # AI theme styles
    │   ├── api.js             # Axios API calls
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── components/
    │   │   └── Navbar.js
    │   └── pages/
    │       ├── AuthPage.js        # Login / Register
    │       ├── EventsPage.js      # Events listing
    │       ├── EventDetailPage.js # Teams + scoring + leaderboard
    │       └── LeaderboardPage.js # Overall club leaderboard
    └── package.json
```

---

## 🗄️ Database Schema

- **users** — id, name, email, password (hashed), role
- **events** — id, title, description, date, venue, status, created_by
- **teams** — id, name, event_id, created_by
- **team_members** — team_id, user_id
- **scores** — team_id, event_id, score (0–10), note, assigned_by

---

## 💡 Additional Features Included

- Score with feedback notes from admin
- Team history modal (see all past event scores for a team)
- Event status tags: `upcoming`, `active`, `completed`
- Animated leaderboard with rank medals
- Scanline animation + floating orbs for AI aesthetic

---

## 🔒 Security Notes

- Change `JWT_SECRET` in `.env` before production
- Passwords are hashed with bcrypt (salt rounds: 10)
- Role check middleware (`adminOnly`) on all sensitive routes
- JWT expires in 7 days
