/*
# Add financial amount fields to stage JSONB columns

1. Changes
- stage1: add `dboqAmount` (numeric, default 0) — DBOQ Amount, auto-populated from PO Value SAR at project creation.
- stage2: add `poAmount` (numeric, default 0) — PO Amount, auto-populated from PO Value SAR at project creation.
- stage5: add `rfsAmount` (numeric, default 0) — RFS Amount, auto-calculated as 80% of ABOQ Amount.
- stage5: add `pacAmount` (numeric, default 0) — PAC Amount, auto-calculated as 10% of ABOQ Amount.
- stage6: add `facAmount` (numeric, default 0) — FAC Amount, auto-calculated as 10% of ABOQ Amount.

2. Important Notes
- These fields are stored inside existing JSONB columns; no new columns or tables are created.
- Existing rows will NOT have these keys until updated by the frontend. The frontend handles missing keys gracefully (defaults to 0).
- The column DEFAULT expressions are updated so new projects get these keys from the start.
*/

-- Update stage1 default to include dboqAmount
ALTER TABLE projects ALTER COLUMN stage1 SET DEFAULT '{"surveyStatus":"pending","designStatus":"pending","dboqStatus":"pending","sendDocsDate":"","receiveDocsDate":"","dboqAmount":0}'::jsonb;

-- Update stage2 default to include poAmount
ALTER TABLE projects ALTER COLUMN stage2 SET DEFAULT '{"poReceiveStatus":"pending","aboqStatus":"pending","baselineStartDate":"","baselineEndDate":"","poAmount":0,"aboqAmount":0}'::jsonb;

-- Update stage5 default to include rfsAmount and pacAmount
ALTER TABLE projects ALTER COLUMN stage5 SET DEFAULT '{"pcrStatus":"pending","pcrRef":"","sdnStatus":"pending","rfsStatus":"pending","pacStatus":"pending","pacCrqStatus":"pending","pacCrqNo":"","rfsAmount":0,"pacAmount":0}'::jsonb;

-- Update stage6 default to include facAmount
ALTER TABLE projects ALTER COLUMN stage6 SET DEFAULT '{"facStatus":"pending","facDate":"","clearancePermit":"pending","facCrqStatus":"pending","facCrqNo":"","facAmount":0}'::jsonb;
