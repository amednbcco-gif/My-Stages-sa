import type { StatusValue } from "./types";

export interface StageField {
  key: string;
  label: string;
  type: "status" | "date" | "number" | "text" | "patsub" | "team" | "close-permit" | "permit" | "clearance" | "pat-status" | "crq-ho" | "repat-status" | "done" | "execution" | "connect-scan";
}

export const STAGE_LABELS: Record<string, string> = {
  stage1: "Stage 1 — Survey & Design المسح والتصميم",
  stage2: "Stage 2 — PO & ABOQ",
  stage3: "Stage 3 — The Execution التنفيذ",
  stage4: "Stage 4 — PAT & CRQ HO",
  stage5: "Stage 5 — RFS & Billing",
  stage6: "Stage 6 — FAC & Clearance",
};

export const STAGE_ORDER = ["stage1", "stage2", "stage3", "stage4", "stage5", "stage6"] as const;

export const STAGE_FIELDS: Record<string, StageField[]> = {
  stage1: [
    { key: "surveyStatus", label: "Survey", type: "status" },
    { key: "designStatus", label: "Design", type: "status" },
    { key: "dboqStatus", label: "DBOQ", type: "status" },
    { key: "dboqAmount", label: "DBOQ Amount", type: "number" },
    { key: "planNo", label: "Plan No.", type: "text" },
    { key: "sendDocsDate", label: "Docs Sent", type: "date" },
    { key: "receiveDocsDate", label: "Docs Received", type: "date" },
  ],
  stage2: [
    { key: "poReceiveStatus", label: "PO Status", type: "status" },
    { key: "aboqStatus", label: "ABOQ", type: "status" },
    { key: "aboqAmount", label: "ABOQ Amount", type: "number" },
    { key: "baselineStartDate", label: "Baseline Start", type: "date" },
    { key: "baselineEndDate", label: "Baseline End", type: "date" },
    { key: "poIssuanceDate", label: "PO Issuance Date", type: "date" },
    { key: "poAmount", label: "PO Amount", type: "number" },
    { key: "aboqSubmittedDate", label: "ABOQ Submitted Date", type: "date" },
    { key: "aboqApprovedDate", label: "ABOQ Approved Date", type: "date" },
  ],
  stage3: [
    { key: "permitsStatus", label: "Permits", type: "permit" },
    { key: "civilActualMeters", label: "Civil (m)", type: "number" },
    { key: "hddActualMeters", label: "HDD (m)", type: "number" },
    { key: "mhHh", label: "MH/HH", type: "number" },
    { key: "odbOdf", label: "ODB/ODF", type: "number" },
    { key: "closures", label: "Closures", type: "number" },
    { key: "fiberCableMeters", label: "Fiber Cable (m)", type: "number" },
    { key: "fiberSplicingStatus", label: "Fiber Splicing", type: "done" },
    { key: "patchingStatus", label: "Patching", type: "done" },
    { key: "cable pulling Status", label: "Cable Pulling Status", type: "done" },
    { key: "actualStartDate", label: "Actual Start", type: "date" },
    { key: "actualEndDate", label: "Actual End", type: "date" },
    { key: "civilStatus", label: "Execution Status", type: "execution" },
  ],
  stage4: [
    { key: "patStatus", label: "PAT Status", type: "pat-status" },
    { key: "patReqNo", label: "PAT Req. No", type: "text" },
    { key: "owsPatRequestDate", label: "OWS/PAT Request", type: "date" },
    { key: "patStartDate", label: "PAT Start", type: "date" },
    { key: "patStage", label: "PAT Stage", type: "team" },
    { key: "connectScanStatus", label: "Connect Scan Status", type: "connect-scan" },
    { key: "gisStatus", label: "GIS", type: "status" },
    { key: "gisDocsSentDate", label: "GIS Docs Sent", type: "date" },
    { key: "gisReceivedDate", label: "GIS Received", type: "date" },
    { key: "crqHoStatus", label: "CRQ HO Status", type: "crq-ho" },
    { key: "crqHoNo", label: "CRQ HO No.", type: "text" },
    { key: "crqHoReqNo", label: "HO REQ No.", type: "text" },
    { key: "crqHoSubmittedFilesDate", label: "CRQ HO Submitted Files Date", type: "date" },
    { key: "repatStatus", label: "Re-PAT Status", type: "repat-status" },
    { key: "repatSubmittedFilesDate", label: "Re-PAT Submitted Files Date", type: "date" },
    { key: "repatReqNo", label: "Re-PAT REQ No", type: "text" },
    { key: "repatStage", label: "Re-PAT Stages", type: "team" },
    { key: "repatDate", label: "Re-PAT Date", type: "date" },
  ],
  stage5: [
    { key: "pcrStatus", label: "PCR", type: "status" },
    { key: "pcrRef", label: "PCR Ref", type: "text" },
    { key: "pcrDate", label: "PCR Date", type: "date" },
    { key: "sdnStatus", label: "SDN", type: "status" },
    { key: "sdnDate", label: "SDN Date", type: "date" },
    { key: "sdnRef", label: "SDN Reference", type: "text" },
    { key: "rfsStatus", label: "RFS", type: "status" },
    { key: "rfsDate", label: "RFS Approved Date", type: "date" },
    { key: "rfsSubmittedFilesDate", label: "RFS Submitted Files Date", type: "date" },
    { key: "rfsAmount", label: "RFS Amount", type: "number" },
    { key: "pacStatus", label: "PAC Status", type: "patsub" },
    { key: "pacDate", label: "PAC Due Date", type: "date" },
    { key: "pacSubmitFilesDate", label: "PAC Submit Files Date", type: "date" },
    { key: "pacAmount", label: "PAC Amount", type: "number" },
    { key: "pacErqNo", label: "PAC REQ No.", type: "text" },
    { key: "pacCrqNo", label: "PAC CRQ No.", type: "text" },
  ],
  stage6: [
    { key: "facStatus", label: "FAC Status", type: "patsub" },
    { key: "facDate", label: "FAC Due Date", type: "date" },
    { key: "facSubmitFilesDate", label: "FAC Submit Files Date", type: "date" },
    { key: "facAmount", label: "FAC Amount", type: "number" },
    { key: "finalClearanceStatus", label: "Final Clearance Permit", type: "clearance" },
    { key: "facCrqNo", label: "FAC CRQ No.", type: "text" },
    { key: "facReqNo", label: "FAC REQ No.", type: "text" },
  ],
};

export const STATUS_OPTIONS: { value: StatusValue; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "inprogress", label: "In Progress" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
];

export const PERMIT_OPTIONS: { value: StatusValue; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "inprogress", label: "In Progress" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Issued" },
  { value: "closed", label: "Closed" },
  { value: "clearanced", label: "Clearanced" },
];

export const CLEARANCE_OPTIONS: { value: StatusValue; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "inprogress", label: "In Progress" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Clearanced" },
];

export const CLOSE_PERMIT_OPTIONS: { value: StatusValue; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "inprogress", label: "In Progress" },
  { value: "submitted", label: "Submitted" },
  { value: "closed", label: "Closed" },
];

export const PATSUB_OPTIONS: { value: StatusValue; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
];
export const CONNECT_SCAN_OPTIONS: { value: string; label: string }[] = [
  { value: "inprogress", label: "In-Progress" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
];

export const PAT_STATUS_OPTIONS: { value: StatusValue; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "inprogress", label: "In Progress" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "PATTED" },
];

export const CRQ_HO_OPTIONS: { value: StatusValue; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Handed Over" },
];

export const REPAT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Pending" },
  { value: "inprogress", label: "In Progress" },
  { value: "submitted", label: "Submitted" },
  { value: "rectified", label: "Rectified" },
];

export const TEAM_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Select team" },
  { value: "Projects Team", label: "Projects Team" },
  { value: "Operations Team", label: "Operations Team" },
  { value: "Huawei Team", label: "Huawei Team" },
];

export const DONE_OPTIONS: { value: StatusValue; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "inprogress", label: "In Progress" },
  { value: "approved", label: "Done" },
];

export const EXECUTION_OPTIONS: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "civil_inprogress", label: "CIVIL Inprogress" },
  { value: "fiber_inprogress", label: "FIBER Inprogress" },
  { value: "splicing_inprogress", label: "Splicing Inprogress" },
  { value: "patching_inprogress", label: "Patching Inprogress" },
  { value: "approved", label: "Done" },
];

/* ─── Milestone definitions (List Form) ────────────────────── */
export interface MilestoneField {
  key: string;
  label: string;
  type: "status" | "date" | "number" | "text" | "patsub" | "team" | "close-permit" | "permit" | "clearance" | "done" | "pat-status" | "crq-ho" | "repat-status" | "execution";
}

export interface Milestone {
  id: string;
  title: string;
  stage: string;
  fields: MilestoneField[];
  statusField: MilestoneField;
  statusType: "status" | "patsub" | "close-permit" | "permit" | "clearance" | "done" | "pat-status" | "crq-ho" | "repat-status" | "execution";
}

export const MILESTONES: Milestone[] = [
  {
    id: "survey",
    title: "Survey & Design المسح والتصميم",
    stage: "stage1",
    statusType: "status",
    statusField: { key: "surveyStatus", label: "Survey & Design Status", type: "status" },
    fields: [
      { key: "receiveDocsDate", label: "Docs Received Date", type: "date" },
      { key: "sendDocsDate", label: "Docs Submitted Date", type: "date" },
      { key: "dboqAmount", label: "DBOQ Amount", type: "number" },
      { key: "planNo", label: "Plan No.", type: "text" },
      { key: "designStatus", label: "Design Status", type: "status" },
      { key: "dboqStatus", label: "DBOQ Status", type: "status" },
    ],
  },
  {
    id: "po",
    title: "PO & ABOQ",
    stage: "stage2",
    statusType: "status",
    statusField: { key: "poReceiveStatus", label: "PO Status", type: "status" },
    fields: [
      { key: "baselineStartDate", label: "Baseline Start", type: "date" },
      { key: "baselineEndDate", label: "Baseline End", type: "date" },
      { key: "poIssuanceDate", label: "PO Issuance Date", type: "date" },
      { key: "poAmount", label: "PO Amount", type: "number" },
      { key: "aboqAmount", label: "ABOQ Amount", type: "number" },
      { key: "aboqStatus", label: "ABOQ Status", type: "status" },
      { key: "aboqSubmittedDate", label: "ABOQ Submitted Date", type: "date" },
      { key: "aboqApprovedDate", label: "ABOQ Approved Date", type: "date" },
    ],
  },
  {
    id: "permit",
    title: "The Permits التصاريح",
    stage: "stage3",
    statusType: "permit",
    statusField: { key: "permitsStatus", label: "Permit Status", type: "permit" },
    fields: [
      { key: "permitSubmittedDate", label: "Submitted Date", type: "date" },
      { key: "permitIssuedDate", label: "Issued Date", type: "date" },
      { key: "permitClosedDate", label: "Closed Date", type: "date" },
      { key: "permitClearancedDate", label: "Clearanced Date", type: "date" },
      { key: "finalClearanceStatus", label: "Final Clearance Status", type: "clearance" },
    ],
  },
  {
    id: "civil",
    title: "The Execution",
    stage: "stage3",
    statusType: "execution",
    statusField: { key: "civilStatus", label: "Execution Status", type: "execution" },
    fields: [
      { key: "actualStartDate", label: "Actual Start Date", type: "date" },
      { key: "actualEndDate", label: "Actual End Date", type: "date" },
      { key: "civilActualMeters", label: "Civil Length (m)", type: "number" },
      { key: "hddActualMeters", label: "HDD (m)", type: "number" },
      { key: "mhHh", label: "MH/HH", type: "number" },
      { key: "odbOdf", label: "ODB/ODF", type: "number" },
      { key: "closures", label: "Closures", type: "number" },
      { key: "fiberCableMeters", label: "Fiber Cable (m)", type: "number" },
      { key: "fiberSplicingStatus", label: "Splicing Status", type: "done" },
      { key: "patchingStatus", label: "Patching Status", type: "done" },
      { key: "cable Pulling Status", label: "cable pulling Status", type: "done" },
    ],
  },
  {
  id: "pat",
  title: "PAT",
  stage: "stage4",
  statusType: "pat-status",
  statusField: { key: "patStatus", label: "PAT Status", type: "pat-status" },
  fields: [
    { key: "owsPatRequestDate", label: "PAT OWS Request Date", type: "date" },
    { key: "patReqNo", label: "PAT Req No.", type: "text" },
    { key: "patStartDate", label: "PAT Start Date", type: "date" },
    { key: "patStage", label: "PAT Stages", type: "team" },
    { key: "connectScanStatus", label: "Connect Scan Status", type: "connect-scan" },
  ],
},
  {
    id: "repat",
    title: "Re-PAT",
    stage: "stage4",
    statusType: "repat-status",
    statusField: { key: "repatStatus", label: "Re-PAT Status", type: "repat-status" },
    fields: [
      { key: "repatSubmittedFilesDate", label: "Re-PAT Submitted Files Date", type: "date" },
      { key: "repatReqNo", label: "Re-PAT REQ No", type: "text" },
      { key: "repatStage", label: "Re-PAT Stages", type: "team" },
      { key: "repatDate", label: "Re-PAT Date", type: "date" },
    ],
  },
  {
    id: "gis",
    title: "GIS",
    stage: "stage4",
    statusType: "status",
    statusField: { key: "gisStatus", label: "GIS Status", type: "status" },
    fields: [
      { key: "gisDocsSentDate", label: "GIS Docs Sent", type: "date" },
      { key: "gisReceivedDate", label: "GIS Received Date", type: "date" },
    ],
  },
  {
    id: "crqho",
    title: "CRQ HO",
    stage: "stage4",
    statusType: "crq-ho",
    statusField: { key: "crqHoStatus", label: "CRQ HO Status", type: "crq-ho" },
    fields: [
      { key: "crqHoSubmittedFilesDate", label: "CRQ HO Submitted Files Date", type: "date" },
      { key: "crqHoNo", label: "CRQ HO No.", type: "text" },
      { key: "crqHoReqNo", label: "HO REQ No.", type: "text" },
    ],
  },
  {
    id: "pcr",
    title: "PCR & SDN",
    stage: "stage5",
    statusType: "status",
    statusField: { key: "pcrSdnStatus", label: "PCR & SDN Status", type: "status" },
    fields: [
      { key: "pcrDate", label: "PCR Date", type: "date" },
      { key: "pcrRef", label: "PCR Ref", type: "text" },
      { key: "pcrStatus", label: "PCR Status", type: "status" },
      { key: "sdnStatus", label: "SDN Status", type: "status" },
      { key: "sdnDate", label: "SDN Date", type: "date" },
      { key: "sdnRef", label: "SDN Reference", type: "text" },
    ],
  },
  {
    id: "rfs",
    title: "RFS",
    stage: "stage5",
    statusType: "status",
    statusField: { key: "rfsStatus", label: "RFS Status", type: "status" },
    fields: [
      { key: "rfsDate", label: "RFS Approved Date", type: "date" },
      { key: "rfsSubmittedFilesDate", label: "RFS Submitted Files Date", type: "date" },
      { key: "rfsAmount", label: "RFS Amount", type: "number" },
    ],
  },
  {
    id: "pac",
    title: "PAC",
    stage: "stage5",
    statusType: "patsub",
    statusField: { key: "pacCrqStatus", label: "PAC CRQ Status", type: "patsub" },
    fields: [
      { key: "pacDate", label: "PAC Due Date", type: "date" },
      { key: "pacSubmitFilesDate", label: "PAC Submit Files Date", type: "date" },
      { key: "pacAmount", label: "PAC Amount", type: "number" },
      { key: "pacErqNo", label: "PAC REQ No.", type: "text" },
      { key: "pacCrqNo", label: "PAC CRQ No.", type: "text" },
    ],
  },
  {
    id: "fac",
    title: "FAC",
    stage: "stage6",
    statusType: "patsub",
    statusField: { key: "facCrqStatus", label: "FAC CRQ Status", type: "patsub" },
    fields: [
      { key: "facDate", label: "FAC Due Date", type: "date" },
      { key: "facSubmitFilesDate", label: "FAC Submit Files Date", type: "date" },
      { key: "facAmount", label: "FAC Amount", type: "number" },
      { key: "facCrqErqNo", label: "FAC CRQ No.", type: "text" },
      { key: "facReqNo", label: "FAC REQ No.", type: "text" },
      { key: "finalClearanceStatus", label: "Final Clearance Status", type: "clearance" },
    ],
  },
];

export function addDays(iso: string, days: number): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function statusLabel(value: string): string {
  return STATUS_OPTIONS.find((o) => o.value === value)?.label ?? "Pending";
}

export function stageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? "Stage 6 — FAC & Clearance";
}

export function stageShortLabel(stage: string): string {
  return `Stage ${stage.replace("stage", "")}`;
}

export function computeProgress(project: Record<string, unknown> | object): number {
  const proj = project as Record<string, Record<string, unknown>>;
  const statusKeys: { stage: keyof typeof STAGE_FIELDS; keys: string[] }[] = STAGE_ORDER.map((s) => ({
    stage: s,
    keys: STAGE_FIELDS[s].filter((f) => f.type === "status" || f.type === "patsub" || f.type === "pat-status" || f.type === "crq-ho" || f.type === "done" || f.type === "execution").map((f) => f.key),
  }));

  let total = 0;
  let approved = 0;

  for (const { stage, keys } of statusKeys) {
    const data = proj[stage] as Record<string, unknown>;
    for (const key of keys) {
      total++;
      if (data[key] === "approved" || data[key] === "closed") approved++;
    }
  }

  if (total === 0) return 0;
  return Math.round((approved / total) * 100);
}

export function currentStage(project: Record<string, unknown> | object): string {
  const proj = project as Record<string, Record<string, unknown>>;
  for (const stage of STAGE_ORDER) {
    const fields = STAGE_FIELDS[stage].filter((f) => f.type === "status" || f.type === "patsub" || f.type === "pat-status" || f.type === "crq-ho" || f.type === "done" || f.type === "execution");
    const data = proj[stage] as Record<string, unknown>;
    const allApproved = fields.every((f) => data[f.key] === "approved" || data[f.key] === "closed");
    if (!allApproved) return stage;
  }
  return "stage6";
}
