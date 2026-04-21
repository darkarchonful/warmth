-- Up Migration
-- 70 new activities to take catalog from 81 → 151 for launch runway.
-- Difficulty inherited from category via trigger. Seasons set only where obvious.

INSERT INTO activities (category_id, title, tagline, seasons) VALUES
  -- Adventures (8)
  ((SELECT id FROM categories WHERE name='Adventures'), 'Cave exploration tour',         'Walk into the earth together',     ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Adventures'), 'White-water rafting',           'Paddle through the rush',          ARRAY['spring','summer']),
  ((SELECT id FROM categories WHERE name='Adventures'), 'Paragliding tandem',            'Float above it all',               ARRAY['spring','summer','autumn']),
  ((SELECT id FROM categories WHERE name='Adventures'), 'Mountain biking trail',         'Wheels, dirt, laughter',           ARRAY['spring','summer','autumn']),
  ((SELECT id FROM categories WHERE name='Adventures'), 'ATV ride through nature',       'Dust and speed together',          ARRAY['spring','summer','autumn']),
  ((SELECT id FROM categories WHERE name='Adventures'), 'Kite flying at the coast',      'Wind in your hands',               ARRAY['spring','summer']),
  ((SELECT id FROM categories WHERE name='Adventures'), 'Via ferrata route',             'Climb side by side, secured',      ARRAY['spring','summer','autumn']),
  ((SELECT id FROM categories WHERE name='Adventures'), 'Jetski adventure',              'Salt spray, shared speed',         ARRAY['summer']),

  -- Chill (8)
  ((SELECT id FROM categories WHERE name='Chill'),      'Jigsaw puzzle afternoon',       'Slow pieces, soft talk',           ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Chill'),      'Slow pour-over coffee ritual',  'Watch it bloom together',          ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Chill'),      'Rainy day on the couch',        'Let the world pause',              ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Chill'),      'Board game night',              'Lose on purpose sometimes',        ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Chill'),      'Scroll through old photos',     'Remember the small moments',       ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Chill'),      'Face masks side by side',       'Silly look, real calm',            ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Chill'),      'Bubble bath with music',        'Warm water, slow songs',           ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Chill'),      'Watch a documentary together',  'Learn something side by side',     ARRAY['all']),

  -- Creative (8)
  ((SELECT id FROM categories WHERE name='Creative'),   'Make pasta from scratch',       'Flour everywhere, perfect mess',   ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Creative'),   'Plant a small herb garden',     'Something you''ll grow together',  ARRAY['spring','summer']),
  ((SELECT id FROM categories WHERE name='Creative'),   'Learn calligraphy basics',      'Slow ink, steady hands',           ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Creative'),   'Try a magic trick each',        'Fool each other, laugh anyway',    ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Creative'),   'Origami challenge',             'Paper, patience, pride',           ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Creative'),   'Build a blanket fort',          'Return to being children',         ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Creative'),   'Make a shared photo album',     'Curate your year',                 ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Creative'),   'Write a joint bucket list',     'Dreams on one page',               ARRAY['all']),

  -- Daily (8)
  ((SELECT id FROM categories WHERE name='Daily'),      'Shower together',               'Warm water, no rush',              ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Daily'),      'First hour of the day phone-free', 'Just us, slowly waking',        ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Daily'),      'Compliment three small things', 'Notice out loud today',            ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Daily'),      'Send a voice memo at noon',     'A minute of your voice',           ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Daily'),      'Pack lunch for them',           'A small act of care',              ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Daily'),      'Sit five minutes in silence',   'Eyes closed, close together',      ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Daily'),      'Ask what''s on their mind',     'Then really listen',               ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Daily'),      'Drive somewhere without talking','Music and presence',              ARRAY['all']),

  -- Food (8)
  ((SELECT id FROM categories WHERE name='Food'),       'Homemade pizza night',          'Your dough, your toppings, your pie', ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Food'),       'Brunch at a new spot',          'A Sunday tradition starts here',   ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Food'),       'Ice cream stand crawl',         'Three scoops, three streets',      ARRAY['spring','summer']),
  ((SELECT id FROM categories WHERE name='Food'),       'Coffee shop tour in your city', 'Cup by cup, together',             ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Food'),       'Taco night at home',            'Build, share, mess up',            ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Food'),       'Fondue evening',                'Dip, talk, repeat',                ARRAY['autumn','winter']),
  ((SELECT id FROM categories WHERE name='Food'),       'Chocolate tasting',             'Dark, milk, salted, sweet',        ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Food'),       'Bake fresh bread',              'Kneaded with patience',            ARRAY['all']),

  -- Romance (8)
  ((SELECT id FROM categories WHERE name='Romance'),    'Write love letters and read aloud','Say it in ink first',           ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Romance'),    'Candlelit bath together',       'Soft light, skin close',           ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Romance'),    'Dance in the kitchen while cooking','Stir, sway, kiss',              ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Romance'),    'Share your childhood photos',   'Meet the kid they were',           ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Romance'),    'Slow morning in bed with coffee','No alarm, no agenda',              ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Romance'),    'Compliment hour, only words',   'An hour of soft things',           ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Romance'),    'Dress up for no reason',        'Look at each other again',         ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Romance'),    'Sunset drive, windows down',    'Warm air, warmer hands',           ARRAY['spring','summer','autumn']),

  -- Seasonal (8)
  ((SELECT id FROM categories WHERE name='Seasonal'),   'Pumpkin carving together',      'Silly faces, real fun',            ARRAY['autumn']),
  ((SELECT id FROM categories WHERE name='Seasonal'),   'Summer lake day',               'Splash, float, nap',               ARRAY['summer']),
  ((SELECT id FROM categories WHERE name='Seasonal'),   'Make snow angels',              'Fall backwards, laugh up',         ARRAY['winter']),
  ((SELECT id FROM categories WHERE name='Seasonal'),   'Spring cleaning as a team',     'Lighten the house together',       ARRAY['spring']),
  ((SELECT id FROM categories WHERE name='Seasonal'),   'Rooftop fireworks night',       'Lights over the city',             ARRAY['summer']),
  ((SELECT id FROM categories WHERE name='Seasonal'),   'Apple picking orchard',         'Crisp air, full basket',           ARRAY['autumn']),
  ((SELECT id FROM categories WHERE name='Seasonal'),   'Winter soup and a movie',       'Warm bowl, warm blanket',          ARRAY['winter']),
  ((SELECT id FROM categories WHERE name='Seasonal'),   'Cherry blossom walk',           'Pink sky, slow steps',             ARRAY['spring']),

  -- Sporty (8)
  ((SELECT id FROM categories WHERE name='Sporty'),     'Table tennis evening',          'Fast hands, soft rivalry',         ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Sporty'),     'Pilates class together',        'Stretch side by side',             ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Sporty'),     'Boxing class for two',          'Gloves on, smile wider',           ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Sporty'),     'Run a 5k as a team',            'Same pace, same breath',           ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Sporty'),     'Hike in the rain',              'Wet boots, bright mood',           ARRAY['spring','autumn']),
  ((SELECT id FROM categories WHERE name='Sporty'),     'Bowling night',                 'Gutter balls and high-fives',      ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Sporty'),     'Mini-golf round',               'Windmills and kisses',             ARRAY['spring','summer']),
  ((SELECT id FROM categories WHERE name='Sporty'),     'Trampoline park hour',          'Bounce until you''re kids again',  ARRAY['all']),

  -- Travel (6)
  ((SELECT id FROM categories WHERE name='Travel'),     'Book a random Airbnb',          'Same country, new bed',            ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Travel'),     'Airport with no destination picked','Board the next cheap flight',   ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Travel'),     'Overnight bus to somewhere small','Wake up somewhere new',           ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Travel'),     'Visit a lighthouse',            'Stand where land ends',            ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Travel'),     'Spa weekend together',          'Warm stones, slow hours',          ARRAY['all']),
  ((SELECT id FROM categories WHERE name='Travel'),     'Foreign-language weekend',      'Stumble in a new tongue',          ARRAY['all']);

-- Season audit: retag outdoor/weather-sensitive existing activities that were on 'all' by default
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Hiking to a viewpoint';
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Horseback riding by the sea';
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Kayaking at sunrise';
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Sailing lesson';
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Snorkeling in clear water';
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Zip-lining through the forest';
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Hammock afternoon';
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Picnic in the park';
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Rooftop bar evening';
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Bike ride together';
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Paddleboarding';
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Swimming at sunset';
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Tennis or badminton';
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Beach day trip';
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Camping under the stars';

-- Down Migration
UPDATE activities SET seasons = ARRAY['all'] WHERE title IN (
  'Hiking to a viewpoint','Horseback riding by the sea','Kayaking at sunrise','Sailing lesson',
  'Snorkeling in clear water','Zip-lining through the forest','Hammock afternoon','Picnic in the park',
  'Rooftop bar evening','Bike ride together','Paddleboarding','Swimming at sunset','Tennis or badminton',
  'Beach day trip','Camping under the stars'
);

DELETE FROM activities WHERE title IN (
  'Cave exploration tour','White-water rafting','Paragliding tandem','Mountain biking trail',
  'ATV ride through nature','Kite flying at the coast','Via ferrata route','Jetski adventure',
  'Jigsaw puzzle afternoon','Slow pour-over coffee ritual','Rainy day on the couch','Board game night',
  'Scroll through old photos','Face masks side by side','Bubble bath with music','Watch a documentary together',
  'Make pasta from scratch','Plant a small herb garden','Learn calligraphy basics','Try a magic trick each',
  'Origami challenge','Build a blanket fort','Make a shared photo album','Write a joint bucket list',
  'Shower together','First hour of the day phone-free','Compliment three small things','Send a voice memo at noon',
  'Pack lunch for them','Sit five minutes in silence','Ask what''s on their mind','Drive somewhere without talking',
  'Homemade pizza night','Brunch at a new spot','Ice cream stand crawl','Coffee shop tour in your city',
  'Taco night at home','Fondue evening','Chocolate tasting','Bake fresh bread',
  'Write love letters and read aloud','Candlelit bath together','Dance in the kitchen while cooking','Share your childhood photos',
  'Slow morning in bed with coffee','Compliment hour, only words','Dress up for no reason','Sunset drive, windows down',
  'Pumpkin carving together','Summer lake day','Make snow angels','Spring cleaning as a team',
  'Rooftop fireworks night','Apple picking orchard','Winter soup and a movie','Cherry blossom walk',
  'Table tennis evening','Pilates class together','Boxing class for two','Run a 5k as a team',
  'Hike in the rain','Bowling night','Mini-golf round','Trampoline park hour',
  'Book a random Airbnb','Airport with no destination picked','Overnight bus to somewhere small','Visit a lighthouse',
  'Spa weekend together','Foreign-language weekend'
);
