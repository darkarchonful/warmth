-- Up Migration
UPDATE activities SET image_url = '/images/activities/' || id || '.jpg'
WHERE id BETWEEN 1 AND 80 AND (image_url IS NULL OR image_url = '');

-- Down Migration
-- No destructive rollback: leave URLs in place.
