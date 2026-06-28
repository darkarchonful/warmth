-- Remove the "Face masks side by side" card from the deck (was id 95 in prod).
-- Deleted by TITLE, not id, so it stays correct on a fresh reseed too — migration 15
-- inserts it, this migration removes it, and we never edit migration 15's bulk INSERT
-- (removing a row there would shift every later card's auto-assigned id and break the
-- id->image-file mapping). swipes.activity_id has no ON DELETE CASCADE, so clear the
-- referencing rows first. Idempotent: on the live DB the row is already gone (deleted
-- manually 2026-06-27) and this deletes 0.
DELETE FROM swipes
 WHERE activity_id IN (SELECT id FROM activities WHERE title = 'Face masks side by side');
DELETE FROM checklist
 WHERE activity_id IN (SELECT id FROM activities WHERE title = 'Face masks side by side');
DELETE FROM activities WHERE title = 'Face masks side by side';
