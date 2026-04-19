-- Up Migration
UPDATE activities SET image_url = '/images/activities/' || id || '.jpg' WHERE id BETWEEN 1 AND 13;

-- Down Migration
UPDATE activities SET image_url = NULL WHERE id BETWEEN 2 AND 13;
