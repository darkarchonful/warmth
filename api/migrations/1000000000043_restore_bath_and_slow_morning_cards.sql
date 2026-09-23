-- Restore two deck cards removed by migration 041 (they had no usable art then).
-- Both now have card art + a looping clip (2026-09-23), so they return with their
-- ORIGINAL ids (123, 126) because the media files are named by id. Same category,
-- tagline and nudge as the original rows (snapshot: docs/removed_activities_2026-09-17.csv).
-- Idempotent: inserts only when neither the title nor the id exists.
INSERT INTO activities (id, category_id, title, tagline, image_url, video_url, seasons, difficulty, is_journey, nudge_text)
SELECT 123, 6, 'Candlelit bath together', 'Soft light, skin close',
       '/images/activities/123.jpg', '/images/activities/123.mp4', '{all}', 2, FALSE,
       'Soft light, skin close — you wanted it. Run the bath, light the candles. 🕯️'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Candlelit bath together' AND couple_id IS NULL)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE id = 123);
INSERT INTO activities (id, category_id, title, tagline, image_url, video_url, seasons, difficulty, is_journey, nudge_text)
SELECT 126, 6, 'Slow morning in bed with coffee', 'No alarm, no agenda',
       '/images/activities/126.jpg', '/images/activities/126.mp4', '{all}', 2, FALSE,
       'No alarm, no agenda — you both wanted it. Claim a slow morning this weekend. ☕'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Slow morning in bed with coffee' AND couple_id IS NULL)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE id = 126);
