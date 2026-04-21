const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/images/activities', express.static(path.join(__dirname, '..', 'public', 'activities')));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;

const INVITE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
function generateInviteCode() {
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += INVITE_ALPHABET[crypto.randomInt(0, INVITE_ALPHABET.length)];
  }
  return code;
}

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

// Get current user + couple status + unread plan changes
app.get('/me', auth, async (req, res) => {
  const user = await pool.query(
    'SELECT id, email, name, avatar_url, last_checklist_viewed_at, last_memories_viewed_at FROM users WHERE id = $1',
    [req.user.id]
  );
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
  let unreadCount = 0;
  let unreadMemories = 0;
  if (couple.rows[0]) {
    const cid = couple.rows[0].id;
    const lastSeen = user.rows[0].last_checklist_viewed_at;
    const lastSeenM = user.rows[0].last_memories_viewed_at;
    const [a, b] = await Promise.all([
      pool.query(
        lastSeen
          ? 'SELECT COUNT(*)::int AS n FROM checklist WHERE couple_id = $1 AND updated_at > $2'
          : 'SELECT COUNT(*)::int AS n FROM checklist WHERE couple_id = $1',
        lastSeen ? [cid, lastSeen] : [cid]
      ),
      pool.query(
        lastSeenM
          ? 'SELECT COUNT(*)::int AS n FROM memories WHERE couple_id = $1 AND updated_at > $2'
          : 'SELECT COUNT(*)::int AS n FROM memories WHERE couple_id = $1',
        lastSeenM ? [cid, lastSeenM] : [cid]
      ),
    ]);
    unreadCount = a.rows[0].n;
    unreadMemories = b.rows[0].n;
  }
  res.json({ user: user.rows[0], couple: couple.rows[0] || null, unreadCount, unreadMemories });
});

// Create invite (start a couple). If user already has a pending invite
// (user_b_id IS NULL), rotate the code instead of rejecting.
app.post('/couple/create', auth, async (req, res) => {
  const existing = await pool.query(
    'SELECT id, user_b_id FROM couples WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE',
    [req.user.id]
  );
  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    if (row.user_b_id) {
      return res.status(400).json({ error: 'Already in a couple' });
    }
    const rotated = await pool.query(
      'UPDATE couples SET invite_code = $1, created_at = NOW() WHERE id = $2 RETURNING id, invite_code',
      [generateInviteCode(), row.id]
    );
    return res.json(rotated.rows[0]);
  }

  const result = await pool.query(
    'INSERT INTO couples (user_a_id, invite_code) VALUES ($1, $2) RETURNING id, invite_code',
    [req.user.id, generateInviteCode()]
  );
  res.json(result.rows[0]);
});

// Join couple via invite code. Case-insensitive. Rejects expired (>7d) or
// used codes, self-invite, and users who are in a real pair. A user's own
// pending invite (if any) is auto-cancelled when they accept someone else's.
app.post('/couple/join', auth, async (req, res) => {
  const code = (req.body.inviteCode || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'No invite code' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const pair = await client.query(
      `SELECT id FROM couples
       WHERE (user_a_id = $1 OR user_b_id = $1)
         AND active = TRUE AND user_b_id IS NOT NULL`,
      [req.user.id]
    );
    if (pair.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Already in a couple' });
    }
    const couple = await client.query(
      `SELECT * FROM couples
       WHERE invite_code = $1 AND active = TRUE AND user_b_id IS NULL
         AND created_at > NOW() - INTERVAL '7 days'
       FOR UPDATE`,
      [code]
    );
    if (couple.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Invalid, used, or expired invite code' });
    }
    if (couple.rows[0].user_a_id === req.user.id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot pair with yourself' });
    }
    // Cooldown after a break-up: same two people can't re-pair for 48h.
    // Pairing with someone new is unaffected.
    const prior = await client.query(
      `SELECT ended_at FROM couples
       WHERE user_b_id IS NOT NULL
         AND ((user_a_id = $1 AND user_b_id = $2) OR (user_a_id = $2 AND user_b_id = $1))
         AND ended_at IS NOT NULL
       ORDER BY ended_at DESC LIMIT 1`,
      [couple.rows[0].user_a_id, req.user.id]
    );
    if (prior.rows.length > 0) {
      const endedAt = new Date(prior.rows[0].ended_at);
      const hoursSince = (Date.now() - endedAt.getTime()) / 3600000;
      if (hoursSince < 48) {
        await client.query('ROLLBACK');
        const hoursLeft = Math.ceil(48 - hoursSince);
        const when = hoursLeft >= 24
          ? `in about ${Math.ceil(hoursLeft / 24)} day${hoursLeft >= 48 ? 's' : ''}`
          : `in ${hoursLeft} hour${hoursLeft === 1 ? '' : 's'}`;
        return res.status(400).json({ error: `Give it a moment — you two can reconnect ${when}` });
      }
    }
    await client.query(
      `UPDATE couples SET active = FALSE
       WHERE user_a_id = $1 AND active = TRUE AND user_b_id IS NULL AND id <> $2`,
      [req.user.id, couple.rows[0].id]
    );
    const result = await client.query(
      'UPDATE couples SET user_b_id = $1, paired_at = NOW() WHERE id = $2 RETURNING *',
      [req.user.id, couple.rows[0].id]
    );
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Unpair (either person can leave, one-sided). Wipes shared state:
// swipes, checklist, memories. Couple row stays with active=false for history.
app.post('/couple/unpair', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const couple = await client.query(
      `SELECT id FROM couples
       WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE
       FOR UPDATE`,
      [req.user.id]
    );
    if (couple.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'No active couple' });
    }
    const coupleId = couple.rows[0].id;
    await client.query('DELETE FROM memories WHERE couple_id = $1', [coupleId]);
    await client.query('DELETE FROM checklist WHERE couple_id = $1', [coupleId]);
    await client.query('DELETE FROM swipes WHERE couple_id = $1', [coupleId]);
    await client.query(
      'UPDATE couples SET active = FALSE, ended_at = NOW(), ended_by = $1 WHERE id = $2',
      [req.user.id, coupleId]
    );
    await client.query('COMMIT');
    res.json({ message: 'Unpaired' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

function currentSeason(month) {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

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

  // Daily ration with spread days and completion bonus.
  // Spread-day heuristic: ~1/3 of days, fewer cards early, full cap by evening.
  const disableLimit = process.env.DISABLE_SWIPE_LIMIT === '1';
  const BASE_CAP = parseInt(process.env.DAILY_SWIPE_LIMIT || '8', 10);
  const today = new Date();
  const dateKey = today.toISOString().slice(0, 10);
  const hash = (req.user.id * 31 + parseInt(dateKey.replace(/-/g, ''), 10)) % 3;
  const spreadDay = hash === 0 && !disableLimit;
  const hour = today.getHours();
  let cap = BASE_CAP;
  if (spreadDay) {
    if (hour < 12) cap = 3;
    else if (hour < 18) cap = 6;
    else cap = BASE_CAP;
  }
  const doneToday = await pool.query(
    "SELECT COUNT(*)::int AS n FROM checklist WHERE couple_id = $1 AND status = 'done' AND updated_at::date = CURRENT_DATE",
    [coupleId]
  );
  cap += doneToday.rows[0].n;

  const swipedToday = await pool.query(
    "SELECT COUNT(*)::int AS n FROM swipes WHERE user_id = $1 AND swiped_at::date = CURRENT_DATE",
    [req.user.id]
  );
  if (!disableLimit && swipedToday.rows[0].n >= cap) {
    const preview = await pool.query(
      `SELECT image_url FROM activities
       WHERE image_url IS NOT NULL AND id NOT IN (
         SELECT activity_id FROM swipes WHERE user_id = $1 AND couple_id = $2
       )
       ORDER BY RANDOM() LIMIT 4`,
      [req.user.id, coupleId]
    );
    return res.json({
      blocked: true,
      message: spreadDay && hour < 18
        ? 'Come back later — a few more unlock tonight'
        : 'That\'s enough for today — new ideas tomorrow',
      preview_images: preview.rows.map(r => r.image_url),
    });
  }

  const season = currentSeason(new Date().getMonth() + 1);

  // Bias easy activities for new couples: show easier cards first.
  // After ~10 swipes the mix opens up to all difficulties.
  const totalSwipes = await pool.query(
    'SELECT COUNT(*)::int AS n FROM swipes WHERE couple_id = $1',
    [coupleId]
  );
  const swipeCount = totalSwipes.rows[0].n;
  let maxDifficulty = 2;
  if (swipeCount >= 20) maxDifficulty = 5;
  else if (swipeCount >= 10) maxDifficulty = 3;
  else if (swipeCount >= 5) maxDifficulty = 2;

  const activities = await pool.query(
    `SELECT a.*, c.name as category_name
     FROM activities a
     JOIN categories c ON c.id = a.category_id
     WHERE a.id NOT IN (
       SELECT activity_id FROM swipes WHERE user_id = $1 AND couple_id = $2
     )
     AND ($3 = ANY(a.seasons) OR 'all' = ANY(a.seasons))
     AND a.difficulty <= $4
     ORDER BY a.difficulty, RANDOM()
     LIMIT 5`,
    [req.user.id, coupleId, season, maxDifficulty]
  );

  if (activities.rows.length === 0) {
    return res.json({ done: true, message: 'No more activities to swipe' });
  }
  res.json({ queue: activities.rows });
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

// Get checklist. Each item carries per-viewer fields so the UI can show
// who's approved/completed and who's still pending.
app.get('/checklist', auth, async (req, res) => {
  const couple = await pool.query(
    `SELECT c.id, c.user_a_id,
            CASE WHEN c.user_a_id = $1 THEN ub.name ELSE ua.name END as partner_name
     FROM couples c
     JOIN users ua ON ua.id = c.user_a_id
     LEFT JOIN users ub ON ub.id = c.user_b_id
     WHERE (c.user_a_id = $1 OR c.user_b_id = $1) AND c.active = TRUE`,
    [req.user.id]
  );
  if (couple.rows.length === 0) return res.json([]);
  const { id: coupleId, user_a_id, partner_name } = couple.rows[0];
  const isA = user_a_id === req.user.id;

  const items = await pool.query(
    `SELECT cl.*, a.title, a.tagline, a.image_url, c.name as category_name
     FROM checklist cl
     JOIN activities a ON a.id = cl.activity_id
     JOIN categories c ON c.id = a.category_id
     WHERE cl.couple_id = $1 AND cl.status <> 'done'
     ORDER BY cl.updated_at DESC`,
    [coupleId]
  );
  const lastSeen = await pool.query(
    'SELECT last_checklist_viewed_at FROM users WHERE id = $1',
    [req.user.id]
  );
  const seenAt = lastSeen.rows[0].last_checklist_viewed_at;

  const payload = items.rows.map(r => ({
    ...r,
    you_approved: isA ? r.approved_by_a : r.approved_by_b,
    partner_approved: isA ? r.approved_by_b : r.approved_by_a,
    you_completed: isA ? r.completed_by_a : r.completed_by_b,
    partner_completed: isA ? r.completed_by_b : r.completed_by_a,
    partner_name,
    is_new: !seenAt || new Date(r.updated_at) > new Date(seenAt),
  }));

  await pool.query(
    'UPDATE users SET last_checklist_viewed_at = NOW() WHERE id = $1',
    [req.user.id]
  );

  res.json(payload);
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

  await pool.query(
    `UPDATE checklist SET ${field} = TRUE, updated_at = NOW() WHERE id = $1 AND couple_id = $2`,
    [req.params.id, c.id]
  );

  const item = await pool.query('SELECT * FROM checklist WHERE id = $1', [req.params.id]);
  if (item.rows[0].approved_by_a && item.rows[0].approved_by_b) {
    await pool.query(
      "UPDATE checklist SET status = 'approved', approved_at = NOW(), updated_at = NOW() WHERE id = $1",
      [req.params.id]
    );
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

  await pool.query(
    `UPDATE checklist SET ${field} = TRUE, updated_at = NOW() WHERE id = $1 AND couple_id = $2`,
    [req.params.id, c.id]
  );

  const item = await pool.query('SELECT * FROM checklist WHERE id = $1', [req.params.id]);
  if (item.rows[0].completed_by_a && item.rows[0].completed_by_b) {
    await pool.query(
      "UPDATE checklist SET status = 'done', completed_at = NOW(), updated_at = NOW() WHERE id = $1",
      [req.params.id]
    );
    // Create memory with denormalized activity info so it survives
    // checklist cleanup as a permanent scrapbook entry.
    await pool.query(
      `INSERT INTO memories (couple_id, checklist_id, activity_id, activity_title, activity_tagline, activity_image_url, activity_category)
       SELECT $1, $2, a.id, a.title, a.tagline, a.image_url, cat.name
       FROM activities a
       JOIN categories cat ON cat.id = a.category_id
       JOIN checklist cl ON cl.activity_id = a.id
       WHERE cl.id = $2`,
      [c.id, req.params.id]
    );
  }

  res.json({ completed: true });
});

// Delete a done checklist item (and its memory). Rejected for items that
// aren't done — unapproved / planned items must be unpaired-only.
app.delete('/checklist/:id', auth, async (req, res) => {
  const couple = await pool.query(
    'SELECT id FROM couples WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE',
    [req.user.id]
  );
  if (couple.rows.length === 0) return res.status(400).json({ error: 'Not in a couple' });

  const item = await pool.query(
    'SELECT id, status FROM checklist WHERE id = $1 AND couple_id = $2',
    [req.params.id, couple.rows[0].id]
  );
  if (item.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  if (item.rows[0].status !== 'done') return res.status(400).json({ error: 'Only done items can be deleted' });

  // Memory row stays (FK ON DELETE SET NULL) — deleting a checklist item
  // just clears it from the active list, the scrapbook keeps the entry.
  await pool.query('DELETE FROM checklist WHERE id = $1', [req.params.id]);
  res.json({ deleted: true });
});

// Get memories. Each row carries per-viewer fields so the UI can show
// "you" vs "partner" ratings/moods/notes without leaking side assignment.
app.get('/memories', auth, async (req, res) => {
  const couple = await pool.query(
    `SELECT c.id, c.user_a_id,
            CASE WHEN c.user_a_id = $1 THEN ub.name ELSE ua.name END as partner_name
     FROM couples c
     JOIN users ua ON ua.id = c.user_a_id
     LEFT JOIN users ub ON ub.id = c.user_b_id
     WHERE (c.user_a_id = $1 OR c.user_b_id = $1) AND c.active = TRUE`,
    [req.user.id]
  );
  if (couple.rows.length === 0) return res.json([]);
  const { id: cid, user_a_id, partner_name } = couple.rows[0];
  const isA = user_a_id === req.user.id;

  const memories = await pool.query(
    `SELECT id, couple_id, checklist_id, photo_url, completed_at, updated_at,
            activity_title AS title, activity_tagline AS tagline,
            activity_image_url AS image_url, activity_category AS category_name,
            rating_a, rating_b, mood_a, mood_b, note_a, note_b,
            repeat_requested_by, repeat_requested_at
     FROM memories
     WHERE couple_id = $1
     ORDER BY completed_at DESC`,
    [cid]
  );
  const seen = await pool.query('SELECT last_memories_viewed_at FROM users WHERE id = $1', [req.user.id]);
  const seenAt = seen.rows[0].last_memories_viewed_at;

  const payload = memories.rows.map(r => ({
    id: r.id, couple_id: r.couple_id, checklist_id: r.checklist_id,
    photo_url: r.photo_url, completed_at: r.completed_at, updated_at: r.updated_at,
    title: r.title, tagline: r.tagline, image_url: r.image_url, category_name: r.category_name,
    you_rating: isA ? r.rating_a : r.rating_b,
    partner_rating: isA ? r.rating_b : r.rating_a,
    you_mood: isA ? r.mood_a : r.mood_b,
    partner_mood: isA ? r.mood_b : r.mood_a,
    you_note: isA ? r.note_a : r.note_b,
    partner_note: isA ? r.note_b : r.note_a,
    partner_name,
    is_new: !seenAt || new Date(r.updated_at) > new Date(seenAt),
    repeat_requested_by_you: r.repeat_requested_by === req.user.id,
    repeat_requested_by_partner: r.repeat_requested_by != null && r.repeat_requested_by !== req.user.id,
    repeat_requested_at: r.repeat_requested_at,
  }));
  await pool.query('UPDATE users SET last_memories_viewed_at = NOW() WHERE id = $1', [req.user.id]);
  res.json(payload);
});

// Update the caller's own rating / mood / note on a memory. Each partner
// edits only their own side.
app.patch('/memories/:id', auth, async (req, res) => {
  const { note, rating, mood } = req.body;
  const couple = await pool.query(
    'SELECT id, user_a_id FROM couples WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE',
    [req.user.id]
  );
  if (couple.rows.length === 0) return res.status(400).json({ error: 'Not in a couple' });
  const isA = couple.rows[0].user_a_id === req.user.id;
  const suffix = isA ? '_a' : '_b';

  const fields = [];
  const values = [];
  if (note !== undefined) { fields.push(`note${suffix} = $${values.length + 1}`); values.push(note); }
  if (rating !== undefined) {
    if (rating !== null && (rating < 1 || rating > 5)) return res.status(400).json({ error: 'Rating must be 1-5' });
    fields.push(`rating${suffix} = $${values.length + 1}`); values.push(rating);
  }
  if (mood !== undefined) { fields.push(`mood${suffix} = $${values.length + 1}`); values.push(mood); }
  if (fields.length === 0) return res.status(400).json({ error: 'Nothing to update' });

  fields.push(`updated_at = NOW()`);
  values.push(req.params.id, couple.rows[0].id);
  const result = await pool.query(
    `UPDATE memories SET ${fields.join(', ')} WHERE id = $${values.length - 1} AND couple_id = $${values.length} RETURNING *`,
    values
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// One partner asks to do this activity again. Stored on the memory; partner
// accepts from their memory view to spawn a fresh checklist item.
app.post('/memories/:id/repeat', auth, async (req, res) => {
  const couple = await pool.query(
    'SELECT id FROM couples WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE',
    [req.user.id]
  );
  if (couple.rows.length === 0) return res.status(400).json({ error: 'Not in a couple' });
  const result = await pool.query(
    `UPDATE memories
     SET repeat_requested_by = $1, repeat_requested_at = NOW(), updated_at = NOW()
     WHERE id = $2 AND couple_id = $3 AND repeat_requested_by IS NULL
     RETURNING *`,
    [req.user.id, req.params.id, couple.rows[0].id]
  );
  if (result.rows.length === 0) return res.status(409).json({ error: 'Already requested or not found' });
  res.json({ ok: true });
});

// Requester can withdraw, or partner can decline.
app.post('/memories/:id/cancel-repeat', auth, async (req, res) => {
  const couple = await pool.query(
    'SELECT id FROM couples WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE',
    [req.user.id]
  );
  if (couple.rows.length === 0) return res.status(400).json({ error: 'Not in a couple' });
  await pool.query(
    `UPDATE memories
     SET repeat_requested_by = NULL, repeat_requested_at = NULL, updated_at = NOW()
     WHERE id = $1 AND couple_id = $2`,
    [req.params.id, couple.rows[0].id]
  );
  res.json({ ok: true });
});

// Partner accepts: clears the request and creates a fresh checklist item in
// 'approved' state (both sides already agreed to repeat this one).
app.post('/memories/:id/accept-repeat', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const memory = await client.query(
      `SELECT m.id, m.couple_id, m.repeat_requested_by, m.activity_id
       FROM memories m
       JOIN couples c ON c.id = m.couple_id
       WHERE m.id = $1 AND (c.user_a_id = $2 OR c.user_b_id = $2) AND c.active = TRUE`,
      [req.params.id, req.user.id]
    );
    if (memory.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not found' });
    }
    const m = memory.rows[0];
    if (!m.repeat_requested_by || m.repeat_requested_by === req.user.id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No pending request to accept' });
    }
    if (!m.activity_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Original activity unavailable' });
    }

    const plan = await client.query(
      `INSERT INTO checklist (couple_id, activity_id, approved_by_a, approved_by_b, approved_at, status)
       VALUES ($1, $2, TRUE, TRUE, NOW(), 'approved')
       RETURNING id`,
      [m.couple_id, m.activity_id]
    );
    await client.query(
      `UPDATE memories SET repeat_requested_by = NULL, repeat_requested_at = NULL, updated_at = NOW() WHERE id = $1`,
      [m.id]
    );
    await client.query('COMMIT');
    res.json({ ok: true, checklist_id: plan.rows[0].id });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('accept-repeat', e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Comments: shared with helper. parentType is 'plan' (checklist) or 'memory'.
async function loadCoupleForParent(userId, parentType, parentId) {
  const table = parentType === 'plan' ? 'checklist' : 'memories';
  const row = await pool.query(
    `SELECT t.*, c.user_a_id, c.user_b_id
     FROM ${table} t
     JOIN couples c ON c.id = t.couple_id
     WHERE t.id = $1 AND (c.user_a_id = $2 OR c.user_b_id = $2) AND c.active = TRUE`,
    [parentId, userId]
  );
  return row.rows[0];
}

app.get('/comments/:parentType/:id', auth, async (req, res) => {
  const { parentType, id } = req.params;
  if (!['plan', 'memory'].includes(parentType)) return res.status(400).json({ error: 'Invalid type' });
  const parent = await loadCoupleForParent(req.user.id, parentType, id);
  if (!parent) return res.status(404).json({ error: 'Not found' });

  const list = await pool.query(
    `SELECT c.id, c.text, c.user_id, c.created_at, u.name as user_name
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.parent_type = $1 AND c.parent_id = $2
     ORDER BY c.created_at ASC`,
    [parentType, id]
  );

  // Partner's last-seen timestamp (for read-receipt ✓✓ on my comments)
  const isA = parent.user_a_id === req.user.id;
  const partnerSeenAt = isA ? parent.last_comment_seen_b : parent.last_comment_seen_a;

  // Mark this user as having seen comments for this item
  const table = parentType === 'plan' ? 'checklist' : 'memories';
  const col = isA ? 'last_comment_seen_a' : 'last_comment_seen_b';
  await pool.query(`UPDATE ${table} SET ${col} = now() WHERE id = $1`, [id]);

  res.json({ comments: list.rows, partner_last_seen_at: partnerSeenAt });
});

app.post('/comments/:parentType/:id', auth, async (req, res) => {
  const { parentType, id } = req.params;
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Empty' });
  if (!['plan', 'memory'].includes(parentType)) return res.status(400).json({ error: 'Invalid type' });
  const parent = await loadCoupleForParent(req.user.id, parentType, id);
  if (!parent) return res.status(404).json({ error: 'Not found' });

  const table = parentType === 'plan' ? 'checklist' : 'memories';
  const col = parent.user_a_id === req.user.id ? 'last_comment_seen_a' : 'last_comment_seen_b';
  const result = await pool.query(
    `INSERT INTO comments (parent_type, parent_id, user_id, text) VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
    [parentType, id, req.user.id, text]
  );
  // Bump parent.updated_at so nav dot + list ordering refresh for partner.
  // Caller marks themselves as having seen their own comment.
  await pool.query(`UPDATE ${table} SET updated_at = now(), ${col} = now() WHERE id = $1`, [id]);

  res.json({ id: result.rows[0].id, created_at: result.rows[0].created_at });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', version: process.env.APP_VERSION || 'dev' });
  } catch {
    res.status(500).json({ status: 'db error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Warmth API running on port ${PORT}`));
