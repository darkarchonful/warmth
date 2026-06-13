-- App Review demo couple seed. Re-running resets the demo data.
BEGIN;

-- 1. Two users: reviewer logs in as the first; the second is just the partner.
INSERT INTO users (email, name, name_confirmed, intro_seen)
VALUES ('appreview@warmth.dbtvault-solutions.tech', 'Alex', TRUE, TRUE)
ON CONFLICT (email) DO UPDATE SET name='Alex', name_confirmed=TRUE, intro_seen=TRUE;

INSERT INTO users (email, name, name_confirmed, intro_seen)
VALUES ('appreview.partner@warmth.dbtvault-solutions.tech', 'Sam', TRUE, TRUE)
ON CONFLICT (email) DO UPDATE SET name='Sam', name_confirmed=TRUE, intro_seen=TRUE;

-- 2. Clean prior demo state, then pair fresh.
DELETE FROM comments WHERE parent_type IN ('plan','memory') AND parent_id IN (
  SELECT id FROM checklist WHERE couple_id IN (
    SELECT id FROM couples
    WHERE user_a_id IN (SELECT id FROM users WHERE email LIKE 'appreview%@warmth.dbtvault-solutions.tech')
       OR user_b_id IN (SELECT id FROM users WHERE email LIKE 'appreview%@warmth.dbtvault-solutions.tech')));
DELETE FROM memories  WHERE couple_id IN (SELECT id FROM couples WHERE user_a_id IN (SELECT id FROM users WHERE email LIKE 'appreview%@warmth.dbtvault-solutions.tech') OR user_b_id IN (SELECT id FROM users WHERE email LIKE 'appreview%@warmth.dbtvault-solutions.tech'));
DELETE FROM checklist WHERE couple_id IN (SELECT id FROM couples WHERE user_a_id IN (SELECT id FROM users WHERE email LIKE 'appreview%@warmth.dbtvault-solutions.tech') OR user_b_id IN (SELECT id FROM users WHERE email LIKE 'appreview%@warmth.dbtvault-solutions.tech'));
DELETE FROM swipes    WHERE couple_id IN (SELECT id FROM couples WHERE user_a_id IN (SELECT id FROM users WHERE email LIKE 'appreview%@warmth.dbtvault-solutions.tech') OR user_b_id IN (SELECT id FROM users WHERE email LIKE 'appreview%@warmth.dbtvault-solutions.tech'));
UPDATE couples SET ended_by = NULL WHERE ended_by IN (SELECT id FROM users WHERE email LIKE 'appreview%@warmth.dbtvault-solutions.tech');
DELETE FROM couples WHERE user_a_id IN (SELECT id FROM users WHERE email LIKE 'appreview%@warmth.dbtvault-solutions.tech') OR user_b_id IN (SELECT id FROM users WHERE email LIKE 'appreview%@warmth.dbtvault-solutions.tech');

INSERT INTO couples (user_a_id, user_b_id, invite_code, paired_at, active)
VALUES (
  (SELECT id FROM users WHERE email='appreview@warmth.dbtvault-solutions.tech'),
  (SELECT id FROM users WHERE email='appreview.partner@warmth.dbtvault-solutions.tech'),
  'DEMO001', NOW(), TRUE);

-- 3. Plans: two approved (both said yes), one matched (awaiting confirm).
INSERT INTO checklist (couple_id, activity_id, status, approved_by_a, approved_by_b, approved_at, matched_at, updated_at)
VALUES
  ((SELECT id FROM couples WHERE invite_code='DEMO001'), 32, 'approved', TRUE, TRUE, NOW()-INTERVAL '1 day',  NOW()-INTERVAL '2 days', NOW()-INTERVAL '1 day'),
  ((SELECT id FROM couples WHERE invite_code='DEMO001'), 9,  'approved', TRUE, TRUE, NOW()-INTERVAL '6 hours', NOW()-INTERVAL '1 day',  NOW()-INTERVAL '6 hours');

INSERT INTO checklist (couple_id, activity_id, status, approved_by_a, approved_by_b, matched_at, updated_at)
VALUES
  ((SELECT id FROM couples WHERE invite_code='DEMO001'), 7, 'matched', TRUE, FALSE, NOW()-INTERVAL '2 hours', NOW()-INTERVAL '2 hours');

-- A friendly comment from the partner (Sam) in the "Cook dinner together" plan.
INSERT INTO comments (parent_type, parent_id, user_id, text, created_at)
SELECT 'plan', cl.id,
       (SELECT id FROM users WHERE email='appreview.partner@warmth.dbtvault-solutions.tech'),
       'Cant wait — Ill grab the ingredients on the way home', NOW()-INTERVAL '20 hours'
FROM checklist cl
WHERE cl.couple_id=(SELECT id FROM couples WHERE invite_code='DEMO001') AND cl.activity_id=32;

-- 4. One memory (a done activity) with ratings + notes from both.
INSERT INTO memories (couple_id, activity_id, activity_title, activity_tagline, activity_image_url, activity_category,
                      completed_at, updated_at, rating_a, rating_b, note_a, note_b)
SELECT (SELECT id FROM couples WHERE invite_code='DEMO001'),
       a.id, a.title, a.tagline, a.image_url, c.name,
       NOW()-INTERVAL '3 days', NOW()-INTERVAL '3 days',
       5, 5, 'Best slow morning weve had in ages', 'Lets make this a weekend thing.'
FROM activities a JOIN categories c ON c.id=a.category_id
WHERE a.id=27;

COMMIT;

SELECT 'couple_id' AS what, id::text AS val FROM couples WHERE invite_code='DEMO001'
UNION ALL SELECT 'plans',    count(*)::text FROM checklist WHERE couple_id=(SELECT id FROM couples WHERE invite_code='DEMO001')
UNION ALL SELECT 'memories', count(*)::text FROM memories  WHERE couple_id=(SELECT id FROM couples WHERE invite_code='DEMO001')
UNION ALL SELECT 'comments', count(*)::text FROM comments  WHERE parent_type='plan' AND parent_id IN (SELECT id FROM checklist WHERE couple_id=(SELECT id FROM couples WHERE invite_code='DEMO001'));
