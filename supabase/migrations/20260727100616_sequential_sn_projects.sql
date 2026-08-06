/*
# Replace PRJ-XXXXXX serial numbers with sequential 01, 02, 03...

1. Changes
- Drops the old `trg_generate_sn` trigger that produced `PRJ-<uuid6>` codes.
- Replaces `generate_project_sn()` so new projects get a zero-padded
  sequential number (01, 02, 03 ...) based on the current max numeric SN.
- Backfills every existing project row so its `sn` matches its creation
  order (oldest = 01), preserving the current created_at ordering.
2. Security
- No RLS / policy changes. Existing policies on `projects` are untouched.
3. Notes
- The sequence is derived from the table contents (MAX of numeric sn) at
  insert time, which is safe under the project's single-writer insert flow.
*/

DROP TRIGGER IF EXISTS trg_generate_sn ON projects;

CREATE OR REPLACE FUNCTION generate_project_sn()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  next_num int;
BEGIN
  IF NEW.sn IS NULL OR NEW.sn = '' THEN
    SELECT COALESCE(MAX(sn::int), 0) + 1 INTO next_num FROM projects
      WHERE sn ~ '^[0-9]+$';
    NEW.sn := lpad(next_num::text, 2, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_sn
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION generate_project_sn();

-- Backfill existing rows with sequential numbers in creation order.
WITH ordered AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
  FROM projects
)
UPDATE projects p
SET sn = lpad(o.rn::text, 2, '0')
FROM ordered o
WHERE p.id = o.id
  AND (p.sn IS NULL OR p.sn = '' OR p.sn !~ '^[0-9]+$' OR p.sn <> lpad(o.rn::text, 2, '0'));
