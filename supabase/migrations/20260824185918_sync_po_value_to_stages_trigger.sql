/*
# Auto-sync PO Value to DBOQ Amount and PO Amount

When po_value_sar is set on a project, automatically populate
stage1.dboqAmount and stage2.poAmount to match.

1. New function: sync_po_value_to_stages()
   - Trigger function that runs BEFORE INSERT or UPDATE on projects
   - If po_value_sar is provided (non-null), sets stage1.dboqAmount
     and stage2.poAmount to the same value
   - Preserves all other fields in stage1 and stage2

2. Trigger: trg_sync_po_value
   - Fires BEFORE INSERT OR UPDATE on projects
   - Calls sync_po_value_to_stages()

3. Data fix: update existing projects where po_value_sar > 0
   but stage1.dboqAmount or stage2.poAmount don't match
*/

CREATE OR REPLACE FUNCTION sync_po_value_to_stages()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  s1 jsonb;
  s2 jsonb;
BEGIN
  IF NEW.po_value_sar IS NOT NULL AND NEW.po_value_sar != 0 THEN
    s1 := COALESCE(NEW.stage1, '{}'::jsonb);
    s2 := COALESCE(NEW.stage2, '{}'::jsonb);
    NEW.stage1 := jsonb_set(s1, '{dboqAmount}', to_jsonb(NEW.po_value_sar));
    NEW.stage2 := jsonb_set(s2, '{poAmount}', to_jsonb(NEW.po_value_sar));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_po_value ON projects;
CREATE TRIGGER trg_sync_po_value
  BEFORE INSERT OR UPDATE OF po_value_sar ON projects
  FOR EACH ROW
  EXECUTE FUNCTION sync_po_value_to_stages();

-- Fix existing projects: set dboqAmount and poAmount to match po_value_sar
UPDATE projects
SET stage1 = jsonb_set(COALESCE(stage1, '{}'::jsonb), '{dboqAmount}', to_jsonb(po_value_sar)),
    stage2 = jsonb_set(COALESCE(stage2, '{}'::jsonb), '{poAmount}', to_jsonb(po_value_sar))
WHERE po_value_sar IS NOT NULL
  AND po_value_sar != 0
  AND (
    (stage1->>'dboqAmount')::numeric IS DISTINCT FROM po_value_sar
    OR (stage2->>'poAmount')::numeric IS DISTINCT FROM po_value_sar
  );
