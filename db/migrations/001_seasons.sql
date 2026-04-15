-- Add seasons column to activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS seasons TEXT[] DEFAULT ARRAY['all'];

-- Adventures
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Horseback riding by the sea';
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Kayaking at sunrise';
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Hiking to a viewpoint';
UPDATE activities SET seasons = ARRAY['spring','summer'] WHERE title = 'Surfing lesson together';
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Zip-lining through the forest';
UPDATE activities SET seasons = ARRAY['summer'] WHERE title = 'Snorkeling in clear water';

-- Chill
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Picnic in the park';
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Hammock afternoon';

-- Travel
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Camping under the stars';
UPDATE activities SET seasons = ARRAY['summer'] WHERE title = 'Beach day trip';

-- Romance
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Rooftop bar evening';

-- Seasonal
UPDATE activities SET seasons = ARRAY['winter'] WHERE title = 'Christmas market stroll';
UPDATE activities SET seasons = ARRAY['summer'] WHERE title = 'Beach bonfire evening';
UPDATE activities SET seasons = ARRAY['autumn'] WHERE title = 'Autumn leaf walk';
UPDATE activities SET seasons = ARRAY['winter'] WHERE title = 'Ice skating';
UPDATE activities SET seasons = ARRAY['spring'] WHERE title = 'Spring flower field visit';

-- Sporty
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Bike ride together';
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Tennis or badminton';
UPDATE activities SET seasons = ARRAY['summer'] WHERE title = 'Swimming at sunset';
UPDATE activities SET seasons = ARRAY['spring','summer','autumn'] WHERE title = 'Rock climbing';

-- Everything else stays 'all' (default)
