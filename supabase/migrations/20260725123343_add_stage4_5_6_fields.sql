/*
# Add new fields to stages 4, 5, and 6

1. Modified Tables
- `projects` table: updates the DEFAULT jsonb values for stage4, stage5, stage6 columns
  to include new fields. Existing rows are NOT modified — only new rows get the new
  defaults. The frontend reads these jsonb objects dynamically, so existing projects
  will simply show the new fields as empty/pending (their default when missing).

2. New Fields
- stage4:
  - `patStageProjectsTeam` (status): PAT Stage — Projects Team
  - `patStageOperationsTeam` (status): PAT Stage — Operations Team
  - `patStageHuaweiTeam` (status): PAT Stage — Huawei Team
  - `gisDocsSentDate` (date): GIS Docs Sent
  - `gisReceivedDate` (date): GIS Received
- stage5:
  - `pacDate` (date): PAC Date
  - `pacSubmitFilesDate` (date): PAC Submit Files Date
- stage6:
  - `facSubmitFilesDate` (date): FAC Submit Files Date
  (facDate already exists)

3. Security
- No RLS or policy changes — only column defaults updated.

4. Important Notes
- This migration only changes DEFAULT values. Existing project rows keep their
  current jsonb values. The app handles missing keys gracefully (treats them as
  pending/empty), so no data backfill is required.
*/

-- stage4: add PAT team statuses + GIS docs dates
ALTER TABLE projects ALTER COLUMN stage4 SET DEFAULT '{"patStatus":"pending","patReqNo":"","owsPatRequestDate":"","patStartDate":"","patStageProjectsTeam":"pending","patStageOperationsTeam":"pending","patStageHuaweiTeam":"pending","gisStatus":"pending","gisDocsSentDate":"","gisReceivedDate":"","crqHoStatus":"pending","crqHoNo":"","crqHoSubmittedFilesDate":""}'::jsonb;

-- stage5: add PAC date + PAC submit files date
ALTER TABLE projects ALTER COLUMN stage5 SET DEFAULT '{"pcrStatus":"pending","pcrRef":"","sdnStatus":"pending","rfsStatus":"pending","pacStatus":"pending","pacDate":"","pacSubmitFilesDate":"","pacCrqStatus":"pending","pacCrqNo":""}'::jsonb;

-- stage6: add FAC submit files date (facDate already exists)
ALTER TABLE projects ALTER COLUMN stage6 SET DEFAULT '{"facStatus":"pending","facDate":"","facSubmitFilesDate":"","clearancePermit":"pending","facCrqStatus":"pending","facCrqNo":""}'::jsonb;
