-- Up Migration
-- New activities per category. Difficulty auto-inherits from category via trigger.
INSERT INTO activities (category_id, title, tagline) VALUES
  ((SELECT id FROM categories WHERE name='Daily'),      'Make each other''s favorite drink', 'Small gesture, big warmth'),
  ((SELECT id FROM categories WHERE name='Daily'),      'Dinner without phones',            'Just us at the table'),
  ((SELECT id FROM categories WHERE name='Daily'),      'Five-minute morning hug',          'Start the day held'),

  ((SELECT id FROM categories WHERE name='Chill'),      'Plan next weekend over tea',       'Low stakes, sweet ideas'),
  ((SELECT id FROM categories WHERE name='Chill'),      'Playlist swap, five songs each',   'Trade what moves you'),
  ((SELECT id FROM categories WHERE name='Chill'),      'Candles-only evening',             'Soft light, slow talk'),

  ((SELECT id FROM categories WHERE name='Creative'),   'Vision board for the year',        'Make the future visible'),
  ((SELECT id FROM categories WHERE name='Creative'),   'Write a silly song together',      'Rhyme badly, laugh hard'),
  ((SELECT id FROM categories WHERE name='Creative'),   'Rearrange one room together',      'Change the space, shift the mood'),

  ((SELECT id FROM categories WHERE name='Romance'),    'Recreate your first date',         'Return to where it started'),
  ((SELECT id FROM categories WHERE name='Romance'),    'Read poetry to each other',        'Old words, new meaning'),
  ((SELECT id FROM categories WHERE name='Romance'),    'Swap surprise roles for a day',    'Be the one who plans it'),

  ((SELECT id FROM categories WHERE name='Food'),       'Dessert crawl, three spots',       'Sweet route through the city'),
  ((SELECT id FROM categories WHERE name='Food'),       'Cheese board night',               'Taste by taste, together'),
  ((SELECT id FROM categories WHERE name='Food'),       'Cocktail mixing at home',          'Invent a drink you name'),

  ((SELECT id FROM categories WHERE name='Seasonal'),   'First snow walk',                  'Footprints in the quiet'),
  ((SELECT id FROM categories WHERE name='Seasonal'),   'Summer solstice late dinner',      'The longest golden evening'),
  ((SELECT id FROM categories WHERE name='Seasonal'),   'Easter egg hunt for two',          'Childish joy, fully adult'),

  ((SELECT id FROM categories WHERE name='Sporty'),     'Morning jog together',             'Sweat and breath, side by side'),
  ((SELECT id FROM categories WHERE name='Sporty'),     'Dance class (salsa or bachata)',   'Step, laugh, step again'),
  ((SELECT id FROM categories WHERE name='Sporty'),     'Paddleboarding',                   'Balance on quiet water'),

  ((SELECT id FROM categories WHERE name='Travel'),     'Day of yes — partner decides',     'Let them lead the way'),
  ((SELECT id FROM categories WHERE name='Travel'),     'Plan a future trip, even a far one','Dream on paper for an hour'),
  ((SELECT id FROM categories WHERE name='Travel'),     'Train ride with no destination',   'Get off wherever feels right'),

  ((SELECT id FROM categories WHERE name='Adventures'), 'Hot air balloon ride',             'Sunrise from above'),
  ((SELECT id FROM categories WHERE name='Adventures'), 'Sailing lesson',                   'Learn the wind together'),
  ((SELECT id FROM categories WHERE name='Adventures'), 'Scuba diving',                     'Silence and blue, shared');

-- Down Migration
DELETE FROM activities WHERE title IN (
  'Make each other''s favorite drink', 'Dinner without phones', 'Five-minute morning hug',
  'Plan next weekend over tea', 'Playlist swap, five songs each', 'Candles-only evening',
  'Vision board for the year', 'Write a silly song together', 'Rearrange one room together',
  'Recreate your first date', 'Read poetry to each other', 'Swap surprise roles for a day',
  'Dessert crawl, three spots', 'Cheese board night', 'Cocktail mixing at home',
  'First snow walk', 'Summer solstice late dinner', 'Easter egg hunt for two',
  'Morning jog together', 'Dance class (salsa or bachata)', 'Paddleboarding',
  'Day of yes — partner decides', 'Plan a future trip, even a far one', 'Train ride with no destination',
  'Hot air balloon ride', 'Sailing lesson', 'Scuba diving'
);
