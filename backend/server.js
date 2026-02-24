require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'ai_club_secret_key_change_in_production';

// ─── SUPER ADMIN (hardcoded) ──────────────────────────────────────────────────
const SUPER_ADMIN_EMAIL = 'mallug@gmail.com';
const SUPER_ADMIN_PASSWORD = 'yokoso20';
const SUPER_ADMIN_NAME = 'Mallug';

app.use(cors());
app.use(express.json());

// ─── DB SETUP ────────────────────────────────────────────────────────────────
const db = new sqlite3.Database('./ai_club.db', (err) => {
  if (err) console.error('DB error:', err);
  else console.log('Database connected!');
});

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err);
    else resolve({ lastID: this.lastID, changes: this.changes });
  });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    venue TEXT,
    status TEXT DEFAULT 'upcoming',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    event_id INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    user_id INTEGER,
    member_name TEXT NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    score REAL NOT NULL,
    note TEXT,
    assigned_by INTEGER,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Auto-create super admin if not exists
  const hash = bcrypt.hashSync(SUPER_ADMIN_PASSWORD, 10);
  db.run(
    `INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')`,
    [SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, hash]
  );
});

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
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

// ─── AUTH ROUTES ─────────────────────────────────────────────────────────────
// Register — everyone becomes member, no role selection
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (email === SUPER_ADMIN_EMAIL) return res.status(400).json({ error: 'Email already exists' });
  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = await run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hash, 'member']);
    const user = await get('SELECT id, name, email, role FROM users WHERE id = ?', [result.lastID]);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────
app.get('/api/users', auth, async (req, res) => {
  const users = await all('SELECT id, name, email, role, created_at FROM users ORDER BY name');
  res.json(users);
});

// Only super admin can promote/demote users
app.put('/api/users/:id/role', auth, superAdminOnly, async (req, res) => {
  const { role } = req.body;
  const targetUser = await get('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });
  if (targetUser.email === SUPER_ADMIN_EMAIL) return res.status(400).json({ error: 'Cannot change super admin role' });
  if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  await run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
  res.json({ success: true });
});

// ─── EVENT ROUTES ─────────────────────────────────────────────────────────────
app.get('/api/events', auth, async (req, res) => {
  const events = await all(`
    SELECT e.*, u.name as creator_name,
    (SELECT COUNT(*) FROM teams t WHERE t.event_id = e.id) as team_count
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    ORDER BY e.date DESC
  `);
  res.json(events);
});

app.post('/api/events', auth, adminOnly, async (req, res) => {
  const { title, description, date, venue } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Title and date required' });
  const result = await run('INSERT INTO events (title, description, date, venue, created_by) VALUES (?, ?, ?, ?, ?)', [title, description, date, venue, req.user.id]);
  const event = await get('SELECT * FROM events WHERE id = ?', [result.lastID]);
  res.json(event);
});

app.put('/api/events/:id', auth, adminOnly, async (req, res) => {
  const { title, description, date, venue, status } = req.body;
  await run('UPDATE events SET title=?, description=?, date=?, venue=?, status=? WHERE id=?', [title, description, date, venue, status, req.params.id]);
  res.json({ success: true });
});

app.delete('/api/events/:id', auth, adminOnly, async (req, res) => {
  await run('DELETE FROM events WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// ─── TEAM ROUTES ──────────────────────────────────────────────────────────────
app.get('/api/events/:eventId/teams', auth, async (req, res) => {
  const teams = await all(`
    SELECT t.*, u.name as creator_name, s.score,
    (SELECT GROUP_CONCAT(tm.member_name, '|') FROM team_members tm WHERE tm.team_id = t.id) as member_names
    FROM teams t
    LEFT JOIN users u ON t.created_by = u.id
    LEFT JOIN scores s ON s.team_id = t.id AND s.event_id = t.event_id
    WHERE t.event_id = ?
    ORDER BY s.score DESC
  `, [req.params.eventId]);
  res.json(teams);
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
  const result = await run('INSERT INTO teams (name, event_id, created_by) VALUES (?, ?, ?)', [name, eventId, req.user.id]);
  const teamId = result.lastID;
  await run('INSERT INTO team_members (team_id, user_id, member_name) VALUES (?, ?, ?)', [teamId, req.user.id, req.user.name]);
  for (const mname of extraMembers) {
    await run('INSERT INTO team_members (team_id, user_id, member_name) VALUES (?, ?, ?)', [teamId, 0, mname.trim()]);
  }
  res.json({ id: teamId, name, event_id: eventId });
});

app.delete('/api/teams/:id', auth, async (req, res) => {
  const team = await get('SELECT * FROM teams WHERE id = ?', [req.params.id]);
  if (!team) return res.status(404).json({ error: 'Team not found' });
  if (team.created_by !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not allowed' });
  }
  await run('DELETE FROM team_members WHERE team_id = ?', [req.params.id]);
  await run('DELETE FROM scores WHERE team_id = ?', [req.params.id]);
  await run('DELETE FROM teams WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// ─── SCORE ROUTES ─────────────────────────────────────────────────────────────
app.post('/api/scores', auth, adminOnly, async (req, res) => {
  const { teamId, eventId, score, note } = req.body;
  if (score < 0 || score > 10) return res.status(400).json({ error: 'Score must be 0-10' });
  const existing = await get('SELECT id FROM scores WHERE team_id = ? AND event_id = ?', [teamId, eventId]);
  if (existing) {
    await run('UPDATE scores SET score=?, note=?, assigned_by=?, assigned_at=CURRENT_TIMESTAMP WHERE id=?', [score, note, req.user.id, existing.id]);
  } else {
    await run('INSERT INTO scores (team_id, event_id, score, note, assigned_by) VALUES (?, ?, ?, ?, ?)', [teamId, eventId, score, note, req.user.id]);
  }
  res.json({ success: true });
});

// ─── LEADERBOARD ROUTES ───────────────────────────────────────────────────────
app.get('/api/leaderboard/event/:eventId', auth, async (req, res) => {
  const teams = await all(`
    SELECT t.id, t.name, s.score, s.note, s.assigned_at,
    (SELECT GROUP_CONCAT(tm.member_name, ', ') FROM team_members tm WHERE tm.team_id = t.id) as members
    FROM teams t
    LEFT JOIN scores s ON s.team_id = t.id AND s.event_id = ?
    WHERE t.event_id = ?
    ORDER BY s.score DESC
  `, [req.params.eventId, req.params.eventId]);
  res.json(teams);
});

app.get('/api/leaderboard/overall', auth, async (req, res) => {
  const teams = await all(`
    SELECT t.id, t.name, e.title as event_title, e.date as event_date, s.score,
    (SELECT GROUP_CONCAT(tm.member_name, ', ') FROM team_members tm WHERE tm.team_id = t.id) as members
    FROM teams t
    JOIN events e ON e.id = t.event_id
    LEFT JOIN scores s ON s.team_id = t.id AND s.event_id = t.event_id
    WHERE s.score IS NOT NULL
    ORDER BY s.score DESC
  `);
  res.json(teams);
});

app.get('/api/leaderboard/team-history/:teamId', auth, async (req, res) => {
  const history = await all(`
    SELECT s.*, e.title as event_title, e.date as event_date, t.name as team_name
    FROM scores s
    JOIN events e ON e.id = s.event_id
    JOIN teams t ON t.id = s.team_id
    WHERE s.team_id = ?
    ORDER BY s.assigned_at DESC
  `, [req.params.teamId]);
  res.json(history);
});

app.listen(PORT, () => console.log(`AI Club server running on port ${PORT}`));