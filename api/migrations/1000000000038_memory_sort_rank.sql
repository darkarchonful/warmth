-- Up Migration
-- Per-couple manual ordering of memories (drag-to-reorder, "for fun"). A higher
-- sort_rank floats a memory up within its month. NULL = not manually ordered →
-- falls back to completed_at. Ordering is always month-first, so ranks only
-- compete within a month and a simple global index assignment is safe.
ALTER TABLE memories ADD COLUMN IF NOT EXISTS sort_rank double precision;
