-- Remove the 5 deck cards that never got usable card art (deleted manually in prod
-- 2026-09-17; snapshot in docs/removed_activities_2026-09-17.csv). Deleted by TITLE so
-- a fresh reseed / the dev DB ends up identical to prod without editing the seed
-- migration (which would shift ids and break the id->image-file mapping).
-- Skips any card a memory still points at (memories.activity_id has no cascade).
-- Idempotent: deletes 0 rows on prod.
WITH gone AS (
  SELECT a.id FROM activities a
   WHERE a.couple_id IS NULL
     AND a.title IN ('Candlelit bath together', 'Slow morning in bed with coffee',
                     'Make snow angels', 'Winter stargazing', 'Thrift-store outfit challenge')
     AND NOT EXISTS (SELECT 1 FROM memories m WHERE m.activity_id = a.id)
), s AS (DELETE FROM swipes    WHERE activity_id IN (SELECT id FROM gone)),
   c AS (DELETE FROM checklist WHERE activity_id IN (SELECT id FROM gone))
SELECT 1;
DELETE FROM activities a
 WHERE a.couple_id IS NULL
   AND a.title IN ('Candlelit bath together', 'Slow morning in bed with coffee',
                   'Make snow angels', 'Winter stargazing', 'Thrift-store outfit challenge')
   AND NOT EXISTS (SELECT 1 FROM memories m WHERE m.activity_id = a.id)
   AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.activity_id = a.id)
   AND NOT EXISTS (SELECT 1 FROM checklist c WHERE c.activity_id = a.id);
