/*
# Make PAC/FAC dates editable, add Close Permit to stage 3

1. Modified Tables
- `projects` table: updates DEFAULT jsonb for stage3 and stage6 columns.

2. Changes
- stage3: adds `closePermit` field (status-like: inprogress/submitted/Closed)
  placed after actualEndDate.
- stage6: no default change needed (facDate already exists as editable date).
- stage5: pacDate already exists as editable date.

3. Security
- No RLS or policy changes.

4. Important Notes
- Only DEFAULT values change. Existing rows keep their current jsonb.
- PAC Date and FAC Date are now manually editable date fields (renamed in UI to
  "PAC Due Date" and "FAC Due Date"). The auto-calculation from RFS date is removed.
*/

-- stage3: add closePermit after actualEndDate
ALTER TABLE projects ALTER COLUMN stage3 SET DEFAULT '{"permitsStatus":"pending","civilActualMeters":0,"hddActualMeters":0,"fiberSplicingStatus":"pending","patchingStatus":"pending","actualStartDate":"","actualEndDate":"","closePermit":"pending"}'::jsonb;
