// Server-scheduled push notifications. Run as a k3s CronJob once an hour
// (schedule "0 * * * *"); it evaluates every rule, sends, and exits. NOT part
// of the long-running API process — same image, different entrypoint
// (`node src/scheduler.js`).
//
// Two notification families live here:
//   C — time events: fire at a fixed *local* hour (weekend prompt).
//   B — app events:  fire when a derived condition becomes true (on-a-roll
//                    milestone, activity asymmetry).
//
// Local time is resolved in Postgres via `now() AT TIME ZONE u.timezone`
// (Postgres ships the full IANA tz database), so there is no date math here
// and no DST footgun. Users with a NULL timezone are skipped until the client
// reports one (captured opportunistically on /me).
//
// Every send is gated through claim() — an atomic INSERT into notifications_log
// that both dedups (PK on user_id+dedup_key) and enforces the per-type
// frequency cap. Only a winning insert actually pushes, so overlapping or
// retried runs never double-send.

const { Pool } = require('pg');
const { sendPush } = require('./push');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Attempt to reserve a send. Returns true iff this call won the row (i.e. we
// should push now). `capInterval` (e.g. '7 days') enforces "at most once per
// window" for this type; omit for keys that are already self-limiting (a
// per-local-date dedup_key can only fire once that day anyway).
async function claim(userId, type, dedupKey, capInterval) {
  const cap = capInterval
    ? `AND NOT EXISTS (SELECT 1 FROM notifications_log
                       WHERE user_id = $1 AND type = $2 AND sent_at > now() - $4::interval)`
    : '';
  const params = capInterval ? [userId, type, dedupKey, capInterval] : [userId, type, dedupKey];
  // Cast $2/$3 explicitly: without it Postgres deduces $2 as `text` from the
  // SELECT position but `varchar` from the cap subquery's `type = $2`, and
  // rejects the conflicting deduction (only bites the capped rules).
  const r = await pool.query(
    `INSERT INTO notifications_log (user_id, type, dedup_key)
     SELECT $1, $2::varchar, $3::varchar WHERE TRUE ${cap}
     ON CONFLICT (user_id, dedup_key) DO NOTHING
     RETURNING user_id`,
    params
  );
  return r.rows.length > 0;
}

// Send to one user, but only if we won the dedup claim. Releases the claim if
// the user turns out to be unreachable so the cap isn't burned on a no-op —
// candidate queries already require a token, but a token can vanish between
// query and send.
async function dispatch({ userId, type, dedupKey, capInterval, title, body, data }) {
  if (!(await claim(userId, type, dedupKey, capInterval))) return false;
  try {
    await sendPush(pool, userId, title, body, data);
    return true;
  } catch (e) {
    console.error(`[scheduler] send failed type=${type} user=${userId}:`, e.message);
    return false;
  }
}

// ---------------------------------------------------------------------------
// C2 — Weekend prompt. Friday (DOW 5) at local 18:00, to both partners — but
// only for couples who let the whole week pass without planning anything (no
// match in the last 7 days). Skips brand-new couples: those paired within the
// last 7 days get a first-week grace period so we don't nag a pair that just
// joined. A match here = a checklist row (both swiped the same card). We only
// see in-app activity, so a couple that planned offline may still get this —
// that's an acceptable nudge, far better than missing the genuinely dormant.
// Once-per-local-date via dedup_key.
// ---------------------------------------------------------------------------
async function weekendPrompt() {
  const { rows } = await pool.query(`
    SELECT u.id, (now() AT TIME ZONE u.timezone)::date::text AS localdate
    FROM users u
    JOIN couples c ON c.active AND c.user_b_id IS NOT NULL
                  AND (c.user_a_id = u.id OR c.user_b_id = u.id)
    WHERE u.timezone IS NOT NULL
      AND EXISTS (SELECT 1 FROM push_tokens pt WHERE pt.user_id = u.id)
      AND EXTRACT(DOW  FROM (now() AT TIME ZONE u.timezone)) = 5
      AND EXTRACT(HOUR FROM (now() AT TIME ZONE u.timezone)) = 18
      AND c.paired_at < now() - interval '7 days'
      AND NOT EXISTS (
        SELECT 1 FROM checklist ch
        WHERE ch.couple_id = c.id
          AND ch.matched_at > now() - interval '7 days'
      )
  `);
  let sent = 0;
  for (const r of rows) {
    if (await dispatch({
      userId: r.id, type: 'weekend', dedupKey: `weekend:${r.localdate}`,
      title: "The weekend's almost here 🗓️", body: 'Make a plan together for this weekend.',
      data: { route: '/swipe' },
    })) sent++;
  }
  return { rule: 'C2 weekend', candidates: rows.length, sent };
}

// ---------------------------------------------------------------------------
// B2 — "On a roll" milestone. Couple has >=3 completed memories, the most
// recent is >=3 days old, and nothing is in flight (no checklist item that
// isn't 'done'). Both partners, at local 18:00. Capped to once per 7 days.
// ---------------------------------------------------------------------------
async function onARoll() {
  const { rows } = await pool.query(`
    SELECT u.id,
           (now() AT TIME ZONE u.timezone)::date::text AS localdate,
           (SELECT count(*) FROM memories m WHERE m.couple_id = c.id) AS cnt
    FROM couples c
    JOIN users u ON (u.id = c.user_a_id OR u.id = c.user_b_id)
    WHERE c.active AND c.user_b_id IS NOT NULL
      AND u.timezone IS NOT NULL
      AND EXISTS (SELECT 1 FROM push_tokens pt WHERE pt.user_id = u.id)
      AND EXTRACT(HOUR FROM (now() AT TIME ZONE u.timezone)) = 18
      AND (SELECT count(*)        FROM memories m WHERE m.couple_id = c.id) >= 3
      AND (SELECT max(completed_at) FROM memories m WHERE m.couple_id = c.id) < now() - interval '3 days'
      AND NOT EXISTS (SELECT 1 FROM checklist cl WHERE cl.couple_id = c.id AND cl.status <> 'done')
  `);
  let sent = 0;
  for (const r of rows) {
    if (await dispatch({
      userId: r.id, type: 'on_a_roll', dedupKey: `on_a_roll:${r.localdate}`,
      capInterval: '7 days',
      title: "You're on a roll 🔥",
      body: `${r.cnt} dates done together — what's next?`,
      data: { route: '/swipe' },
    })) sent++;
  }
  return { rule: 'B2 on_a_roll', candidates: rows.length, sent };
}

// ---------------------------------------------------------------------------
// B4 — Asymmetry nudge. One partner swiped within 2 days, the other hasn't in
// 5+ days; nudge only the silent one, at their local 18:00. Capped to once per
// 4 days so it never turns into nagging.
// ---------------------------------------------------------------------------
async function asymmetryNudge() {
  const { rows } = await pool.query(`
    SELECT silent.id AS user_id,
           partner.name AS partner_name,
           (now() AT TIME ZONE silent.timezone)::date::text AS localdate
    FROM couples c
    JOIN users silent  ON silent.id  IN (c.user_a_id, c.user_b_id)
    JOIN users partner ON partner.id IN (c.user_a_id, c.user_b_id) AND partner.id <> silent.id
    WHERE c.active AND c.user_b_id IS NOT NULL
      AND silent.timezone IS NOT NULL
      AND EXISTS (SELECT 1 FROM push_tokens pt WHERE pt.user_id = silent.id)
      AND EXTRACT(HOUR FROM (now() AT TIME ZONE silent.timezone)) = 18
      AND EXISTS     (SELECT 1 FROM swipes s WHERE s.user_id = partner.id AND s.swiped_at > now() - interval '2 days')
      AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.user_id = silent.id  AND s.swiped_at > now() - interval '5 days')
  `);
  let sent = 0;
  for (const r of rows) {
    const who = r.partner_name || 'Your partner';
    if (await dispatch({
      userId: r.user_id, type: 'asymmetry', dedupKey: `asymmetry:${r.localdate}`,
      capInterval: '4 days',
      title: `${who} is planning dates 💛`,
      body: 'Jump back in?',
      data: { route: '/swipe' },
    })) sent++;
  }
  return { rule: 'B4 asymmetry', candidates: rows.length, sent };
}

// ---------------------------------------------------------------------------
// D1 — Stale plan nudge. A plan both partners approved but still haven't marked
// done (2 days for a couple's first plan, 3 days after that). The Warmth bot
// drops a card-specific line into that plan's
// comment thread and pushes both partners a notification linking to the chat.
// Fires once per plan — guarded by "no Warmth-bot comment on this plan yet", so
// it's naturally idempotent across hourly runs and never nags twice. Posted
// only when it's ~local evening for at least one partner, so the push isn't a
// 3am ping. Auto-spawned journey sub-steps (parent_checklist_id NOT NULL) are
// skipped — only the top-level plan the couple actually swiped on gets nudged.
//
// Unlike the B/C rules this doesn't go through claim()/notifications_log: the
// posted comment IS the dedup ledger (the NOT EXISTS guard), and the push is
// best-effort on top. The bot user id is looked up by its reserved email.
// ---------------------------------------------------------------------------
async function stalePlanNudge() {
  const bot = await pool.query("SELECT id FROM users WHERE email = 'bot@warmth.internal'");
  if (!bot.rows[0]) return { rule: 'D1 stale_plan', candidates: 0, posted: 0, note: 'no bot user' };
  const botId = bot.rows[0].id;

  const { rows } = await pool.query(`
    SELECT cl.id AS plan_id, c.user_a_id, c.user_b_id,
           COALESCE(
             a.nudge_text,
             'You both said yes to ' || a.title || ' a few days ago — don''t be shy, pick a time 💛'
           ) AS msg
    FROM checklist cl
    JOIN couples c    ON c.id = cl.couple_id AND c.active AND c.user_b_id IS NOT NULL
    JOIN activities a ON a.id = cl.activity_id
    WHERE cl.status = 'approved'
      AND cl.parent_checklist_id IS NULL
      -- The couple's very first plan nudges after 2 days (build the habit
      -- early); every plan after that waits the full 3. "First" = the lowest-id
      -- top-level plan for the couple.
      AND cl.approved_at < now() - (
        CASE WHEN cl.id = (SELECT min(id) FROM checklist
                           WHERE couple_id = c.id AND parent_checklist_id IS NULL)
             THEN interval '2 days' ELSE interval '3 days' END
      )
      AND NOT EXISTS (
        SELECT 1 FROM comments cm
        WHERE cm.parent_type = 'plan' AND cm.parent_id = cl.id AND cm.user_id = $1
      )
      AND EXISTS (
        SELECT 1 FROM users u
        WHERE u.id IN (c.user_a_id, c.user_b_id)
          AND u.timezone IS NOT NULL
          AND EXTRACT(HOUR FROM (now() AT TIME ZONE u.timezone)) = 18
      )
  `, [botId]);

  let posted = 0;
  for (const r of rows) {
    // Post the bot comment first — it's the idempotency guard, so even if the
    // pushes below fail, the next run sees it and won't repost.
    await pool.query(
      "INSERT INTO comments (parent_type, parent_id, user_id, text) VALUES ('plan', $1, $2, $3)",
      [r.plan_id, botId, r.msg]
    );
    // Bump the plan so both partners get the unread nav dot (don't touch
    // last_comment_seen — it should read as unseen for both).
    await pool.query('UPDATE checklist SET updated_at = now() WHERE id = $1', [r.plan_id]);
    posted++;
    for (const uid of [r.user_a_id, r.user_b_id]) {
      try {
        await sendPush(pool, uid, 'Warmth 💛', r.msg, { route: `/checklist/${r.plan_id}` });
      } catch (e) {
        console.error(`[scheduler] D1 push failed plan=${r.plan_id} user=${uid}:`, e.message);
      }
    }
  }
  return { rule: 'D1 stale_plan', candidates: rows.length, posted };
}

async function main() {
  const started = new Date().toISOString();
  const results = [];
  for (const rule of [weekendPrompt, onARoll, asymmetryNudge, stalePlanNudge]) {
    try {
      results.push(await rule());
    } catch (e) {
      console.error(`[scheduler] rule ${rule.name} threw:`, e.message);
      results.push({ rule: rule.name, error: e.message });
    }
  }
  console.log(`[scheduler] ${started}`, JSON.stringify(results));
  await pool.end();
}

main().catch((e) => {
  console.error('[scheduler] fatal', e);
  process.exit(1);
});
