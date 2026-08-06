/*
# Refactor PAT Stage field and add RFS Date for auto-calculated PAC/FAC dates

1. Modified Tables
- `projects` table: updates DEFAULT jsonb values for stage4 and stage5 columns.

2. Changes
- stage4: removes the three separate PAT team status fields
  (patStageProjectsTeam, patStageOperationsTeam, patStageHuaweiTeam) and replaces
  them with a single `patStage` text field whose value is one of:
  "Projects Team", "Operations Team", "Huawei Team".
- stage5: adds `rfsDate` (date string) used as the base for auto-calculating
  PAC Date (+90 days) and FAC Date (+365 days). PAC and FAC dates are computed
  in the frontend and displayed read-only.

3. Security
- No RLS or policy changes — only column defaults updated.

4. Important Notes
- Only DEFAULT values change. Existing rows keep their current jsonb.
- The frontend handles missing keys gracefully.
*/

-- stage4: replace 3 pat stage team fields with single patStage
ALTER TABLE projects ALTER COLUMN stage4 SET DEFAULT '{"patStatus":"pending","patReqNo":"","owsPatRequestDate":"","patStartDate":"","patStage":"","gisStatus":"pending","gisDocsSentDate":"","gisReceivedDate":"","crqHoStatus":"pending","crqHoNo":"","crqHoSubmittedFilesDate":""}'::jsonb;

-- stage5: add rfsDate
ALTER TABLE projects ALTER COLUMN stage5 SET DEFAULT '{"pcrStatus":"pending","pcrRef":"","sdnStatus":"pending","rfsStatus":"pending","rfsDate":"","pacStatus":"pending","pacDate":"","pacSubmitFilesDate":"","pacCrqStatus":"pending","pacCrqNo":""}'::jsonb;
