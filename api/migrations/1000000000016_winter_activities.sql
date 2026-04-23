-- Up Migration
-- Winter catalog: fix 3 mislabeled seasonal activities and add 10 winter-specific
-- ones so the winter deck has similar richness to spring/summer/autumn.

-- Fix mislabels: title already implies season but seasons was {all}.
UPDATE activities SET seasons = ARRAY['winter'] WHERE title = 'First snow walk';
UPDATE activities SET seasons = ARRAY['summer'] WHERE title = 'Summer solstice late dinner';
UPDATE activities SET seasons = ARRAY['spring'] WHERE title = 'Easter egg hunt for two';

-- New winter activities (10)
INSERT INTO activities (category_id, title, tagline, seasons) VALUES
  ((SELECT id FROM categories WHERE name='Food'),     'Hot chocolate at a cozy cafe', 'Warm hands, warmer talk',        ARRAY['winter']),
  ((SELECT id FROM categories WHERE name='Creative'), 'Gingerbread house together',    'Sticky fingers, sweet chaos',    ARRAY['winter']),
  ((SELECT id FROM categories WHERE name='Chill'),    'Watch snow fall with tea',      'No agenda, just quiet',          ARRAY['winter']),
  ((SELECT id FROM categories WHERE name='Seasonal'), 'Holiday lights walk',           'Bundled up, glowing streets',    ARRAY['winter']),
  ((SELECT id FROM categories WHERE name='Seasonal'), 'Build a snowman',               'Classic, silly, required',       ARRAY['winter']),
  ((SELECT id FROM categories WHERE name='Sporty'),   'Sledding afternoon',            'Kid-mode, full speed',           ARRAY['winter']),
  ((SELECT id FROM categories WHERE name='Romance'),  'Fireplace night with wine',     'Slow evening, soft light',       ARRAY['winter']),
  ((SELECT id FROM categories WHERE name='Travel'),   'Ski weekend trip',              'Snow, lift, lodge',              ARRAY['winter']),
  ((SELECT id FROM categories WHERE name='Romance'),  'Winter stargazing',             'Crisp sky, cold noses',          ARRAY['winter']),
  ((SELECT id FROM categories WHERE name='Romance'),  'New Year''s countdown kiss',    'Begin it right',                 ARRAY['winter']);


-- Down Migration
DELETE FROM activities WHERE title IN (
  'Hot chocolate at a cozy cafe',
  'Gingerbread house together',
  'Watch snow fall with tea',
  'Holiday lights walk',
  'Build a snowman',
  'Sledding afternoon',
  'Fireplace night with wine',
  'Ski weekend trip',
  'Winter stargazing',
  'New Year''s countdown kiss'
);

UPDATE activities SET seasons = ARRAY['all'] WHERE title = 'First snow walk';
UPDATE activities SET seasons = ARRAY['all'] WHERE title = 'Summer solstice late dinner';
UPDATE activities SET seasons = ARRAY['all'] WHERE title = 'Easter egg hunt for two';
