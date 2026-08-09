export type Role = "manager" | "engineer";

export type StatusValue = "pending" | "inprogress" | "submitted" | "approved" | "closed" | "clearanced";

export type ProjectStatus = "New" | "Pending" | "In Progress" | "Submitted" | "Completed";

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  role: Role;
  created_at: string;
}

export interface Stage1 {
  surveyStatus: StatusValue;
  designStatus: StatusValue;
  dboqStatus: StatusValue;
  dboqAmount: number;
  sendDocsDate: string;
  receiveDocsDate: string;
  planNo: string;
}

export interface Stage2 {
  poReceiveStatus: StatusValue;
  aboqStatus: StatusValue;
  aboqAmount: number;
  poAmount: number;
  aboqSubmittedDate: string;
  aboqApprovedDate: string;
  baselineStartDate: string;
  baselineEndDate: string;
  poIssuanceDate: string;
  sendDocsDate: string;
  receiveDocsDate: string;
}

export interface Stage3 {
  permitsStatus: StatusValue;
  civilActualMeters: number;
  hddActualMeters: number;
  mhHh: number;
  odbOdf: number;
  closures: number;
  fiberCableMeters: number;
  fiberSplicingStatus: StatusValue;
  patchingStatus: StatusValue;
  patchingDoneStatus: StatusValue;
  civilStatus: StatusValue;
  actualStartDate: string;
  actualEndDate: string;
  closePermit: StatusValue;
  clearancePermit: StatusValue;
  permitSubmittedDate: string;
  permitIssuedDate: string;
  permitClosedDate: string;
  permitClearancedDate: string;
  finalClearanceStatus: StatusValue;
}

export interface Stage4 {
  patStatus: StatusValue;
  patReqNo: string;
  owsPatRequestDate: string;
  patStartDate: string;
  patStage: string;
  gisStatus: StatusValue;
  gisDocsSentDate: string;
  gisReceivedDate: string;
  crqHoStatus: StatusValue;
  crqHoNo: string;
  crqHoErqNo: string;
  crqHoReqNo: string;
  crqHoSubmittedFilesDate: string;
  repatStatus: string;
  repatSubmittedFilesDate: string;
  repatReqNo: string;
  repatStage: string;
  repatDate: string;
}

export interface Stage5 {
  pcrStatus: StatusValue;
  pcrRef: string;
  pcrDate: string;
  sdnStatus: StatusValue;
  sdnDate: string;
  sdnRef: string;
  rfsStatus: StatusValue;
  rfsDate: string;
  rfsSubmittedFilesDate: string;
  rfsAmount: number;
  pacStatus: StatusValue;
  pacDate: string;
  pacSubmitFilesDate: string;
  pacAmount: number;
  pacCrqStatus: StatusValue;
  pacErqNo: string;
  pacCrqNo: string;
}

export interface Stage6 {
  facStatus: StatusValue;
  facDate: string;
  facSubmitFilesDate: string;
  facAmount: number;
  clearancePermit: StatusValue;
  facCrqStatus: StatusValue;
  facCrqNo: string;
  facCrqErqNo: string;
  facReqNo: string;
  finalClearanceStatus: StatusValue;
}

export interface Project {
  id: string;
  owner_id: string;
  project_name: string;
  po_number: string;
  plan_no: string;
  po_value_sar: number;
  site_id: string;
  region: string;
  city: string;
  sector: string;
  project_type: string;
  latitude: number | null;
  longitude: number | null;
  sn: string;
  status: ProjectStatus;
  stage1: Stage1;
  stage2: Stage2;
  stage3: Stage3;
  stage4: Stage4;
  stage5: Stage5;
  stage6: Stage6;
  created_at: string;
}

export interface ProjectNote {
  id: string;
  project_id: string;
  author_id: string;
  body: string;
  category: string;
  created_at: string;
}

export interface StageAttachment {
  id: string;
  project_id: string;
  stage: string;
  field: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  owner_id: string;
  email: string;
  full_name: string;
  phone: string;
  user_id: string | null;
  can_add_projects: boolean;
  can_view_all: boolean;
  can_edit_all: boolean;
  created_at: string;
}

export interface ProjectPermission {
  id: string;
  project_id: string;
  team_member_id: string;
  owner_id: string;
  scope: "project" | "stage" | "field";
  stage: string;
  field: string;
  can_edit: boolean;
  created_at: string;
}

export interface PermitRow {
  id: string;
  project_id: string;
  owner_id: string;
  sn: number;
  permit_no: string;
  issued_date: string | null;
  start_date: string | null;
  end_date: string | null;
  cw_meters: number;
  permit_status: string;
  created_at: string;
  updated_at: string;
}
