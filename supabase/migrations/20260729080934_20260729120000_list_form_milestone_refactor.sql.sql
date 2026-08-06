/*
# List Form milestone refactor

1. Modified Tables
- `projects` table: updates the DEFAULT jsonb values for stage1..stage6 columns
  to include the new milestone fields. Existing rows are NOT modified — only new
  rows get the new defaults. The frontend reads these jsonb objects dynamically,
  so existing projects will show the new fields as empty/pending (their default
  when missing).

2. New / Renamed Fields
- stage1 (Survey & Design):
  - `dboqAmount` (number): DBOQ Amount
  - `planNo` moved into stage1 jsonb (also exists as top-level column)
- stage2 (PO & ABOQ):
  - `aboqAmount` (number): ABOQ Amount
  - `aboqSubmittedDate` (date): ABOQ Submitted Date
  - `aboqApprovedDate` (date): ABOQ Approved Date
  - `poIssuanceDate` (date): PO Issuance Date
- stage3 (Execution / Permit):
  - `permitClosedDate` (date): Permit Closed Date (now active)
  - `permitClearancedDate` (date): Permit Clearanced Date (now active)
  - `finalClearanceStatus` (status): Final Clearance Status for Permit
- stage4 (PAT / GIS / CRQ HO):
  - `crqHoReqNo` (text): HO REQ No.
- stage5 (PCR & SDN / RFS / PAC):
  - `pcrDate`, `sdnDate`, `sdnRef` added
  - `pacErqNo` renamed conceptually to REQ No. (kept as pacErqNo for compat)
- stage6 (FAC & Clearance):
  - `facReqNo` (text): FAC REQ No.
  - `finalClearanceStatus` (status): Final Clearance Status for FAC

3. Security
- No RLS or policy changes — only column defaults updated.

4. Important Notes
- Only DEFAULT values change. Existing rows keep their current jsonb.
- The frontend handles missing keys gracefully (treats them as pending/empty).
*/

-- stage1: Survey & Design — add dboqAmount, planNo
ALTER TABLE projects ALTER COLUMN stage1 SET DEFAULT '{"surveyStatus":"pending","designStatus":"pending","dboqStatus":"pending","dboqAmount":0,"sendDocsDate":"","receiveDocsDate":"","planNo":""}'::jsonb;

-- stage2: PO & ABOQ — add aboq fields + poIssuanceDate
ALTER TABLE projects ALTER COLUMN stage2 SET DEFAULT '{"poReceiveStatus":"pending","aboqStatus":"pending","aboqAmount":0,"aboqSubmittedDate":"","aboqApprovedDate":"","baselineStartDate":"","baselineEndDate":"","poIssuanceDate":"","sendDocsDate":"","receiveDocsDate":""}'::jsonb;

-- stage3: Execution / Permit — add permitClosedDate, permitClearancedDate, finalClearanceStatus
ALTER TABLE projects ALTER COLUMN stage3 SET DEFAULT '{"permitsStatus":"pending","civilActualMeters":0,"hddActualMeters":0,"fiberCableMeters":0,"fiberSplicingStatus":"pending","patchingStatus":"pending","patchingDoneStatus":"pending","civilStatus":"pending","actualStartDate":"","actualEndDate":"","closePermit":"pending","clearancePermit":"pending","permitSubmittedDate":"","permitIssuedDate":"","permitClosedDate":"","permitClearancedDate":"","finalClearanceStatus":"pending"}'::jsonb;

-- stage4: PAT / GIS / CRQ HO — add crqHoReqNo
ALTER TABLE projects ALTER COLUMN stage4 SET DEFAULT '{"patStatus":"pending","patReqNo":"","owsPatRequestDate":"","patStartDate":"","patStage":"","gisStatus":"pending","gisDocsSentDate":"","gisReceivedDate":"","crqHoStatus":"pending","crqHoNo":"","crqHoErqNo":"","crqHoReqNo":"","crqHoSubmittedFilesDate":""}'::jsonb;

-- stage5: PCR & SDN / RFS / PAC — add pcrDate, sdnDate, sdnRef
ALTER TABLE projects ALTER COLUMN stage5 SET DEFAULT '{"pcrStatus":"pending","pcrRef":"","pcrDate":"","sdnStatus":"pending","sdnDate":"","sdnRef":"","rfsStatus":"pending","rfsDate":"","pacStatus":"pending","pacDate":"","pacSubmitFilesDate":"","pacCrqStatus":"pending","pacErqNo":"","pacCrqNo":""}'::jsonb;

-- stage6: FAC & Clearance — add facReqNo, finalClearanceStatus
ALTER TABLE projects ALTER COLUMN stage6 SET DEFAULT '{"facStatus":"pending","facDate":"","facSubmitFilesDate":"","clearancePermit":"pending","facCrqStatus":"pending","facCrqNo":"","facCrqErqNo":"","facReqNo":"","finalClearanceStatus":"pending"}'::jsonb;
