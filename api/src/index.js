const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const appleSignin = require('apple-signin-auth');
const crypto = require('crypto');
const { sendPush } = require('./push');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/images/activities', express.static(path.join(__dirname, '..', 'public', 'activities')));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Accept ID tokens issued for any of our Google OAuth clients. iOS sign-in
// returns a token whose `aud` is the iOS client ID, web returns the web client
// ID — both must be allowed or verification fails with an audience mismatch.
const GOOGLE_AUDIENCES = [
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_IOS_CLIENT_ID,
].filter(Boolean);
// Sign in with Apple: the identity token's `aud` is the app's bundle ID.
const APPLE_BUNDLE_ID = process.env.APPLE_BUNDLE_ID;
const JWT_SECRET = process.env.JWT_SECRET;

// Premium: free tier allows this many completed memories; the next one needs
// a subscription. Entitlement lives on the couple — either partner unlocks both.
const FREE_MEMORY_LIMIT = 3;

function isCouplePremium(couple) {
  if (!couple || !couple.is_premium) return false;
  // NULL expiry = lifetime; otherwise must still be in the future.
  if (couple.premium_expires_at && new Date(couple.premium_expires_at) <= new Date()) return false;
  return true;
}

async function coupleMemoryCount(coupleId) {
  const r = await pool.query('SELECT COUNT(*)::int AS n FROM memories WHERE couple_id = $1', [coupleId]);
  return r.rows[0].n;
}

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

// IANA timezone like 'Europe/Amsterdam', 'America/Argentina/Buenos_Aires', or
// 'UTC'. Loose sanity check to keep junk out of the column; the scheduler does
// authoritative validation when it resolves the zone.
const TZ_RE = /^(?:UTC|[A-Za-z][A-Za-z0-9_+-]*(?:\/[A-Za-z0-9_+-]+){1,2})$/;

// Opportunistically persist the caller's timezone from the X-Timezone header.
// Fire-and-forget and only writes when the value actually changed, so it's
// cheap to call from a frequently-hit endpoint. Needs req.user (auth) set.
function captureTimezone(req) {
  const tz = req.headers['x-timezone'];
  if (!tz || typeof tz !== 'string' || tz.length > 64 || !TZ_RE.test(tz)) return;
  pool
    .query('UPDATE users SET timezone = $1 WHERE id = $2 AND timezone IS DISTINCT FROM $1', [
      tz,
      req.user.id,
    ])
    .catch((e) => console.error('[tz] update failed', e.message));
}

// Find-or-create a user from a verified social identity, linking accounts by
// verified email. Order of resolution:
//   1. A row already owns this provider id  -> use it (refresh name/avatar/email).
//   2. No provider-id match, but a row owns this verified email -> attach the
//      new provider id to that row (e.g. signed up with Google, now Apple).
//   3. Neither -> create a fresh user.
// Both Google and Apple verify email ownership, so an email match is the same
// human; linking is safe. (Apple "Hide My Email" relay addresses simply won't
// match a real Google email, so those land as separate accounts — unavoidable.)
// Runs in a transaction with a row lock on the email so two concurrent first
// sign-ins (one per provider) can't both insert.
async function upsertProviderUser({ provider, providerId, email, name, avatarUrl }) {
  const idCol = provider === 'apple' ? 'apple_id' : 'google_id';
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Existing row for this provider id.
    const byId = await client.query(
      `SELECT id, email, name, avatar_url FROM users WHERE ${idCol} = $1 FOR UPDATE`,
      [providerId]
    );
    if (byId.rows[0]) {
      // Refresh email if we never had one (Apple omits it after first sign-in);
      // refresh avatar from Google. Keep the existing name.
      const u = byId.rows[0];
      const updated = await client.query(
        `UPDATE users
            SET email = COALESCE(email, $2),
                avatar_url = COALESCE($3, avatar_url)
          WHERE id = $1
          RETURNING id, email, name, avatar_url`,
        [u.id, email, avatarUrl || null]
      );
      await client.query('COMMIT');
      return updated.rows[0];
    }

    // 2. No provider-id match — link by verified email if one exists.
    if (email) {
      const byEmail = await client.query(
        'SELECT id, email, name, avatar_url FROM users WHERE email = $1 FOR UPDATE',
        [email]
      );
      if (byEmail.rows[0]) {
        const u = byEmail.rows[0];
        const linked = await client.query(
          `UPDATE users
              SET ${idCol} = $2,
                  name = COALESCE(name, $3),
                  avatar_url = COALESCE(avatar_url, $4)
            WHERE id = $1
            RETURNING id, email, name, avatar_url`,
          [u.id, providerId, name, avatarUrl || null]
        );
        await client.query('COMMIT');
        return linked.rows[0];
      }
    }

    // 3. Brand-new user.
    const created = await client.query(
      `INSERT INTO users (${idCol}, email, name, avatar_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, avatar_url`,
      [providerId, email, name, avatarUrl || null]
    );
    await client.query('COMMIT');
    return created.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Google Sign-In
app.post('/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_AUDIENCES,
    });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    const user = await upsertProviderUser({
      provider: 'google',
      providerId: googleId,
      email,
      name,
      avatarUrl: picture,
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Sign in with Apple. The app sends Apple's identityToken (a JWT signed by
// Apple) plus, ONLY on the very first sign-in, the user's name — Apple never
// returns the name again, and the token itself never carries it. We key on the
// stable Apple `sub`; email comes from the verified token.
app.post('/auth/apple', async (req, res) => {
  try {
    const { identityToken, fullName } = req.body;
    if (!identityToken) return res.status(400).json({ error: 'Missing identityToken' });

    const payload = await appleSignin.verifyIdToken(identityToken, {
      audience: APPLE_BUNDLE_ID,
      ignoreExpiration: false,
    });
    const appleId = payload.sub;
    const email = payload.email || null;
    // fullName is { givenName, familyName } on first sign-in only.
    const name =
      [fullName?.givenName, fullName?.familyName].filter(Boolean).join(' ').trim() ||
      (email ? email.split('@')[0] : 'Friend');

    const user = await upsertProviderUser({
      provider: 'apple',
      providerId: appleId,
      email,
      name,
    });
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
  captureTimezone(req);
  const user = await pool.query(
    'SELECT id, email, name, avatar_url, timezone, last_checklist_viewed_at, last_memories_viewed_at FROM users WHERE id = $1',
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
    // Computed premium status for the client: entitlement + free-tier progress.
    couple.rows[0].premium = isCouplePremium(couple.rows[0]);
    couple.rows[0].memories_count = await coupleMemoryCount(cid);
    couple.rows[0].free_memory_limit = FREE_MEMORY_LIMIT;
  }
  res.json({ user: user.rows[0], couple: couple.rows[0] || null, unreadCount, unreadMemories });
});

// --- Premium (couple-level entitlement) ---

async function activeCoupleId(userId) {
  const r = await pool.query(
    'SELECT id FROM couples WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE LIMIT 1',
    [userId]
  );
  return r.rows[0]?.id ?? null;
}

app.get('/premium/status', auth, async (req, res) => {
  const cid = await activeCoupleId(req.user.id);
  if (!cid) return res.status(400).json({ error: 'Not in a couple' });
  const c = (await pool.query(
    'SELECT is_premium, premium_since, premium_expires_at, premium_product FROM couples WHERE id = $1',
    [cid]
  )).rows[0];
  res.json({
    premium: isCouplePremium(c),
    product: c.premium_product,
    since: c.premium_since,
    expires_at: c.premium_expires_at,
    memories_count: await coupleMemoryCount(cid),
    free_memory_limit: FREE_MEMORY_LIMIT,
  });
});

// Mock subscribe — DEV/test only. The rented account has no Paid Apps
// Agreement, so real IAP isn't possible there; this flips the couple to
// premium so the full gate/paywall/unlock flow is testable. Real StoreKit
// receipt validation replaces this at the Armenia launch.
app.post('/premium/mock-subscribe', auth, async (req, res) => {
  const plan = req.body?.plan === 'yearly' ? 'yearly' : 'monthly';
  const cid = await activeCoupleId(req.user.id);
  if (!cid) return res.status(400).json({ error: 'Not in a couple' });
  const months = plan === 'yearly' ? 12 : 1;
  const r = await pool.query(
    `UPDATE couples
       SET is_premium = TRUE,
           premium_since = COALESCE(premium_since, NOW()),
           premium_expires_at = NOW() + make_interval(months => $2),
           premium_product = $3,
           premium_purchaser_user_id = $1
     WHERE id = $4
     RETURNING is_premium, premium_since, premium_expires_at, premium_product`,
    [req.user.id, months, 'mock_' + plan, cid]
  );
  res.json({ premium: true, ...r.rows[0] });
});

// Mock cancel — testing helper to drop the couple back to free.
app.post('/premium/mock-cancel', auth, async (req, res) => {
  const cid = await activeCoupleId(req.user.id);
  if (!cid) return res.status(400).json({ error: 'Not in a couple' });
  await pool.query(
    'UPDATE couples SET is_premium = FALSE, premium_expires_at = NULL, premium_product = NULL WHERE id = $1',
    [cid]
  );
  res.json({ premium: false });
});

// Restore — server-side entitlement lives on the couple, so restore just
// re-reports current status. Real IAP restore re-validates store receipts.
app.post('/premium/restore', auth, async (req, res) => {
  const cid = await activeCoupleId(req.user.id);
  if (!cid) return res.status(400).json({ error: 'Not in a couple' });
  const c = (await pool.query('SELECT is_premium, premium_expires_at FROM couples WHERE id = $1', [cid])).rows[0];
  res.json({ premium: isCouplePremium(c) });
});

// Delete account: wipes the user and any couple they belong to (with all
// shared swipes/checklist/memories/customs). Apple guideline 5.1.1(v).
app.delete('/me', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.user.id;

    const couples = await client.query(
      'SELECT id, user_a_id, user_b_id FROM couples WHERE user_a_id = $1 OR user_b_id = $1 FOR UPDATE',
      [userId]
    );
    const coupleIds = couples.rows.map(r => r.id);
    const partnerIds = couples.rows
      .map(r => (r.user_a_id === userId ? r.user_b_id : r.user_a_id))
      .filter(id => id && id !== userId);

    if (coupleIds.length > 0) {
      await client.query(
        `DELETE FROM comments WHERE
           (parent_type='memory' AND parent_id IN (SELECT id FROM memories WHERE couple_id = ANY($1::int[])))
           OR (parent_type='plan' AND parent_id IN (SELECT id FROM checklist WHERE couple_id = ANY($1::int[])))`,
        [coupleIds]
      );
      await client.query('DELETE FROM memories WHERE couple_id = ANY($1::int[])', [coupleIds]);
      await client.query('DELETE FROM checklist WHERE couple_id = ANY($1::int[])', [coupleIds]);
      await client.query('DELETE FROM swipes WHERE couple_id = ANY($1::int[])', [coupleIds]);
      await client.query('DELETE FROM activities WHERE couple_id = ANY($1::int[])', [coupleIds]);
      await client.query('DELETE FROM couples WHERE id = ANY($1::int[])', [coupleIds]);
    }

    await client.query('DELETE FROM swipes WHERE user_id = $1', [userId]);
    await client.query('UPDATE memories SET repeat_requested_by = NULL WHERE repeat_requested_by = $1', [userId]);
    await client.query('UPDATE couples SET ended_by = NULL WHERE ended_by = $1', [userId]);
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');

    for (const partnerId of partnerIds) {
      sendPush(pool, partnerId, 'Pairing ended',
        'Your partner deleted their account',
        { route: '/' }
      ).catch(e => console.error('[push] account delete', e.message));
    }

    res.json({ message: 'Account deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
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
    // Notify the inviter — they've been sitting on the share-code screen.
    const inviterId = couple.rows[0].user_a_id;
    pool.query('SELECT name FROM users WHERE id = $1', [req.user.id])
      .then(({ rows }) => {
        if (rows[0]) {
          sendPush(pool, inviterId, 'Paired!',
            `${rows[0].name} joined you`,
            { route: '/swipe' }
          ).catch(e => console.error('[push] invite', e.message));
        }
      }).catch(e => console.error('[push] invite lookup', e.message));
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
      `SELECT id, user_a_id, user_b_id FROM couples
       WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE
       FOR UPDATE`,
      [req.user.id]
    );
    if (couple.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'No active couple' });
    }
    const coupleId = couple.rows[0].id;
    const partnerId = couple.rows[0].user_a_id === req.user.id
      ? couple.rows[0].user_b_id
      : couple.rows[0].user_a_id;
    await client.query('DELETE FROM memories WHERE couple_id = $1', [coupleId]);
    await client.query('DELETE FROM checklist WHERE couple_id = $1', [coupleId]);
    await client.query('DELETE FROM swipes WHERE couple_id = $1', [coupleId]);
    await client.query(
      'UPDATE couples SET active = FALSE, ended_at = NOW(), ended_by = $1 WHERE id = $2',
      [req.user.id, coupleId]
    );
    await client.query('COMMIT');
    // Notify partner after commit — only if there was one (pre-pairing invites have no partner_id).
    if (partnerId) {
      pool.query('SELECT name FROM users WHERE id = $1', [req.user.id])
        .then(({ rows }) => {
          if (!rows[0]) return;
          sendPush(pool, partnerId, 'Pairing ended',
            `${rows[0].name} ended the pairing`,
            { route: '/' }
          ).catch(e => console.error('[push] unpair', e.message));
        }).catch(e => console.error('[push] unpair lookup', e.message));
    }
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
    'SELECT id, is_premium, premium_expires_at FROM couples WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE AND user_b_id IS NOT NULL',
    [req.user.id]
  );
  if (couple.rows.length === 0) {
    return res.status(400).json({ error: 'Not in a couple' });
  }
  const coupleId = couple.rows[0].id;

  // Premium gate: after FREE_MEMORY_LIMIT completed memories, stop showing new
  // cards until the couple subscribes (either partner). They keep their memories.
  if (!isCouplePremium(couple.rows[0]) && (await coupleMemoryCount(coupleId)) >= FREE_MEMORY_LIMIT) {
    return res.json({
      blocked: true,
      premium_required: true,
      message: 'You\'ve made 3 memories together — go Premium to keep going',
    });
  }

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

  // Custom-card prompt trigger. Unlocks once the couple has any memory,
  // or after 30 swipes if the indecisive type never finishes a plan.
  // Per-user cadence: random window around N=10 (or N=20 after the couple
  // has authored 3 customs). Stateful via users.next_prompt_at_swipe so
  // the offset is consistent across calls until it actually fires.
  const memCount = await pool.query(
    'SELECT COUNT(*)::int AS n FROM memories WHERE couple_id = $1',
    [coupleId]
  );
  const customCount = await pool.query(
    'SELECT COUNT(*)::int AS n FROM activities WHERE couple_id = $1 AND parent_activity_id IS NULL',
    [coupleId]
  );
  const userSwipes = await pool.query(
    'SELECT COUNT(*)::int AS n FROM swipes WHERE user_id = $1',
    [req.user.id]
  );
  const memories = memCount.rows[0].n;
  const customs = customCount.rows[0].n;
  const userSwipeCount = userSwipes.rows[0].n;
  const unlocked = memories >= 1 || (userSwipeCount >= 30 && memories === 0);

  if (unlocked) {
    const userRow = await pool.query(
      'SELECT next_prompt_at_swipe, prompts_served FROM users WHERE id = $1',
      [req.user.id]
    );
    let nextAt = userRow.rows[0].next_prompt_at_swipe;
    const served = userRow.rows[0].prompts_served;
    // First time crossing the unlock line — treat this call as the trigger.
    if (nextAt === null) nextAt = userSwipeCount;
    if (userSwipeCount >= nextAt) {
      const N = customs < 3 ? 10 : 20;
      const newNext = userSwipeCount + (N - 2) + Math.floor(Math.random() * 5);
      await pool.query(
        'UPDATE users SET next_prompt_at_swipe = $1, prompts_served = prompts_served + 1 WHERE id = $2',
        [newNext, req.user.id]
      );
      return res.json({ prompt: 'custom', mode: served === 0 ? 'onboarding' : 'recurring' });
    }
  }

  // Loved-memory nudges. Occasionally resurface a past activity the couple
  // enjoyed (both rated >=4) or never rated (giving it a second look). Two
  // paths: (1) a nudge cycle is already in flight — partner already swiped,
  // we owe this user a card; (2) start a new cycle if the cadence hits.
  const coupleRowForSide = await pool.query(
    'SELECT user_a_id FROM couples WHERE id = $1',
    [coupleId]
  );
  const isA = coupleRowForSide.rows[0].user_a_id === req.user.id;
  const myCol = isA ? 'a' : 'b';
  const partnerCol = isA ? 'b' : 'a';

  const pendingNudge = await pool.query(
    `SELECT m.id, m.activity_id,
            a.title AS activity_title, a.tagline AS activity_tagline,
            a.image_url AS activity_image_url, c.name AS activity_category,
            m.completed_at,
            EXTRACT(DAY FROM NOW() - m.completed_at)::int AS days_ago
     FROM memories m
     JOIN activities a ON a.id = m.activity_id
     JOIN categories c ON c.id = a.category_id
     WHERE m.couple_id = $1
       AND m.nudge_response_${myCol} IS NULL
       AND m.nudge_response_${partnerCol} = TRUE
       AND m.activity_id IS NOT NULL
     ORDER BY m.updated_at DESC
     LIMIT 1`,
    [coupleId]
  );
  if (pendingNudge.rows.length > 0) {
    return res.json({ nudge: pendingNudge.rows[0] });
  }

  const nudgeRow = await pool.query(
    'SELECT next_nudge_at_swipe FROM users WHERE id = $1',
    [req.user.id]
  );
  let nextNudgeAt = nudgeRow.rows[0].next_nudge_at_swipe;
  if (nextNudgeAt === null) nextNudgeAt = userSwipeCount + 8 + Math.floor(Math.random() * 6);
  if (userSwipeCount >= nextNudgeAt) {
    const eligible = await pool.query(
      `SELECT m.id, m.activity_id,
              a.title AS activity_title, a.tagline AS activity_tagline,
              a.image_url AS activity_image_url, c.name AS activity_category,
              m.completed_at,
              EXTRACT(DAY FROM NOW() - m.completed_at)::int AS days_ago
       FROM memories m
       JOIN activities a ON a.id = m.activity_id
       JOIN categories c ON c.id = a.category_id
       WHERE m.couple_id = $1
         AND m.completed_at < NOW() - INTERVAL '30 days'
         AND m.activity_id IS NOT NULL
         AND m.repeat_requested_by IS NULL
         AND m.nudge_response_a IS NULL
         AND m.nudge_response_b IS NULL
         AND (m.last_nudged_at IS NULL OR m.last_nudged_at < NOW() - INTERVAL '180 days')
         AND (
           (m.rating_a >= 4 AND m.rating_b >= 4)
           OR (m.rating_a IS NULL AND m.rating_b IS NULL)
         )
       ORDER BY RANDOM()
       LIMIT 1`,
      [coupleId]
    );
    const newNextNudge = userSwipeCount + 12 + Math.floor(Math.random() * 6);
    await pool.query(
      'UPDATE users SET next_nudge_at_swipe = $1 WHERE id = $2',
      [newNextNudge, req.user.id]
    );
    if (eligible.rows.length > 0) {
      return res.json({ nudge: eligible.rows[0] });
    }
  } else if (nudgeRow.rows[0].next_nudge_at_swipe === null) {
    await pool.query(
      'UPDATE users SET next_nudge_at_swipe = $1 WHERE id = $2',
      [nextNudgeAt, req.user.id]
    );
  }

  // Exclude cards that are: liked (already matched/in flight), already
  // re-shown once (no third chance), or skipped within the last 30 days
  // (cooldown). Skipped >30d ago with re_show_count = 0 falls through and
  // gets re-surfaced.
  const activities = await pool.query(
    `SELECT a.*, c.name as category_name
     FROM activities a
     JOIN categories c ON c.id = a.category_id
     WHERE a.id NOT IN (
       SELECT activity_id FROM swipes
       WHERE user_id = $1 AND couple_id = $2
         AND (
           liked = TRUE
           OR re_show_count >= 1
           OR swiped_at > NOW() - INTERVAL '30 days'
         )
     )
     AND a.parent_activity_id IS NULL
     AND ($3 = ANY(a.seasons) OR 'all' = ANY(a.seasons))
     AND (
       a.couple_id = $2
       OR (a.couple_id IS NULL AND a.difficulty <= $4)
     )
     ORDER BY (a.couple_id IS NOT NULL) DESC, a.difficulty, RANDOM()
     LIMIT 5`,
    [req.user.id, coupleId, season, maxDifficulty]
  );

  if (activities.rows.length === 0) {
    return res.json({ done: true, message: 'No more activities to swipe' });
  }
  res.json({ queue: activities.rows });
});

// Create a custom top-level swipe card. Couple-private (couple_id set).
// Creator implicitly swipes yes — partner sees it in the deck and decides.
// Defaults: category=5 (Daily), seasons=['all']. Difficulty 1–5, default 1.
app.post('/activities/custom', auth, async (req, res) => {
  const title = (req.body.title || '').trim();
  const tagline = (req.body.tagline || '').trim() || null;
  const difficulty = Number.isInteger(req.body.difficulty) ? req.body.difficulty : 1;
  const categoryId = Number.isInteger(req.body.category_id) ? req.body.category_id : 5;
  if (!title || title.length > 80) return res.status(400).json({ error: 'Title required, max 80 chars' });
  if (tagline && tagline.length > 120) return res.status(400).json({ error: 'Tagline max 120 chars' });
  if (difficulty < 1 || difficulty > 5) return res.status(400).json({ error: 'Difficulty must be 1-5' });

  const couple = await pool.query(
    'SELECT id FROM couples WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE AND user_b_id IS NOT NULL',
    [req.user.id]
  );
  if (couple.rows.length === 0) return res.status(400).json({ error: 'Not in a couple' });
  const coupleId = couple.rows[0].id;

  const cat = await pool.query('SELECT id FROM categories WHERE id = $1', [categoryId]);
  if (cat.rows.length === 0) return res.status(400).json({ error: 'Invalid category' });

  // The activities table has a BEFORE INSERT trigger that rewrites
  // difficulty=3 to the category default (it can't distinguish user-passed
  // 3 from the column default). Insert without difficulty, then UPDATE.
  const newAct = await pool.query(
    `INSERT INTO activities (category_id, title, tagline, seasons, couple_id)
     VALUES ($1, $2, $3, ARRAY['all'], $4)
     RETURNING id, title, tagline, category_id, couple_id`,
    [categoryId, title, tagline, coupleId]
  );
  const activity = newAct.rows[0];
  await pool.query('UPDATE activities SET difficulty = $1 WHERE id = $2', [difficulty, activity.id]);
  activity.difficulty = difficulty;

  await pool.query(
    'INSERT INTO swipes (user_id, couple_id, activity_id, liked) VALUES ($1, $2, $3, TRUE)',
    [req.user.id, coupleId, activity.id]
  );

  res.json(activity);
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

  // First swipe: plain insert. Re-swipe (after a 30d-old skip): update the
  // existing row, bump re_show_count so we never resurface it again. The
  // WHERE on the upsert restricts the update to that one case so an
  // already-liked or already-re-shown row stays untouched.
  await pool.query(
    `INSERT INTO swipes (user_id, couple_id, activity_id, liked) VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, couple_id, activity_id) DO UPDATE SET
       liked = EXCLUDED.liked,
       swiped_at = NOW(),
       re_show_count = swipes.re_show_count + 1
     WHERE swipes.liked = FALSE AND swipes.re_show_count = 0`,
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
      // Notify partner — acting user sees the match modal in-app.
      pool.query(
        `SELECT u.name as me_name, a.title as activity_title
         FROM users u, activities a WHERE u.id = $1 AND a.id = $2`,
        [req.user.id, activityId]
      ).then(({ rows }) => {
        if (rows[0]) {
          sendPush(pool, partnerId, 'You matched!',
            `${rows[0].me_name} also picked ${rows[0].activity_title}`,
            { route: '/checklist' }
          ).catch(e => console.error('[push] match', e.message));
        }
      }).catch(e => console.error('[push] match lookup', e.message));
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
    `SELECT cl.*, a.title, a.tagline, a.image_url, a.is_journey, c.name as category_name
     FROM checklist cl
     JOIN activities a ON a.id = cl.activity_id
     JOIN categories c ON c.id = a.category_id
     WHERE cl.couple_id = $1
       AND (cl.status <> 'done' OR cl.parent_checklist_id IS NOT NULL)
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
  const bothApproved = item.rows[0].approved_by_a && item.rows[0].approved_by_b;
  if (bothApproved) {
    await pool.query(
      "UPDATE checklist SET status = 'approved', approved_at = NOW(), updated_at = NOW() WHERE id = $1",
      [req.params.id]
    );
    // If the approved activity is a journey, spawn its sub-checklist rows.
    // Subs are auto-approved — the couple committed to the journey theme, so
    // each step skips the swipe/approve dance. Idempotent via NOT EXISTS.
    await pool.query(
      `INSERT INTO checklist (couple_id, activity_id, parent_checklist_id,
                              approved_by_a, approved_by_b, approved_at, status)
       SELECT $1, sub.id, $2, TRUE, TRUE, NOW(), 'approved'
       FROM activities parent
       JOIN activities sub ON sub.parent_activity_id = parent.id
       WHERE parent.id = (SELECT activity_id FROM checklist WHERE id = $2)
         AND parent.is_journey = TRUE
         AND NOT EXISTS (
           SELECT 1 FROM checklist sc
           WHERE sc.parent_checklist_id = $2 AND sc.activity_id = sub.id
         )`,
      [c.id, req.params.id]
    );
  }
  // Notify partner — context-aware copy.
  const partnerId = isA ? c.user_b_id : c.user_a_id;
  pool.query(
    `SELECT u.name as me_name, a.title as activity_title
     FROM users u, checklist cl JOIN activities a ON a.id = cl.activity_id
     WHERE u.id = $1 AND cl.id = $2`,
    [req.user.id, req.params.id]
  ).then(({ rows }) => {
    if (!rows[0]) return;
    const title = bothApproved ? 'Plan set!' : 'Approval needed';
    const body = bothApproved
      ? `${rows[0].me_name} confirmed — ${rows[0].activity_title} is on`
      : `${rows[0].me_name} wants to do ${rows[0].activity_title}`;
    sendPush(pool, partnerId, title, body, { route: '/checklist' })
      .catch(e => console.error('[push] approve', e.message));
  }).catch(e => console.error('[push] approve lookup', e.message));

  res.json({ approved: true });
});

// Add a custom sub-step to a journey already on the couple's checklist.
// The new activity is couple-scoped (couple_id set), the new checklist row
// auto-approved — same shape as the auto-spawned subs, just user-authored.
app.post('/checklist/:id/custom-substep', auth, async (req, res) => {
  const title = (req.body.title || '').trim();
  const tagline = (req.body.tagline || '').trim() || null;
  if (!title || title.length > 80) return res.status(400).json({ error: 'Title required, max 80 chars' });
  if (tagline && tagline.length > 120) return res.status(400).json({ error: 'Tagline max 120 chars' });

  const couple = await pool.query(
    'SELECT id FROM couples WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE',
    [req.user.id]
  );
  if (couple.rows.length === 0) return res.status(400).json({ error: 'Not in a couple' });
  const c = couple.rows[0];

  const parent = await pool.query(
    `SELECT cl.id, cl.couple_id, cl.parent_checklist_id, a.id AS activity_id, a.is_journey, a.category_id
     FROM checklist cl JOIN activities a ON a.id = cl.activity_id
     WHERE cl.id = $1`,
    [req.params.id]
  );
  if (parent.rows.length === 0) return res.status(404).json({ error: 'Parent checklist not found' });
  const p = parent.rows[0];
  if (p.couple_id !== c.id) return res.status(403).json({ error: 'Not your checklist' });
  if (!p.is_journey) return res.status(400).json({ error: 'Parent is not a journey' });
  if (p.parent_checklist_id !== null) return res.status(400).json({ error: 'Cannot nest under a sub-step' });

  const newActivity = await pool.query(
    `INSERT INTO activities (category_id, title, tagline, seasons, difficulty, parent_activity_id, couple_id)
     VALUES ($1, $2, $3, ARRAY['all'], 1, $4, $5)
     RETURNING id`,
    [p.category_id, title, tagline, p.activity_id, c.id]
  );
  const activityId = newActivity.rows[0].id;

  const newRow = await pool.query(
    `INSERT INTO checklist (couple_id, activity_id, parent_checklist_id,
                            approved_by_a, approved_by_b, approved_at, status)
     VALUES ($1, $2, $3, TRUE, TRUE, NOW(), 'approved')
     RETURNING id, activity_id, status, approved_by_a, approved_by_b, parent_checklist_id`,
    [c.id, activityId, p.id]
  );

  res.json({ ...newRow.rows[0], title, tagline, is_journey: false });
});

// Complete checklist item
app.post('/checklist/:id/complete', auth, async (req, res) => {
  const couple = await pool.query(
    'SELECT id, user_a_id, user_b_id, is_premium, premium_expires_at FROM couples WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE',
    [req.user.id]
  );
  if (couple.rows.length === 0) return res.status(400).json({ error: 'Not in a couple' });

  const c = couple.rows[0];

  // Premium gate: block completing a plan once the couple has hit the free
  // memory limit (a completion would create memory #4). Either partner subscribing unlocks both.
  if (!isCouplePremium(c) && (await coupleMemoryCount(c.id)) >= FREE_MEMORY_LIMIT) {
    return res.status(402).json({
      error: 'Premium required',
      premium_required: true,
      message: 'You\'ve made 3 memories together — go Premium to complete more',
    });
  }
  const isA = c.user_a_id === req.user.id;
  const field = isA ? 'completed_by_a' : 'completed_by_b';

  await pool.query(
    `UPDATE checklist SET ${field} = TRUE, updated_at = NOW() WHERE id = $1 AND couple_id = $2`,
    [req.params.id, c.id]
  );

  const item = await pool.query(
    `SELECT cl.*, a.is_journey
     FROM checklist cl JOIN activities a ON a.id = cl.activity_id
     WHERE cl.id = $1`,
    [req.params.id]
  );
  const isSub = item.rows[0].parent_checklist_id !== null;
  const isJourney = item.rows[0].is_journey === true;
  const bothDone = item.rows[0].completed_by_a && item.rows[0].completed_by_b;
  if (bothDone) {
    await pool.query(
      "UPDATE checklist SET status = 'done', completed_at = NOW(), updated_at = NOW() WHERE id = $1",
      [req.params.id]
    );
    // Sub-steps never create their own memory — the journey rolls up into
    // one rich memory when the parent completes.
    if (!isSub) {
      let journeySteps = null;
      if (isJourney) {
        const steps = await pool.query(
          `SELECT a.title
           FROM checklist sc JOIN activities a ON a.id = sc.activity_id
           WHERE sc.parent_checklist_id = $1 AND sc.status = 'done'
           ORDER BY sc.completed_at`,
          [req.params.id]
        );
        journeySteps = steps.rows.map(r => r.title);
      }
      await pool.query(
        `INSERT INTO memories (couple_id, checklist_id, activity_id, activity_title, activity_tagline, activity_image_url, activity_category, journey_steps)
         SELECT $1, $2, a.id, a.title, a.tagline, a.image_url, cat.name, $3
         FROM activities a
         JOIN categories cat ON cat.id = a.category_id
         JOIN checklist cl ON cl.activity_id = a.id
         WHERE cl.id = $2`,
        [c.id, req.params.id, journeySteps]
      );
    }
  }
  // Notify partner.
  const partnerId = isA ? c.user_b_id : c.user_a_id;
  pool.query(
    `SELECT u.name as me_name, a.title as activity_title
     FROM users u, checklist cl JOIN activities a ON a.id = cl.activity_id
     WHERE u.id = $1 AND cl.id = $2`,
    [req.user.id, req.params.id]
  ).then(({ rows }) => {
    if (!rows[0]) return;
    let title, body, route;
    if (isSub) {
      title = bothDone ? 'Step done' : 'Step checked off';
      body = `${rows[0].me_name} ✓ ${rows[0].activity_title}`;
      route = '/checklist';
    } else {
      title = bothDone ? 'Memory added' : 'Did you do it too?';
      body = bothDone
        ? `You two did ${rows[0].activity_title}`
        : `${rows[0].me_name} marked ${rows[0].activity_title} done`;
      route = bothDone ? '/memories' : '/checklist';
    }
    sendPush(pool, partnerId, title, body, { route })
      .catch(e => console.error('[push] complete', e.message));
  }).catch(e => console.error('[push] complete lookup', e.message));

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
            repeat_requested_by, repeat_requested_at, journey_steps
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
    journey_steps: r.journey_steps,
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
    'SELECT id, user_a_id, user_b_id FROM couples WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE',
    [req.user.id]
  );
  if (couple.rows.length === 0) return res.status(400).json({ error: 'Not in a couple' });
  const c = couple.rows[0];
  const result = await pool.query(
    `UPDATE memories
     SET repeat_requested_by = $1, repeat_requested_at = NOW(), updated_at = NOW()
     WHERE id = $2 AND couple_id = $3 AND repeat_requested_by IS NULL
     RETURNING *`,
    [req.user.id, req.params.id, c.id]
  );
  if (result.rows.length === 0) return res.status(409).json({ error: 'Already requested or not found' });
  // Notify partner.
  const partnerId = c.user_a_id === req.user.id ? c.user_b_id : c.user_a_id;
  pool.query('SELECT name FROM users WHERE id = $1', [req.user.id])
    .then(({ rows }) => {
      if (!rows[0]) return;
      sendPush(pool, partnerId, 'Do it again?',
        `${rows[0].name} wants to repeat ${result.rows[0].activity_title}`,
        { route: `/memories/${req.params.id}` }
      ).catch(e => console.error('[push] repeat', e.message));
    }).catch(e => console.error('[push] repeat lookup', e.message));
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

// Swipe on a memory nudge. Separate from /activities/:id/swipe because the
// underlying activity already has a swipe row from the original cycle —
// nudge state lives on the memories row instead. Both 'yes' → checklist
// entry, either 'no' → 180d cooldown.
app.post('/memories/:id/nudge-swipe', auth, async (req, res) => {
  const memoryId = req.params.id;
  const liked = !!req.body.liked;
  const couple = await pool.query(
    'SELECT id, user_a_id, user_b_id FROM couples WHERE (user_a_id = $1 OR user_b_id = $1) AND active = TRUE AND user_b_id IS NOT NULL',
    [req.user.id]
  );
  if (couple.rows.length === 0) return res.status(400).json({ error: 'Not in a couple' });
  const c = couple.rows[0];
  const isA = c.user_a_id === req.user.id;
  const myCol = isA ? 'a' : 'b';

  const memory = await pool.query(
    'SELECT * FROM memories WHERE id = $1 AND couple_id = $2',
    [memoryId, c.id]
  );
  if (memory.rows.length === 0) return res.status(404).json({ error: 'Memory not found' });
  const m = memory.rows[0];

  // Stale swipe: cycle already resolved (cooldown active). Ignore.
  if (m.last_nudged_at && (Date.now() - new Date(m.last_nudged_at).getTime() < 180 * 86400 * 1000)) {
    return res.json({ match: false, stale: true });
  }
  // Already responded
  if ((isA && m.nudge_response_a !== null) || (!isA && m.nudge_response_b !== null)) {
    return res.json({ match: false, already: true });
  }

  await pool.query(
    `UPDATE memories SET nudge_response_${myCol} = $1, updated_at = NOW() WHERE id = $2`,
    [liked, memoryId]
  );

  if (!liked) {
    await pool.query(
      'UPDATE memories SET last_nudged_at = NOW(), nudge_response_a = NULL, nudge_response_b = NULL WHERE id = $1',
      [memoryId]
    );
    return res.json({ match: false });
  }

  const partnerResp = isA ? m.nudge_response_b : m.nudge_response_a;
  if (partnerResp === true) {
    await pool.query(
      'INSERT INTO checklist (couple_id, activity_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [c.id, m.activity_id]
    );
    await pool.query(
      'UPDATE memories SET last_nudged_at = NOW(), nudge_response_a = NULL, nudge_response_b = NULL WHERE id = $1',
      [memoryId]
    );
    const partnerId = isA ? c.user_b_id : c.user_a_id;
    sendPush(pool, partnerId, 'You both want it again!',
      `${m.activity_title} is back on the list`,
      { route: '/checklist' }
    ).catch(e => console.error('[push] nudge match', e.message));
    return res.json({ match: true, message: 'Bringing it back!' });
  }

  res.json({ match: false });
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

  // Notify partner — truncate long comments for the push body.
  const partnerId = parent.user_a_id === req.user.id ? parent.user_b_id : parent.user_a_id;
  if (partnerId) {
    pool.query('SELECT name FROM users WHERE id = $1', [req.user.id])
      .then(({ rows }) => {
        if (!rows[0]) return;
        const preview = text.length > 80 ? text.slice(0, 77) + '…' : text;
        const route = parentType === 'plan' ? `/checklist/${id}` : `/memories/${id}`;
        sendPush(pool, partnerId, `${rows[0].name} commented`, preview, { route })
          .catch(e => console.error('[push] comment', e.message));
      }).catch(e => console.error('[push] comment lookup', e.message));
  }

  res.json({ id: result.rows[0].id, created_at: result.rows[0].created_at });
});

// Register an Expo push token for the authed user. Called by the app after
// the OS grants notification permission. Idempotent: re-registering the same
// token just bumps updated_at (and moves ownership if a different user claimed it).
app.post('/push/register', auth, async (req, res) => {
  const { token, platform } = req.body;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'token required' });
  }
  await pool.query(
    `INSERT INTO push_tokens (user_id, token, platform)
     VALUES ($1, $2, $3)
     ON CONFLICT (token) DO UPDATE SET user_id = $1, platform = $3, updated_at = NOW()`,
    [req.user.id, token, platform || null]
  );
  res.json({ ok: true });
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
