-- Card batch one, part 2 (2026-09-29): 15 new deck cards, each inserted WITH its art
-- (api/public/activities/<id>.jpg, media image v10). Explicit ids 299-313 because the media
-- files are named by id. Idempotent: a card is inserted only if neither its id nor its
-- title exists. The sequence is moved past the explicit ids so custom cards keep working.

INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 299, 9, 'Afternoon on the slopes', 'One lift, many laps', '/images/activities/299.jpg', '{winter}', 4, FALSE, 'One lift, many laps — you said yes. Book a day pass for the nearest slope. ⛷️'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 299)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Afternoon on the slopes' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 300, 8, 'Breakfast for dinner', 'Pancakes at 8pm', '/images/activities/300.jpg', '{all}', 1, FALSE, 'Pancakes at 8pm — you both said yes. Pancakes and eggs one weeknight. 🥞'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 300)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Breakfast for dinner' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 301, 3, 'Build a birdhouse together', 'Hammer, paint, hang', '/images/activities/301.jpg', '{spring}', 2, FALSE, 'Hammer, paint, hang — you said yes. Buy a kit and build it one weekend. 🐦'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 301)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Build a birdhouse together' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 302, 9, 'Climb the tallest stairs in town', 'Count the steps', '/images/activities/302.jpg', '{all}', 2, FALSE, 'Count the steps — you both said yes. Find the tower or the hill stairs and go up. 🪩'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 302)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Climb the tallest stairs in town' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 303, 8, 'Cook with only what''s in the fridge', 'No shopping, all in', '/images/activities/303.jpg', '{all}', 2, FALSE, 'No shopping, all in — you said yes. Open the fridge tonight and improvise. 🥬'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 303)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Cook with only what''s in the fridge' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 304, 8, 'Dumplings from scratch', 'Fold, pinch, repeat', '/images/activities/304.jpg', '{all}', 3, FALSE, 'Fold, pinch, repeat — you agreed. Find a recipe and make a tray this weekend. 🥟'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 304)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Dumplings from scratch' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 305, 9, 'Frisbee in the park', 'Throw, run, miss, laugh', '/images/activities/305.jpg', '{spring,summer,autumn}', 1, FALSE, 'Throw, run, miss, laugh — you agreed. Grab a frisbee next sunny afternoon. 🥏'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 305)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Frisbee in the park' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 306, 7, 'Ice cream on the first warm day', 'Coats open, cones out', '/images/activities/306.jpg', '{spring}', 1, FALSE, 'Coats open, cones out — you agreed. First day above fifteen degrees, ice cream. 🍨'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 306)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Ice cream on the first warm day' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 307, 1, 'Night walk with headlamps', 'Same path, new dark', '/images/activities/307.jpg', '{autumn,winter}', 2, FALSE, 'Same path, new dark — you agreed. Headlamps on, forest path after dark this week. 🔦'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 307)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Night walk with headlamps' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 308, 7, 'Plant bulbs for spring', 'Plant now, bloom later', '/images/activities/308.jpg', '{autumn}', 1, FALSE, 'Plant now, bloom later — you agreed. Buy tulip bulbs and plant them this weekend. 🌷'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 308)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Plant bulbs for spring' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 309, 7, 'Snowball fight', 'Truce at dusk', '/images/activities/309.jpg', '{winter}', 1, FALSE, 'Truce at dusk — you both wanted it. First proper snow, gloves on. ❄️'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 309)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Snowball fight' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 310, 8, 'Street food night out', 'One stall each, share', '/images/activities/310.jpg', '{all}', 2, FALSE, 'One stall each, share — you both wanted it. Find a night market this month. 🍢'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 310)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Street food night out' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 311, 7, 'Sunflower field afternoon', 'Taller than you', '/images/activities/311.jpg', '{summer}', 2, FALSE, 'Taller than you — you said yes. Find a field nearby and go one afternoon. 🌻'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 311)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Sunflower field afternoon' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 312, 5, 'Water the plants together', 'Small green things', '/images/activities/312.jpg', '{all}', 1, FALSE, 'Small green things — you said yes. Do the watering round together this week. 🪴'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 312)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Water the plants together' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 313, 6, 'Write on the steamed mirror', 'Steam reveals it', '/images/activities/313.jpg', '{all}', 1, FALSE, 'Steam reveals it — you said yes. Leave a message on the mirror after your next shower. 🪞'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 313)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Write on the steamed mirror' AND couple_id IS NULL);

-- The BEFORE INSERT trigger activity_default_difficulty (migration 009) reads difficulty 3 as
-- "not set" and swaps in the category default, so an explicit 3 outside Seasonal/Sporty is
-- lost on insert. Set it again for the one card of this batch that is affected.
UPDATE activities SET difficulty = 3
WHERE id = 304 AND title = 'Dumplings from scratch' AND couple_id IS NULL AND difficulty <> 3;

SELECT setval('activities_id_seq', GREATEST((SELECT max(id) FROM activities), (SELECT last_value FROM activities_id_seq)));
