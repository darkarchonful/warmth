const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// data: { route?: '/plans/123', ... } — picked up by the app's notification tap handler
async function sendPush(pool, userId, title, body, data = {}) {
  const rows = await pool.query(
    'SELECT token FROM push_tokens WHERE user_id = $1',
    [userId]
  );
  if (rows.rows.length === 0) return;

  const messages = rows.rows.map(r => ({
    to: r.token,
    sound: 'default',
    title,
    body,
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
