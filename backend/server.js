require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'ai_club_secret_key_change_in_production';

const SUPER_ADMIN_EMAIL = 'mallug@gmail.com';
const SUPER_ADMIN_PASSWORD = 'yokoso20';
const SUPER_ADMIN_NAME = 'Mallug';

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const query = (sql, params = []) => pool.query(sql, params);

const initDB = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      venue TEXT,
      status TEXT DEFAULT 'upcoming',
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      event_id INTEGER NOT NULL,
      created_by INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS team_members (
      id SERIAL PRIMARY KEY,
      team_id INTEGER NOT NULL,
      user_id INTEGER,
      member_name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS scores (
      id SERIAL PRIMARY KEY,
      team_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      score REAL NOT NULL,
      note TEXT,
      assigned_by INTEGER,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      venue TEXT,
      total_seats INTEGER NOT NULL,
      status TEXT DEFAULT 'open',
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      activity_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(activity_id, user_id)
    );
  `);

  const hash = bcrypt.hashSync(SUPER_ADMIN_PASSWORD, 10);
  await query(
    `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'admin') ON CONFLICT (email) DO NOTHING`,
    [SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, hash]
  );
  console.log('Database ready!');
};

initDB().catch(console.error);

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  next();
};

const superAdminOnly = (req, res, next) => {
  if (req.user.email !== SUPER_ADMIN_EMAIL) return res.status(403).json({ error: 'Super admin only' });
  next();
};

// AUTH
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (email === SUPER_ADMIN_EMAIL) return res.status(400).json({ error: 'Email already exists' });
  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = await query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hash, 'member']
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// USERS
app.get('/api/users', auth, async (req, res) => {
  const result = await query('SELECT id, name, email, role, created_at FROM users ORDER BY name');
  res.json(result.rows);
});

app.put('/api/users/:id/role', auth, superAdminOnly, async (req, res) => {
  const { role } = req.body;
  const target = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  if (!target.rows[0]) return res.status(404).json({ error: 'User not found' });
  if (target.rows[0].email === SUPER_ADMIN_EMAIL) return res.status(400).json({ error: 'Cannot change super admin role' });
  if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  await query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
  res.json({ success: true });
});

// EVENTS
app.get('/api/events', auth, async (req, res) => {
  const result = await query(`
    SELECT e.*, u.name as creator_name,
    (SELECT COUNT(*) FROM teams t WHERE t.event_id = e.id) as team_count
    FROM events e LEFT JOIN users u ON e.created_by = u.id
    ORDER BY e.date DESC
  `);
  res.json(result.rows);
});

app.post('/api/events', auth, adminOnly, async (req, res) => {
  const { title, description, date, venue } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Title and date required' });
  const result = await query(
    'INSERT INTO events (title, description, date, venue, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [title, description, date, venue, req.user.id]
  );
  res.json(result.rows[0]);
});

app.put('/api/events/:id', auth, adminOnly, async (req, res) => {
  const { title, description, date, venue, status } = req.body;
  await query('UPDATE events SET title=$1, description=$2, date=$3, venue=$4, status=$5 WHERE id=$6',
    [title, description, date, venue, status, req.params.id]);
  res.json({ success: true });
});

app.delete('/api/events/:id', auth, adminOnly, async (req, res) => {
  await query('DELETE FROM events WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// TEAMS
app.get('/api/events/:eventId/teams', auth, async (req, res) => {
  const result = await query(`
    SELECT t.*, u.name as creator_name, s.score,
    (SELECT STRING_AGG(tm.member_name, '|') FROM team_members tm WHERE tm.team_id = t.id) as member_names
    FROM teams t
    LEFT JOIN users u ON t.created_by = u.id
    LEFT JOIN scores s ON s.team_id = t.id AND s.event_id = t.event_id
    WHERE t.event_id = $1
    ORDER BY s.score DESC NULLS LAST
  `, [req.params.eventId]);
  res.json(result.rows);
});

app.post('/api/events/:eventId/teams', auth, async (req, res) => {
  const { name, memberNames } = req.body;
  const eventId = parseInt(req.params.eventId);
  if (!name) return res.status(400).json({ error: 'Team name required' });
  if (req.user.role === 'admin') return res.status(403).json({ error: 'Admins cannot register teams' });
  const extraMembers = (memberNames || []).filter(m => m.trim() !== '');
  const totalCount = 1 + extraMembers.length;
  if (totalCount < 2) return res.status(400).json({ error: 'Minimum 2 members required' });
  if (totalCount > 4) return res.status(400).json({ error: 'Maximum 4 members allowed' });
  const teamResult = await query(
    'INSERT INTO teams (name, event_id, created_by) VALUES ($1, $2, $3) RETURNING id',
    [name, eventId, req.user.id]
  );
  const teamId = teamResult.rows[0].id;
  await query('INSERT INTO team_members (team_id, user_id, member_name) VALUES ($1, $2, $3)', [teamId, req.user.id, req.user.name]);
  for (const mname of extraMembers) {
    await query('INSERT INTO team_members (team_id, user_id, member_name) VALUES ($1, $2, $3)', [teamId, 0, mname.trim()]);
  }
  res.json({ id: teamId, name, event_id: eventId });
});

app.delete('/api/teams/:id', auth, async (req, res) => {
  const team = await query('SELECT * FROM teams WHERE id = $1', [req.params.id]);
  if (!team.rows[0]) return res.status(404).json({ error: 'Team not found' });
  if (team.rows[0].created_by !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not allowed' });
  }
  await query('DELETE FROM team_members WHERE team_id = $1', [req.params.id]);
  await query('DELETE FROM scores WHERE team_id = $1', [req.params.id]);
  await query('DELETE FROM teams WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// SCORES
app.post('/api/scores', auth, adminOnly, async (req, res) => {
  const { teamId, eventId, score, note } = req.body;
  if (score < 0 || score > 10) return res.status(400).json({ error: 'Score must be 0-10' });
  const existing = await query('SELECT id FROM scores WHERE team_id = $1 AND event_id = $2', [teamId, eventId]);
  if (existing.rows[0]) {
    await query('UPDATE scores SET score=$1, note=$2, assigned_by=$3, assigned_at=CURRENT_TIMESTAMP WHERE id=$4',
      [score, note, req.user.id, existing.rows[0].id]);
  } else {
    await query('INSERT INTO scores (team_id, event_id, score, note, assigned_by) VALUES ($1, $2, $3, $4, $5)',
      [teamId, eventId, score, note, req.user.id]);
  }
  res.json({ success: true });
});

// LEADERBOARD
app.get('/api/leaderboard/event/:eventId', auth, async (req, res) => {
  const result = await query(`
    SELECT t.id, t.name, s.score, s.note, s.assigned_at,
    (SELECT STRING_AGG(tm.member_name, ', ') FROM team_members tm WHERE tm.team_id = t.id) as members
    FROM teams t
    LEFT JOIN scores s ON s.team_id = t.id AND s.event_id = $1
    WHERE t.event_id = $2
    ORDER BY s.score DESC NULLS LAST
  `, [req.params.eventId, req.params.eventId]);
  res.json(result.rows);
});

app.get('/api/leaderboard/overall', auth, async (req, res) => {
  const result = await query(`
    SELECT t.id, t.name, e.title as event_title, e.date as event_date, s.score,
    (SELECT STRING_AGG(tm.member_name, ', ') FROM team_members tm WHERE tm.team_id = t.id) as members
    FROM teams t JOIN events e ON e.id = t.event_id
    LEFT JOIN scores s ON s.team_id = t.id AND s.event_id = t.event_id
    WHERE s.score IS NOT NULL ORDER BY s.score DESC
  `);
  res.json(result.rows);
});

app.get('/api/leaderboard/team-history/:teamId', auth, async (req, res) => {
  const result = await query(`
    SELECT s.*, e.title as event_title, e.date as event_date, t.name as team_name
    FROM scores s JOIN events e ON e.id = s.event_id JOIN teams t ON t.id = s.team_id
    WHERE s.team_id = $1 ORDER BY s.assigned_at DESC
  `, [req.params.teamId]);
  res.json(result.rows);
});

// ─── ACTIVITIES (Booking Section) ─────────────────────────────────────────────
app.get('/api/activities', auth, async (req, res) => {
  const result = await query(`
    SELECT a.*,
    (SELECT COUNT(*) FROM bookings b WHERE b.activity_id = a.id) as booked_count,
    (SELECT COUNT(*) FROM bookings b WHERE b.activity_id = a.id AND b.user_id = $1) as user_booked
    FROM activities a ORDER BY a.date DESC
  `, [req.user.id]);
  res.json(result.rows);
});

app.post('/api/activities', auth, superAdminOnly, async (req, res) => {
  const { title, description, date, venue, total_seats } = req.body;
  if (!title || !date || !total_seats) return res.status(400).json({ error: 'Title, date and seats required' });
  const result = await query(
    'INSERT INTO activities (title, description, date, venue, total_seats, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [title, description, date, venue, total_seats, req.user.id]
  );
  res.json(result.rows[0]);
});

app.put('/api/activities/:id', auth, superAdminOnly, async (req, res) => {
  const { title, description, date, venue, total_seats, status } = req.body;
  await query('UPDATE activities SET title=$1, description=$2, date=$3, venue=$4, total_seats=$5, status=$6 WHERE id=$7',
    [title, description, date, venue, total_seats, status, req.params.id]);
  res.json({ success: true });
});

app.delete('/api/activities/:id', auth, superAdminOnly, async (req, res) => {
  await query('DELETE FROM bookings WHERE activity_id = $1', [req.params.id]);
  await query('DELETE FROM activities WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// Book a seat
app.post('/api/activities/:id/book', auth, async (req, res) => {
  const activityId = parseInt(req.params.id);
  const activity = await query('SELECT * FROM activities WHERE id = $1', [activityId]);
  if (!activity.rows[0]) return res.status(404).json({ error: 'Activity not found' });
  if (activity.rows[0].status !== 'open') return res.status(400).json({ error: 'Booking is closed' });

  const bookingCount = await query('SELECT COUNT(*) FROM bookings WHERE activity_id = $1', [activityId]);
  if (parseInt(bookingCount.rows[0].count) >= activity.rows[0].total_seats) {
    return res.status(400).json({ error: 'No seats available' });
  }

  try {
    await query(
      'INSERT INTO bookings (activity_id, user_id, user_name, user_email) VALUES ($1, $2, $3, $4)',
      [activityId, req.user.id, req.user.name, req.user.email]
    );
    res.json({ success: true, message: 'Seat booked successfully!' });
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'You already booked this activity' });
    res.status(500).json({ error: e.message });
  }
});

// Cancel booking
app.delete('/api/activities/:id/book', auth, async (req, res) => {
  await query('DELETE FROM bookings WHERE activity_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// Get bookings for an activity (admin/superadmin)
app.get('/api/activities/:id/bookings', auth, adminOnly, async (req, res) => {
  const result = await query(
    'SELECT * FROM bookings WHERE activity_id = $1 ORDER BY booked_at ASC',
    [req.params.id]
  );
  res.json(result.rows);
});

app.listen(PORT, () => console.log(`AI Club server running on port ${PORT}`));