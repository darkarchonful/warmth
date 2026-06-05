-- Up Migration
-- June 2026 deck expansion, weighted to winter (17 of 29). Brings the winter
-- deck from 14 -> 31 so it matches the other seasons' richness. All global
-- cards (couple_id NULL). Difficulties are explicit (1-5); the default-difficulty
-- trigger only fires on the value 3, and none of these use 3.

INSERT INTO activities (category_id, title, tagline, seasons, difficulty) VALUES
  -- year-round / other
  ((SELECT id FROM categories WHERE name='Romance'),    'Pick out a scent together',        'Choose a fragrance for each other',  ARRAY['all'],                      2),
  ((SELECT id FROM categories WHERE name='Food'),       'Blind taste test',                 'Five weird snacks, no peeking',      ARRAY['all'],                      2),
  ((SELECT id FROM categories WHERE name='Creative'),   'Thrift-store outfit challenge',     'Fifteen euros, dress each other',    ARRAY['all'],                      2),
  ((SELECT id FROM categories WHERE name='Adventures'), 'Sunrise coffee up high',            'Set the alarm, watch it rise',       ARRAY['all'],                      2),
  ((SELECT id FROM categories WHERE name='Food'),       'Cook their comfort dish',           'The recipe from their childhood',    ARRAY['all'],                      2),
  ((SELECT id FROM categories WHERE name='Chill'),      'Two-hour no-phone walk',            'New streets, no map, no phones',     ARRAY['all'],                      1),
  ((SELECT id FROM categories WHERE name='Creative'),   'Write each other a user manual',    'How to love me when I''m stressed',  ARRAY['all'],                      2),
  ((SELECT id FROM categories WHERE name='Adventures'), 'Be tourists in your own city',      'Do the touristy thing at home',      ARRAY['all'],                      2),
  ((SELECT id FROM categories WHERE name='Creative'),   'Pottery class for two',             'Make a mess, make a bowl',           ARRAY['all'],                      4),
  ((SELECT id FROM categories WHERE name='Daily'),      'Couple''s bucket-list night',       'Write thirty things to do together', ARRAY['all'],                      1),
  ((SELECT id FROM categories WHERE name='Food'),       'Cook a farmers-market haul',        'Buy it fresh, make it together',     ARRAY['spring','summer','autumn'], 2),
  ((SELECT id FROM categories WHERE name='Sporty'),     'Sunset bike ride',                  'Two wheels, golden hour',            ARRAY['spring','summer','autumn'], 4),
  -- winter
  ((SELECT id FROM categories WHERE name='Chill'),      'Blanket fort movie night',          'Blankets, fairy lights, one film',   ARRAY['winter'],                   1),
  ((SELECT id FROM categories WHERE name='Sporty'),     'Ice skating hand in hand',          'Wobble together, laugh a lot',       ARRAY['winter'],                   2),
  ((SELECT id FROM categories WHERE name='Food'),       'Bake cinnamon rolls from scratch',  'Fill the kitchen with warmth',       ARRAY['winter'],                   2),
  ((SELECT id FROM categories WHERE name='Romance'),    'Mulled wine on the balcony',        'Spiced, steaming, just you two',     ARRAY['winter'],                   2),
  ((SELECT id FROM categories WHERE name='Daily'),      'Winter farmers market morning',     'Warm hands around paper cups',       ARRAY['winter'],                   2),
  ((SELECT id FROM categories WHERE name='Travel'),     'Plan next year''s trips by the fire','Dream the year out loud',            ARRAY['winter'],                   1),
  ((SELECT id FROM categories WHERE name='Adventures'), 'Snow picnic with a thermos',        'Cocoa out in the cold',              ARRAY['winter'],                   4),
  ((SELECT id FROM categories WHERE name='Sporty'),     'Sauna and cold plunge together',    'Heat, shock, a shared gasp',         ARRAY['winter'],                   4),
  ((SELECT id FROM categories WHERE name='Creative'),   'Decorate the place for the season', 'Make it all glow',                   ARRAY['winter'],                   2),
  ((SELECT id FROM categories WHERE name='Creative'),   'Handwrite cards to people you love','Slow down and mean it',               ARRAY['winter'],                   1),
  ((SELECT id FROM categories WHERE name='Chill'),      'Indoor camping with string lights', 'Camp without the cold',              ARRAY['winter'],                   1),
  ((SELECT id FROM categories WHERE name='Food'),       'Two-pot soup cook-off',             'Two pots, one taste test',           ARRAY['winter'],                   2),
  ((SELECT id FROM categories WHERE name='Creative'),   'Frosty morning photo walk',         'Catch the light on the ice',         ARRAY['winter'],                   2),
  ((SELECT id FROM categories WHERE name='Romance'),    'Winter spa night at home',          'Robes, candles, no rush',            ARRAY['winter'],                   1),
  ((SELECT id FROM categories WHERE name='Food'),       'Mix warm winter drinks',            'Hot toddies, cocoa, cider',          ARRAY['winter'],                   2),
  ((SELECT id FROM categories WHERE name='Creative'),   'Build a winter playlist together',  'Songs for short days',               ARRAY['winter'],                   1),
  ((SELECT id FROM categories WHERE name='Chill'),      'Cozy movie marathon',               'Pajamas, popcorn, no plans',         ARRAY['winter'],                   1);


-- Down Migration
DELETE FROM activities WHERE couple_id IS NULL AND title IN (
  'Pick out a scent together',
  'Blind taste test',
  'Thrift-store outfit challenge',
  'Sunrise coffee up high',
  'Cook their comfort dish',
  'Two-hour no-phone walk',
  'Write each other a user manual',
  'Be tourists in your own city',
  'Pottery class for two',
  'Couple''s bucket-list night',
  'Cook a farmers-market haul',
  'Sunset bike ride',
  'Blanket fort movie night',
  'Ice skating hand in hand',
  'Bake cinnamon rolls from scratch',
  'Mulled wine on the balcony',
  'Winter farmers market morning',
  'Plan next year''s trips by the fire',
  'Snow picnic with a thermos',
  'Sauna and cold plunge together',
  'Decorate the place for the season',
  'Handwrite cards to people you love',
  'Indoor camping with string lights',
  'Two-pot soup cook-off',
  'Frosty morning photo walk',
  'Winter spa night at home',
  'Mix warm winter drinks',
  'Build a winter playlist together',
  'Cozy movie marathon'
);
