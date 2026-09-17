-- comments is polymorphic (parent_type 'plan' -> checklist.id, 'memory' -> memories.id),
-- so it has no FK and nothing cascades. Unpair and "delete a done plan" removed the
-- parent rows but left their comments behind (found in the 2026-09-17 smoke test).
-- Fix the whole class at the DB level: whenever a plan or memory row is deleted — by any
-- code path, cascade, or manual SQL — its comments go with it.
CREATE OR REPLACE FUNCTION delete_parent_comments() RETURNS trigger AS $$
BEGIN
  DELETE FROM comments WHERE parent_type = TG_ARGV[0] AND parent_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_checklist_delete_comments ON checklist;
CREATE TRIGGER trg_checklist_delete_comments
  AFTER DELETE ON checklist FOR EACH ROW EXECUTE FUNCTION delete_parent_comments('plan');

DROP TRIGGER IF EXISTS trg_memories_delete_comments ON memories;
CREATE TRIGGER trg_memories_delete_comments
  AFTER DELETE ON memories FOR EACH ROW EXECUTE FUNCTION delete_parent_comments('memory');

-- One-time sweep of comments already orphaned.
DELETE FROM comments c
 WHERE (c.parent_type = 'plan'   AND NOT EXISTS (SELECT 1 FROM checklist cl WHERE cl.id = c.parent_id))
    OR (c.parent_type = 'memory' AND NOT EXISTS (SELECT 1 FROM memories m  WHERE m.id  = c.parent_id));
