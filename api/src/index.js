const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Google Sign-In
app.post('/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    const result = await pool.query(
      `INSERT INTO users (google_id, email, name, avatar_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (google_id) DO UPDATE SET name = $3, avatar_url = $4
       RETURNING id, email, name, avatar_url`,
      [googleId, email, name, picture]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Dev login (skip Google for testing)
app.post('/auth/dev', async (req, res) => {
  const { name, email } = req.body;
  const googleId = `dev_${email}`;
  const result = await pool.query(
    `INSERT INTO users (google_id, email, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (google_id) DO UPDATE SET name = $3
     RETURNING id, email, name`,
    [googleId, email, name]
  );
  const user = result.rows[0];
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user });
});

// Get current user + couple status
app.get('/me', auth, async (req, res) => {
  const user = await pool.query('SELECT id, email, name, avatar_url FROM users WHERE id = $1', [req.user.id]);
  const couple = await pool.query(
    `SELECT c.*,
       CASE WHEN c.user_a_id = $1 THEN ub.name ELSE ua.name END as partner_name
     FROM couples c
     JOIN users ua ON ua.id = c.user_a_id
     LEFT JOIN users ub ON ub.id = c.user_b_id
     WHERE (c.user_a_id = $1 OR c.user_b_id = $1) AND c.active = TRUE
     LIMIT 1`,
    [req.user.id]
  );
  res.json({ user: user.rows[0], couple: couple.rows[0] || null });
});

// Create invite (start a couple)
app.post('/couple/create', auth, async (req, res) => {
  const existing = await pool.query(
    'SELECT id FROM couples WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE',
    [req.user.id]
  );
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'Already in a couple' });
  }

  const inviteCode = crypto.randomBytes(5).toString('hex');
  const result = await pool.query(
    'INSERT INTO couples (user_a_id, invite_code) VALUES ($1, $2) RETURNING id, invite_code',
    [req.user.id, inviteCode]
  );
  res.json(result.rows[0]);
});

// Join couple via invite code
app.post('/couple/join', auth, async (req, res) => {
  const { inviteCode } = req.body;
  const couple = await pool.query(
    'SELECT * FROM couples WHERE invite_code = $1 AND active = TRUE AND user_b_id IS NULL',
    [inviteCode]
  );
  if (couple.rows.length === 0) {
    return res.status(404).json({ error: 'Invalid or used invite code' });
  }
  if (couple.rows[0].user_a_id === req.user.id) {
    return res.status(400).json({ error: 'Cannot pair with yourself' });
  }

  const result = await pool.query(
    'UPDATE couples SET user_b_id = $1, paired_at = NOW() WHERE id = $2 RETURNING *',
    [req.user.id, couple.rows[0].id]
  );
  res.json(result.rows[0]);
});

// Unpair (either person can leave)
app.post('/couple/unpair', auth, async (req, res) => {
  const result = await pool.query(
    `UPDATE couples SET active = FALSE, ended_at = NOW(), ended_by = $1
     WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE
     RETURNING id`,
    [req.user.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'No active couple' });
  }
  res.json({ message: 'Unpaired' });
});

// Get next activity to swipe
app.get('/activities/next', auth, async (req, res) => {
  const couple = await pool.query(
    'SELECT id FROM couples WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE AND user_b_id IS NOT NULL',
    [req.user.id]
  );
  if (couple.rows.length === 0) {
    return res.status(400).json({ error: 'Not in a couple' });
  }
  const coupleId = couple.rows[0].id;

  // Check action gate: max 3 undone items in checklist
  const pending = await pool.query(
    "SELECT COUNT(*) FROM checklist WHERE couple_id = $1 AND status != 'done'",
    [coupleId]
  );
  if (parseInt(pending.rows[0].count) >= 3) {
    return res.json({ blocked: true, message: 'Complete an activity before swiping more' });
  }

  // Get activity not yet swiped by this user
  const activity = await pool.query(
    `SELECT a.*, c.name as category_name
     FROM activities a
     JOIN categories c ON c.id = a.category_id
     WHERE a.id NOT IN (
       SELECT activity_id FROM swipes WHERE user_id = $1 AND couple_id = $2
     )
     ORDER BY RANDOM()
     LIMIT 1`,
    [req.user.id, coupleId]
  );

  if (activity.rows.length === 0) {
    return res.json({ done: true, message: 'No more activities to swipe' });
  }
  res.json(activity.rows[0]);
});

// Swipe on activity
app.post('/activities/:id/swipe', auth, async (req, res) => {
  const activityId = req.params.id;
  const { liked } = req.body;

  const couple = await pool.query(
    'SELECT * FROM couples WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE AND user_b_id IS NOT NULL',
    [req.user.id]
  );
  if (couple.rows.length === 0) {
    return res.status(400).json({ error: 'Not in a couple' });
  }
  const c = couple.rows[0];

  await pool.query(
    'INSERT INTO swipes (user_id, couple_id, activity_id, liked) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
    [req.user.id, c.id, activityId, liked]
  );

  // Check for match
  if (liked) {
    const partnerId = c.user_a_id === req.user.id ? c.user_b_id : c.user_a_id;
    const partnerSwipe = await pool.query(
      'SELECT liked FROM swipes WHERE user_id = $1 AND couple_id = $2 AND activity_id = $3',
      [partnerId, c.id, activityId]
    );

    if (partnerSwipe.rows.length > 0 && partnerSwipe.rows[0].liked) {
      // It's a match! Add to checklist
      await pool.query(
        'INSERT INTO checklist (couple_id, activity_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [c.id, activityId]
      );
      return res.json({ match: true, message: 'You both want this!' });
    }
  }

  res.json({ match: false });
});

// Get checklist
app.get('/checklist', auth, async (req, res) => {
  const couple = await pool.query(
    'SELECT id, user_a_id, user_b_id FROM couples WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE',
    [req.user.id]
  );
  if (couple.rows.length === 0) return res.json([]);

  const items = await pool.query(
    `SELECT cl.*, a.title, a.tagline, a.image_url, c.name as category_name
     FROM checklist cl
     JOIN activities a ON a.id = cl.activity_id
     JOIN categories c ON c.id = a.category_id
     WHERE cl.couple_id = $1
     ORDER BY
       CASE cl.status WHEN 'approved' THEN 1 WHEN 'matched' THEN 2 WHEN 'done' THEN 3 END,
       cl.matched_at DESC`,
    [couple.rows[0].id]
  );
  res.json(items.rows);
});

// Approve checklist item
app.post('/checklist/:id/approve', auth, async (req, res) => {
  const couple = await pool.query(
    'SELECT id, user_a_id, user_b_id FROM couples WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE',
    [req.user.id]
  );
  if (couple.rows.length === 0) return res.status(400).json({ error: 'Not in a couple' });

  const c = couple.rows[0];
  const isA = c.user_a_id === req.user.id;
  const field = isA ? 'approved_by_a' : 'approved_by_b';

  await pool.query(`UPDATE checklist SET ${field} = TRUE WHERE id = $1 AND couple_id = $2`, [req.params.id, c.id]);

  // Check if both approved
  const item = await pool.query('SELECT * FROM checklist WHERE id = $1', [req.params.id]);
  if (item.rows[0].approved_by_a && item.rows[0].approved_by_b) {
    await pool.query("UPDATE checklist SET status = 'approved', approved_at = NOW() WHERE id = $1", [req.params.id]);
  }

  res.json({ approved: true });
});

// Complete checklist item
app.post('/checklist/:id/complete', auth, async (req, res) => {
  const couple = await pool.query(
    'SELECT id, user_a_id, user_b_id FROM couples WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE',
    [req.user.id]
  );
  if (couple.rows.length === 0) return res.status(400).json({ error: 'Not in a couple' });

  const c = couple.rows[0];
  const isA = c.user_a_id === req.user.id;
  const field = isA ? 'completed_by_a' : 'completed_by_b';

  await pool.query(`UPDATE checklist SET ${field} = TRUE WHERE id = $1 AND couple_id = $2`, [req.params.id, c.id]);

  const item = await pool.query('SELECT * FROM checklist WHERE id = $1', [req.params.id]);
  if (item.rows[0].completed_by_a && item.rows[0].completed_by_b) {
    await pool.query("UPDATE checklist SET status = 'done', completed_at = NOW() WHERE id = $1", [req.params.id]);
    // Create memory
    await pool.query(
      'INSERT INTO memories (couple_id, checklist_id) VALUES ($1, $2)',
      [c.id, req.params.id]
    );
  }

  res.json({ completed: true });
});

// Get memories
app.get('/memories', auth, async (req, res) => {
  const couple = await pool.query(
    'SELECT id FROM couples WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE',
    [req.user.id]
  );
  if (couple.rows.length === 0) return res.json([]);

  const memories = await pool.query(
    `SELECT m.*, a.title, a.tagline, a.image_url, c.name as category_name
     FROM memories m
     JOIN checklist cl ON cl.id = m.checklist_id
     JOIN activities a ON a.id = cl.activity_id
     JOIN categories c ON c.id = a.category_id
     WHERE m.couple_id = $1
     ORDER BY m.completed_at DESC`,
    [couple.rows[0].id]
  );
  res.json(memories.rows);
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(500).json({ status: 'db error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Warmth API running on port ${PORT}`));
