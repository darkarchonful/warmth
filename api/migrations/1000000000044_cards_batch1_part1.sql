-- Card batch one, part 1 (2026-09-29): 37 new deck cards, each inserted WITH its art
-- (api/public/activities/<id>.jpg, media image v9). Explicit ids 262-298 because the media
-- files are named by id. Idempotent: a card is inserted only if neither its id nor its
-- title exists. The sequence is moved past the explicit ids so custom cards keep working.

INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 262, 6, '''Open when'' letters', 'Open when you miss me', '/images/activities/262.jpg', '{all}', 2, FALSE, 'Open when you miss me — you said yes. Write three sealed letters each this week. 💌'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 262)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = '''Open when'' letters' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 263, 6, 'A whole day in bed', 'Nowhere to be', '/images/activities/263.jpg', '{all}', 2, FALSE, 'Nowhere to be — you both said yes. Block a whole day, no plans. 🛌'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 263)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'A whole day in bed' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 264, 7, 'Advent calendar you make for each other', '24 tiny surprises', '/images/activities/264.jpg', '{winter}', 2, FALSE, '24 tiny surprises — you both said yes. Start in November, one gift a day in December. 🎁'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 264)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Advent calendar you make for each other' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 265, 2, 'Balcony evening under blankets', 'Wrapped up, looking out', '/images/activities/265.jpg', '{autumn,winter}', 1, FALSE, 'Wrapped up, looking out — you both said yes. Blankets and tea on the balcony this week. 🧣'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 265)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Balcony evening under blankets' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 266, 2, 'Card game, best of five', 'Shuffle, deal, bluff', '/images/activities/266.jpg', '{all}', 1, FALSE, 'Shuffle, deal, bluff — you agreed. Best of five tonight, loser makes tea. 🃏'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 266)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Card game, best of five' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 267, 2, 'Cloud-watch in the park', 'Name the shapes', '/images/activities/267.jpg', '{spring,summer,autumn}', 1, FALSE, 'Name the shapes — you both said yes. Lie down on the grass next sunny day. ☁️'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 267)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Cloud-watch in the park' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 268, 8, 'Cooking class for two', 'Let a chef boss you both around', '/images/activities/268.jpg', '{all}', 3, FALSE, 'Let a chef boss you both around — you agreed. Book a class for two this month. 👨‍🍳'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 268)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Cooking class for two' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 269, 6, 'Dance under a streetlight', 'No music needed', '/images/activities/269.jpg', '{all}', 1, FALSE, 'No music needed — you both wanted it. Next late walk, stop under a lamp and dance. 💃'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 269)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Dance under a streetlight' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 270, 6, 'Dinner at the fanciest place you can find', 'Dress code: yes', '/images/activities/270.jpg', '{all}', 4, FALSE, 'Dress code: yes — you agreed. Book the table and dress up. 🥂'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 270)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Dinner at the fanciest place you can find' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 271, 5, 'Do the dishes as a team', 'Wash, dry, done', '/images/activities/271.jpg', '{all}', 1, FALSE, 'Wash, dry, done — you both said yes. One washes, one dries, tonight. 🧽'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 271)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Do the dishes as a team' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 272, 7, 'First swim of the year', 'Cold, then brilliant', '/images/activities/272.jpg', '{spring,summer}', 2, FALSE, 'Cold, then brilliant — you agreed. First warm weekend, in you go. 🌊'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 272)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'First swim of the year' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 273, 3, 'Karaoke night', 'Sing badly, mean every word', '/images/activities/273.jpg', '{all}', 2, FALSE, 'Sing badly, mean every word — you both said yes. Find a karaoke bar this month. 🎤'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 273)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Karaoke night' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 274, 6, 'Kiss on a bridge at night', 'City lights below', '/images/activities/274.jpg', '{all}', 1, FALSE, 'City lights below — you said yes. Walk to the bridge after dark this week. 🌉'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 274)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Kiss on a bridge at night' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 275, 6, 'Late-night drive for ice cream', 'Pajamas allowed', '/images/activities/275.jpg', '{summer}', 1, FALSE, 'Pajamas allowed — you agreed. Next warm night, drive out for ice cream. 🍦'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 275)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Late-night drive for ice cream' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 276, 2, 'Listen to a whole album, start to finish', 'No skipping', '/images/activities/276.jpg', '{all}', 1, FALSE, 'No skipping — you agreed. Pick the album and press play tonight. 🎶'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 276)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Listen to a whole album, start to finish' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 277, 7, 'Make jam from summer fruit', 'Sticky hands, sweet jars', '/images/activities/277.jpg', '{summer}', 2, FALSE, 'Sticky hands, sweet jars — you said yes. Buy a crate of berries this week. 🍓'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 277)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Make jam from summer fruit' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 278, 5, 'Make the bed together', 'Two sides, one minute', '/images/activities/278.jpg', '{all}', 1, FALSE, 'Two sides, one minute — you agreed. Tomorrow morning, both sides at once. 🛏️'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 278)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Make the bed together' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 279, 7, 'Mushroom foraging walk', 'Basket, boots, patience', '/images/activities/279.jpg', '{autumn}', 3, FALSE, 'Basket, boots, patience — you both said yes. Find a forest and a guide book this month. 🍄'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 279)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Mushroom foraging walk' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 280, 5, 'One thing you''re grateful for, at bedtime', 'Last words of the day', '/images/activities/280.jpg', '{all}', 1, FALSE, 'Last words of the day — you both wanted it. Tonight, one thing each before the light goes off. 🌙'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 280)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'One thing you''re grateful for, at bedtime' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 281, 2, 'Order in and eat on the floor', 'Picnic on the carpet', '/images/activities/281.jpg', '{all}', 1, FALSE, 'Picnic on the carpet — you agreed. Order in and skip the table one night. 🥡'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 281)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Order in and eat on the floor' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 282, 2, 'People-watch from a café window', 'Invent their stories', '/images/activities/282.jpg', '{all}', 1, FALSE, 'Invent their stories — you said yes. Take the window seat next time. 🥐'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 282)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'People-watch from a café window' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 283, 5, 'Pick tomorrow''s outfit for each other', 'Their choice, your look', '/images/activities/283.jpg', '{all}', 1, FALSE, 'Their choice, your look — you agreed. Lay out each other''s clothes tonight. 👕'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 283)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Pick tomorrow''s outfit for each other' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 284, 5, 'Plan the week''s meals together', 'Sunday, sorted', '/images/activities/284.jpg', '{all}', 1, FALSE, 'Sunday, sorted — you said yes. Sit down with a notepad this Sunday. 📝'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 284)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Plan the week''s meals together' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 285, 7, 'Rake leaves and jump in the pile', 'Work first, then jump', '/images/activities/285.jpg', '{autumn}', 1, FALSE, 'Work first, then jump — you agreed. Next dry autumn day, rake and dive. 🍂'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 285)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Rake leaves and jump in the pile' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 286, 6, 'Recreate a photo from your first year', 'Same pose, new us', '/images/activities/286.jpg', '{all}', 2, FALSE, 'Same pose, new us — you both said yes. Find the photo and recreate it this weekend. 📸'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 286)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Recreate a photo from your first year' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 287, 5, 'Send a photo of something that reminded you of them', 'Seen, thought of you', '/images/activities/287.jpg', '{all}', 1, FALSE, 'Seen, thought of you — you said yes. Send one photo today, no caption needed. 📷'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 287)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Send a photo of something that reminded you of them' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 288, 2, 'Sit by the water and talk', 'Feet dangling', '/images/activities/288.jpg', '{spring,summer,autumn}', 1, FALSE, 'Feet dangling — you both wanted it. Find a pier or a riverbank this week. 🌊'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 288)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Sit by the water and talk' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 289, 5, 'Slow breakfast on the balcony', 'Coffee with a view', '/images/activities/289.jpg', '{spring,summer,autumn}', 1, FALSE, 'Coffee with a view — you agreed. Take breakfast outside this weekend. ☕'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 289)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Slow breakfast on the balcony' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 290, 1, 'Speedboat ride', 'Full throttle, hair everywhere', '/images/activities/290.jpg', '{summer}', 4, FALSE, 'Full throttle, hair everywhere — you said yes. Book a ride on the next sunny weekend. 🚤'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 290)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Speedboat ride' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 291, 2, 'Sunday crossword together', 'Seven letters, two heads', '/images/activities/291.jpg', '{all}', 1, FALSE, 'Seven letters, two heads — you said yes. Print one and pour the coffee. ✏️'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 291)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Sunday crossword together' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 292, 6, 'Sunset picnic with wine', 'Golden hour, one blanket', '/images/activities/292.jpg', '{spring,summer,autumn}', 2, FALSE, 'Golden hour, one blanket — you both wanted it. Pack the basket for the next clear evening. 🍷'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 292)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Sunset picnic with wine' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 293, 5, 'Ten-minute stretch before bed', 'Loosen the day', '/images/activities/293.jpg', '{all}', 1, FALSE, 'Loosen the day — you both wanted it. Ten minutes on the rug tonight. 🧘'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 293)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Ten-minute stretch before bed' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 294, 5, 'Ten-minute tidy together', 'Timer on, music up', '/images/activities/294.jpg', '{all}', 1, FALSE, 'Timer on, music up — you both said yes. Ten minutes tonight, then stop. ⏱️'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 294)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Ten-minute tidy together' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 295, 2, 'Visit the library together', 'Pick a book for each other', '/images/activities/295.jpg', '{all}', 1, FALSE, 'Pick a book for each other — you said yes. Library trip this weekend. 📚'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 295)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Visit the library together' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 296, 5, 'Walk to get the morning bread', 'Warm loaf, cold air', '/images/activities/296.jpg', '{all}', 1, FALSE, 'Warm loaf, cold air — you agreed. Walk to the bakery together this weekend. 🥖'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 296)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Walk to get the morning bread' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 297, 7, 'Watch a meteor shower', 'Blanket, count, wish', '/images/activities/297.jpg', '{summer}', 2, FALSE, 'Blanket, count, wish — you both wanted it. Check the August dates and drive out of the city. ☄️'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 297)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Watch a meteor shower' AND couple_id IS NULL);
INSERT INTO activities (id, category_id, title, tagline, image_url, seasons, difficulty, is_journey, nudge_text)
SELECT 298, 6, 'Write the story of how you met', 'Two versions, one night', '/images/activities/298.jpg', '{all}', 2, FALSE, 'Two versions, one night — you agreed. Each write your version, then read them aloud. ✍️'
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id = 298)
  AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Write the story of how you met' AND couple_id IS NULL);

SELECT setval('activities_id_seq', GREATEST((SELECT max(id) FROM activities), (SELECT last_value FROM activities_id_seq)));
