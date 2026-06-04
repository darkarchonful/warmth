-- Warmth App Database Schema

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE,
    apple_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(10),
    avatar_url TEXT,
    timezone VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE couples (
    id SERIAL PRIMARY KEY,
    user_a_id INTEGER REFERENCES users(id) NOT NULL,
    user_b_id INTEGER REFERENCES users(id),
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    paired_at TIMESTAMP,
    ended_at TIMESTAMP,
    ended_by INTEGER REFERENCES users(id),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50)
);

INSERT INTO categories (name, icon) VALUES
    ('Adventures', 'compass'),
    ('Chill', 'coffee'),
    ('Creative', 'palette'),
    ('Travel', 'plane'),
    ('Daily', 'sun'),
    ('Romance', 'heart'),
    ('Seasonal', 'snowflake'),
    ('Food', 'utensils'),
    ('Sporty', 'bike');

CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    title VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    image_url TEXT,
    seasons TEXT[] DEFAULT ARRAY['all'],
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed activities
INSERT INTO activities (category_id, title, tagline) VALUES
    -- Adventures
    (1, 'Horseback riding by the sea', 'Feel the breeze together'),
    (1, 'Kayaking at sunrise', 'Paddle into the golden light'),
    (1, 'Hiking to a viewpoint', 'Reach the top side by side'),
    (1, 'Surfing lesson together', 'Catch waves and laughs'),
    (1, 'Zip-lining through the forest', 'Let go and trust the ride'),
    (1, 'Snorkeling in clear water', 'Discover a world below'),
    -- Chill
    (2, 'Movie night at home', 'Blankets, popcorn, just us'),
    (2, 'Picnic in the park', 'Simple food, real conversation'),
    (2, 'Watch the sunset together', 'No phones, just the sky'),
    (2, 'Read books side by side', 'Quiet presence is enough'),
    (2, 'Hammock afternoon', 'Do nothing, perfectly'),
    (2, 'Evening walk with no plan', 'Wander and talk'),
    -- Creative
    (3, 'Pottery class', 'Shape something with your hands'),
    (3, 'Paint together', 'No talent needed, just colors'),
    (3, 'Cook a dish from a random country', 'Travel through taste'),
    (3, 'Photography walk in your city', 'See your world through new eyes'),
    (3, 'Write letters to future us', 'Open in one year'),
    (3, 'Build something together', 'A shelf, a birdhouse, a memory'),
    (3, 'Draw each other''s portrait', 'Laugh at the result'),
    (3, 'Learn a dance together', 'Step on toes, smile about it'),
    -- Travel
    (4, 'Weekend road trip', 'Pick a direction and go'),
    (4, 'Explore a new neighborhood', 'Be tourists in your own city'),
    (4, 'Camping under the stars', 'Just a tent and each other'),
    (4, 'Cabin weekend', 'Disconnect from everything else'),
    (4, 'Beach day trip', 'Sand, water, and nothing to do'),
    (4, 'Visit a town neither of you knows', 'Get lost on purpose'),
    -- Daily
    (5, 'Morning coffee together', 'Five quiet minutes before the day'),
    (5, 'Surprise lunch delivery', 'A small thing that says everything'),
    (5, 'Breakfast in bed', 'Start the day with warmth'),
    (5, 'Leave a handwritten note', 'Words she''ll keep'),
    (5, 'Walk together after dinner', 'The best conversations happen here'),
    (5, 'Cook dinner together', 'Side by side in the kitchen'),
    -- Romance
    (6, 'Candlelight dinner at home', 'You don''t need a restaurant'),
    (6, 'Rooftop bar evening', 'City lights and conversation'),
    (6, 'Stargazing', 'Find your star'),
    (6, 'Couples massage', 'Relax in the same room'),
    (6, 'Slow dance in the living room', 'Play your song'),
    (6, 'Surprise flower delivery', 'No reason needed'),
    -- Seasonal
    (7, 'Christmas market stroll', 'Hot cocoa and fairy lights'),
    (7, 'Beach bonfire evening', 'Summer nights at their best'),
    (7, 'Autumn leaf walk', 'Golden paths together'),
    (7, 'Ice skating', 'Hold hands and don''t let go'),
    (7, 'Spring flower field visit', 'Colors everywhere'),
    -- Food
    (8, 'Bake something together', 'Messy hands, sweet result'),
    (8, 'Wine tasting', 'Discover what you both love'),
    (8, 'Sushi making at home', 'Roll, laugh, eat'),
    (8, 'Farmers market morning', 'Pick ingredients for tonight'),
    (8, 'Try a cuisine you''ve never had', 'Adventure on a plate'),
    -- Sporty
    (9, 'Bike ride together', 'Wind in your hair, side by side'),
    (9, 'Morning yoga', 'Breathe together'),
    (9, 'Tennis or badminton', 'Play, don''t compete'),
    (9, 'Swimming at sunset', 'Warm water, golden light'),
    (9, 'Rock climbing', 'Trust each other on the wall');

CREATE TABLE swipes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    couple_id INTEGER REFERENCES couples(id) NOT NULL,
    activity_id INTEGER REFERENCES activities(id) NOT NULL,
    liked BOOLEAN NOT NULL,
    swiped_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, couple_id, activity_id)
);

CREATE TABLE checklist (
    id SERIAL PRIMARY KEY,
    couple_id INTEGER REFERENCES couples(id) NOT NULL,
    activity_id INTEGER REFERENCES activities(id) NOT NULL,
    matched_at TIMESTAMP DEFAULT NOW(),
    approved_by_a BOOLEAN DEFAULT FALSE,
    approved_by_b BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP,
    completed_by_a BOOLEAN DEFAULT FALSE,
    completed_by_b BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'matched'
    -- matched -> approved -> done
);

CREATE TABLE memories (
    id SERIAL PRIMARY KEY,
    couple_id INTEGER REFERENCES couples(id) NOT NULL,
    checklist_id INTEGER REFERENCES checklist(id) NOT NULL,
    note TEXT,
    photo_url TEXT,
    completed_at TIMESTAMP DEFAULT NOW()
);

-- Ledger for server-scheduled pushes (scheduler.js). Dedup + frequency caps:
-- send is gated on INSERT .. ON CONFLICT against the PK so overlapping cron
-- runs can't double-send; "once per N days" is a NOT EXISTS on (user_id,type).
CREATE TABLE notifications_log (
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type      VARCHAR(64) NOT NULL,
    dedup_key VARCHAR(128) NOT NULL,
    sent_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, dedup_key)
);
CREATE INDEX idx_notifications_log_user_type ON notifications_log(user_id, type, sent_at DESC);

-- Index for finding matches (both swiped)
CREATE INDEX idx_swipes_couple_activity ON swipes(couple_id, activity_id);
CREATE INDEX idx_swipes_user ON swipes(user_id, couple_id);
CREATE INDEX idx_checklist_couple ON checklist(couple_id, status);
CREATE INDEX idx_couples_invite ON couples(invite_code) WHERE active = TRUE;
CREATE INDEX idx_couples_active ON couples(active) WHERE active = TRUE;
