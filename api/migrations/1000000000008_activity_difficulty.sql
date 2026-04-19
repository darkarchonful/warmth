-- Up Migration
ALTER TABLE activities ADD COLUMN difficulty INTEGER NOT NULL DEFAULT 3;

-- Daily ritual: easiest (home, minimal setup)
UPDATE activities SET difficulty = 1 WHERE title IN (
  'Morning coffee together',
  'Leave a handwritten note',
  'Walk together after dinner',
  'Evening walk with no plan',
  'Cook dinner together',
  'Breakfast in bed',
  'Surprise lunch delivery',
  'Read books side by side',
  'Movie night at home',
  'Hammock afternoon',
  'Watch the sunset together',
  'Slow dance in the living room',
  'Candlelight dinner at home'
);

-- Medium: requires some planning or going out nearby
UPDATE activities SET difficulty = 2 WHERE title IN (
  'Picnic in the park',
  'Paint together',
  'Draw each other''s portrait',
  'Write letters to future us',
  'Cook a dish from a random country',
  'Bake something together',
  'Sushi making at home',
  'Photography walk in your city',
  'Explore a new neighborhood',
  'Farmers market morning',
  'Learn a dance together',
  'Morning yoga',
  'Stargazing',
  'Surprise flower delivery',
  'Autumn leaf walk',
  'Spring flower field visit'
);

-- Harder: structured activity, cost or logistics
UPDATE activities SET difficulty = 3 WHERE title IN (
  'Pottery class',
  'Build something together',
  'Wine tasting',
  'Try a cuisine you''ve never had',
  'Rooftop bar evening',
  'Couples massage',
  'Tennis or badminton',
  'Bike ride together',
  'Swimming at sunset',
  'Beach day trip',
  'Christmas market stroll',
  'Beach bonfire evening',
  'Ice skating'
);

-- Challenging: full-day or adventure
UPDATE activities SET difficulty = 4 WHERE title IN (
  'Hiking to a viewpoint',
  'Kayaking at sunrise',
  'Snorkeling in clear water',
  'Horseback riding by the sea',
  'Weekend road trip',
  'Visit a town neither of you knows',
  'Rock climbing'
);

-- Biggest commitment: trips, adrenaline
UPDATE activities SET difficulty = 5 WHERE title IN (
  'Surfing lesson together',
  'Zip-lining through the forest',
  'Camping under the stars',
  'Cabin weekend'
);

-- Down Migration
ALTER TABLE activities DROP COLUMN difficulty;
