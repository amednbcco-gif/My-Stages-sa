/*
# Unify Cable Pulling Status key in stage3 JSON

## Why
The List Form (MILESTONES) wrote the Cable Pulling Status value under the key
"Cable Pulling Status" (capital P, spaces), while the Card Layout (STAGE_FIELDS)
read it under "cable pulling Status" (lowercase p, spaces). Because the keys did
not match, a value entered in the List Form never appeared in the Card Layout.

## Changes
1. Migrate existing rows: copy any value stored under the old keys
   ("Cable Pulling Status" or "cable pulling Status") into the new canonical key
   "cablePullingStatus", then remove the old keys from the JSON.
2. Update the stage3 column DEFAULT so new rows include "cablePullingStatus":"pending".
3. Ensure every existing row has a "cablePullingStatus" value (default "pending").

## Safety
- No columns are dropped or renamed; only JSONB keys inside stage3 are reorganized.
- Existing data is preserved and migrated.
- Idempotent: re-running simply ensures the canonical key is present.
*/

-- 1) Migrate old keys -> canonical camelCase key, then drop the old keys
UPDATE projects
SET stage3 = (
  jsonb_strip_nulls(
    (stage3 - 'Cable Pulling Status' - 'cable pulling Status')
    || jsonb_build_object(
      'cablePullingStatus',
      COALESCE(
        stage3->>'Cable Pulling Status',
        stage3->>'cable pulling Status',
        'pending'
      )
    )
  )
)
WHERE stage3 ? 'Cable Pulling Status'
   OR stage3 ? 'cable pulling Status'
   OR NOT (stage3 ? 'cablePullingStatus');

-- 2) Ensure every row has the canonical key (default pending)
UPDATE projects
SET stage3 = stage3 || jsonb_build_object('cablePullingStatus', 'pending')
WHERE NOT (stage3 ? 'cablePullingStatus');

-- 3) Update the column default to include the new key
ALTER TABLE projects ALTER COLUMN stage3 SET DEFAULT '{"permitsStatus":"pending","civilActualMeters":0,"hddActualMeters":0,"fiberCableMeters":0,"cablePullingStatus":"pending","fiberSplicingStatus":"pending","patchingStatus":"pending","patchingDoneStatus":"pending","civilStatus":"pending","actualStartDate":"","actualEndDate":"","closePermit":"pending","clearancePermit":"pending","permitSubmittedDate":"","permitIssuedDate":"","permitClosedDate":"","permitClearancedDate":"","finalClearanceStatus":"pending"}'::jsonb;
