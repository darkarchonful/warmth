-- Up Migration
-- Deck balance: the catalog leans cozy/expressive (love letters, slow dance,
-- fireplace, spa). This adds 12 activity-forward cards — competitive, hands-on,
-- a bit of adrenaline — to round out that "bonding through doing" mode. All
-- global cards, explicit difficulties (trigger only fires on 3; none use 3).
-- Theme-checked: avoids existing bowling/climbing/mini-golf/kayak cards.

INSERT INTO activities (category_id, title, tagline, seasons, difficulty) VALUES
  ((SELECT id FROM categories WHERE name='Adventures'), 'Go-kart grand prix',            'Winner picks the movie',           ARRAY['all'],                      2),
  ((SELECT id FROM categories WHERE name='Adventures'), 'Axe-throwing night',            'Surprisingly great date',          ARRAY['all'],                      2),
  ((SELECT id FROM categories WHERE name='Creative'),   'Escape room race',              'Beat the clock together',          ARRAY['all'],                      2),
  ((SELECT id FROM categories WHERE name='Daily'),      'Build the flat-pack furniture', 'Survive it, laugh later',          ARRAY['all'],                      2),
  ((SELECT id FROM categories WHERE name='Food'),       'Backyard grill and a cold beer','Low, slow, smoky',                 ARRAY['spring','summer','autumn'], 2),
  ((SELECT id FROM categories WHERE name='Food'),       'Hot wing challenge',            'Scoville ladder, milk on standby', ARRAY['all'],                      1),
  ((SELECT id FROM categories WHERE name='Chill'),      'Co-op campaign night',          'One controller each, beat the boss',ARRAY['all'],                     1),
  ((SELECT id FROM categories WHERE name='Creative'),   'Fly a drone in a field',        'Chase the aerial shot',            ARRAY['all'],                      2),
  ((SELECT id FROM categories WHERE name='Sporty'),     'Darts best of five',            'Bullseye for bragging rights',     ARRAY['all'],                      1),
  ((SELECT id FROM categories WHERE name='Chill'),      'Arcade tournament night',       'Tokens, high scores, trash talk',  ARRAY['all'],                      1),
  ((SELECT id FROM categories WHERE name='Adventures'), 'Indoor skydiving',              'Two minutes of pure flight',       ARRAY['all'],                      2),
  ((SELECT id FROM categories WHERE name='Sporty'),     'Archery range day',             'Loose an arrow, find your aim',    ARRAY['all'],                      2);


-- Down Migration
DELETE FROM activities WHERE couple_id IS NULL AND title IN (
  'Go-kart grand prix',
  'Axe-throwing night',
  'Escape room race',
  'Build the flat-pack furniture',
  'Backyard grill and a cold beer',
  'Hot wing challenge',
  'Co-op campaign night',
  'Fly a drone in a field',
  'Darts best of five',
  'Arcade tournament night',
  'Indoor skydiving',
  'Archery range day'
);
