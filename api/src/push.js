const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// The icon badge mirrors the in-app unread total — unread plan changes plus
// unread memories, the same two counts /me returns for the nav dots. Computed
// fresh at send time so the number on the icon matches what the user sees
// inside. Returns 0 when the user isn't in an active couple.
async function unreadBadgeCount(pool, userId) {
  const { rows } = await pool.query(
    `SELECT (
        (SELECT COUNT(*) FROM checklist cl
           WHERE cl.couple_id = c.id
             AND (u.last_checklist_viewed_at IS NULL OR cl.updated_at > u.last_checklist_viewed_at))
      + (SELECT COUNT(*) FROM memories m
           WHERE m.couple_id = c.id
             AND (u.last_memories_viewed_at IS NULL OR m.updated_at > u.last_memories_viewed_at))
     )::int AS total
     FROM users u
     JOIN couples c ON c.active = TRUE AND (c.user_a_id = u.id OR c.user_b_id = u.id)
     WHERE u.id = $1
     LIMIT 1`,
    [userId]
  );
  return rows[0] ? rows[0].total : 0;
}

// data: { route?: '/plans/123', ... } — picked up by the app's notification tap handler
async function sendPush(pool, userId, title, body, data = {}) {
  const rows = await pool.query(
    'SELECT token FROM push_tokens WHERE user_id = $1',
    [userId]
  );
  if (rows.rows.length === 0) return;

  const badge = await unreadBadgeCount(pool, userId);
  const messages = rows.rows.map(r => ({
    to: r.token,
    sound: 'default',
    title,
    body,
    badge,
    data,
  }));

  let tickets;
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(messages),
    });
    const json = await res.json();
    tickets = json.data || [];
  } catch (err) {
    console.error('[push] send failed', err.message);
    return;
  }

  const deadTokens = [];
  tickets.forEach((t, i) => {
    if (t.status === 'error' && t.details?.error === 'DeviceNotRegistered') {
      deadTokens.push(messages[i].to);
    }
  });
  if (deadTokens.length > 0) {
    await pool.query('DELETE FROM push_tokens WHERE token = ANY($1)', [deadTokens]);
  }
}

module.exports = { sendPush };
