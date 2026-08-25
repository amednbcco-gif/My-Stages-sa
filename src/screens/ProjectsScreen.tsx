import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, FileSpreadsheet } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { DEMO_PROJECT } from "../lib/demoProject";
import { Button, Spinner } from "../components/ui";
import { ProjectFormModal } from "../components/ProjectFormModal";
import {
  STATUS_OPTIONS,
  PAT_STATUS_OPTIONS,
  CRQ_HO_OPTIONS,
  PATSUB_OPTIONS,
  PERMIT_OPTIONS,
  CLOSE_PERMIT_OPTIONS,
  CLEARANCE_OPTIONS,
  DONE_OPTIONS,
  EXECUTION_OPTIONS,
  REPAT_OPTIONS,
} from "../lib/stages";
import type { Project } from "../lib/types";

/* ── status colour map ─────────────────────────────────────── */
function statusColor(value: string): string {
  switch (value) {
    case "approved": return "border-emerald-500/60 text-emerald-300 bg-emerald-500/10";
    case "rectified": return "border-emerald-500/60 text-emerald-300 bg-emerald-500/10";
    case "inprogress": return "border-sky-500/60 text-sky-300 bg-sky-500/10";
    case "submitted": return "border-amber-500/60 text-amber-300 bg-amber-500/10";
    case "closed": return "border-emerald-500/60 text-emerald-300 bg-emerald-500/10";
    case "clearanced": return "border-teal-500/60 text-teal-300 bg-teal-500/10";
    case "civil_inprogress":
    case "fiber_inprogress":
    case "splicing_inprogress":
    case "patching_inprogress":
      return "border-sky-500/60 text-sky-300 bg-sky-500/10";
    default: return "border-ink-600 text-gray-500 bg-ink-900/40";
  }
}

function StatusPill({ type, value }: { type: string; value: string }) {
  if (!value || value === "pending") {
    return <span className="text-[10px] text-gray-600">—</span>;
  }
  const opts: Record<string, { value: string; label: string }[]> = {
    status: STATUS_OPTIONS,
    "pat-status": PAT_STATUS_OPTIONS,
    "crq-ho": CRQ_HO_OPTIONS,
    patsub: PATSUB_OPTIONS,
    permit: PERMIT_OPTIONS,
    "close-permit": CLOSE_PERMIT_OPTIONS,
    clearance: CLEARANCE_OPTIONS,
    done: DONE_OPTIONS,
    execution: EXECUTION_OPTIONS,
    "repat-status": REPAT_OPTIONS,
  };
  const label = (opts[type] ?? STATUS_OPTIONS).find((o) => o.value === value)?.label ?? value;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${statusColor(value)}`}>
      {label}
    </span>
  );
}

function getVal(project: Project, stage: string, key: string): string {
  const sd = (project as unknown as Record<string, Record<string, unknown>>)[stage];
  return sd ? String(sd[key] ?? "") : "";
}

function fmtNumber(val: string): string {
  const n = parseFloat(val);
  if (isNaN(n)) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/* ── columns definition ─────────────────────────────────────── */
const COLS = [
  { label: "SN" },
  { label: "Project Name" },
  { label: "City" },
  { label: "Plan No." },
  { label: "PO No." },
  { label: "DBOQ Amount" },
  { label: "ABOQ Amount" },
  { label: "Permit Status" },
  { label: "The Execution" },
  { label: "PAT Status" },
  { label: "CRQ HO Status" },
  { label: "GIS Status" },
  { label: "PCR & SDN" },
  { label: "RFS Status" },
  { label: "Re-PAT Status" },
  { label: "PAC Status" },
  { label: "FAC Status" },
  { label: "" }, // actions
];

export function ProjectsScreen() {
  const { user, profile, isGuest } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadProjects() {
    if (isGuest) {
      setProjects([DEMO_PROJECT]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from("projects").select("*")
      .order("created_at", { ascending: false });
    setProjects((data as Project[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { loadProjects(); }, [user, isGuest]);

  async function handleSave(data: Partial<Project>) {
    if (editTarget) {
      const poVal = Number(data.po_value_sar) || 0;
      const { data: cur } = await supabase.from("projects").select("*").eq("id", editTarget.id).maybeSingle();
      const stage1 = { ...((cur as Record<string, unknown> | null)?.stage1 as object ?? {}), dboqAmount: poVal };
      const stage2 = { ...((cur as Record<string, unknown> | null)?.stage2 as object ?? {}), poAmount: poVal };
      const { error } = await supabase.from("projects")
        .update({ ...data, stage1, stage2 }).eq("id", editTarget.id);
      if (!error) { setToast("Project Updated"); setEditTarget(null); loadProjects(); }
    } else {
      const poVal = Number(data.po_value_sar) || 0;
      const { data: inserted, error } = await supabase.from("projects").insert({
        owner_id: user?.id,
        project_name: data.project_name,
        po_number: data.po_number,
        plan_no: data.plan_no,
        po_value_sar: poVal,
        site_id: data.site_id,
        region: data.region,
        city: data.city,
        sector: data.sector,
        project_type: data.project_type,
        latitude: data.latitude,
        longitude: data.longitude,
        status: data.status,
        stage1: { ...(data.stage1 as object ?? {}), dboqAmount: poVal },
        stage2: { ...(data.stage2 as object ?? {}), poAmount: poVal },
        stage3: data.stage3,
        stage4: data.stage4,
        stage5: data.stage5,
        stage6: data.stage6,
      }).select().single();
      if (!error) {
        setToast("Project Added"); setShowAdd(false); loadProjects();
        if (inserted) {
          const actorName = profile?.full_name?.trim() || user?.email || "Someone";
          await supabase.from("notifications").insert({
            owner_id: (inserted as Project).owner_id,
            project_id: (inserted as Project).id,
            project_name: (inserted as Project).project_name,
            actor_id: user?.id,
            actor_name: actorName,
            message: "added a new project",
          });
        }
      }
    }
  }

  async function handleDelete(project: Project) {
    if (!confirm(`Delete ${project.project_name || project.sn}?`)) return;
    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    if (!error) { setToast("Project Deleted"); loadProjects(); }
  }

function labelOf(opts: { value: string; label: string }[], val: string): string {
  return opts.find((o) => o.value === val)?.label ?? "";
}

// Stable sequential numbering: oldest project = 1, next = 2, etc.
// Recomputed fresh every render from created_at, so deleting a project
// never leaves a gap and adding one never causes a duplicate number.
function withSequentialSn<T extends { created_at: string }>(list: T[]): (T & { displaySn: string })[] {
  return [...list]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((p, idx) => ({ ...p, displaySn: String(idx + 1).padStart(2, "0") }));
}

  async function exportCSV() {
    const projectIds = withSequentialSn(filtered).map((p) => p.id);
    let notesMap: Record<string, string> = {};
    if (projectIds.length > 0) {
      const { data: notesData } = await supabase
        .from("project_notes")
        .select("project_id,body,created_at")
        .in("project_id", projectIds)
        .order("created_at", { ascending: true });
      if (notesData) {
        for (const n of notesData as { project_id: string; body: string }[]) {
          notesMap[n.project_id] = (notesMap[n.project_id] ? notesMap[n.project_id] + " | " : "") + n.body;
        }
      }
    }

    const headers = [
      "SN", "Project Name",
      "PO No.", "PO Value SAR", "Region", "Sector (Owner)", "PLAN No.", "City", "Project Type", "Latitude", "Longitude",
      "Docs Sent", "Docs Received", "DBOQ Amount", "Survey & Design Status",
      "PO & ABOQ Status", "PO Received", "Baseline Start", "Baseline End", "ABOQ Status", "ABOQ Submitted Date", "ABOQ Approved Date", "PO Issuance Date",
      "Permits Status", "The Execution Status", "Actual Start", "Actual End", "CIVIL (m)", "MH/HH", "ODB/ODF", "Closures", "HDD (m)", "Splicing Status", "Patching Status", "Close Permit",
      "OWS/PAT Request", "PAT Req. No", "PAT Start", "PAT Stage", "PAT Status",
      "GIS Docs Sent", "GIS Received", "GIS Status",
      "CRQ HO Submitted Files Date", "CRQ HO No.", "HO REQ No.", "CRQ HO Status",
      "Re-PAT Submitted Files Date", "Re-PAT REQ No", "Re-PAT Stages", "Re-PAT Date", "Re-PAT Status",
      "PCR Ref", "PCR", "PCR Date", "SDN Status", "SDN Ref", "SDN Date",
      "RFS Submitted Files Date", "RFS Amount", "RFS Approved Date", "RFS Status",
      "PAC Due Date", "PAC Submit Files Date", "PAC CRQ No", "PAC REQ No.", "PAC Amount", "PAC Status",
      "FAC Due Date", "FAC Submit Files Date", "FAC CRQ No.", "Clearance Permit", "FAC Amount", "FAC REQ No.", "Final Clearance Status", "FAC Status",
      "Notes",
    ];

    const rows = withSequentialSn(filtered).map((p) => [
      p.displaySn,
      p.project_name,
      // Project info
      p.po_number, p.po_value_sar, p.region, p.sector, p.plan_no, p.city, p.project_type, p.latitude, p.longitude,
      // Stage 1 — Survey & Design
      getVal(p, "stage1", "sendDocsDate"),
      getVal(p, "stage1", "receiveDocsDate"),
      getVal(p, "stage1", "dboqAmount"),
      labelOf(STATUS_OPTIONS, getVal(p, "stage1", "surveyStatus")),
      // Stage 2 — PO & ABOQ
      labelOf(STATUS_OPTIONS, getVal(p, "stage2", "poReceiveStatus")),
      getVal(p, "stage2", "receiveDocsDate"),
      getVal(p, "stage2", "baselineStartDate"),
      getVal(p, "stage2", "baselineEndDate"),
      labelOf(STATUS_OPTIONS, getVal(p, "stage2", "aboqStatus")),
      getVal(p, "stage2", "aboqSubmittedDate"),
      getVal(p, "stage2", "aboqApprovedDate"),
      getVal(p, "stage2", "poIssuanceDate"),
      // Stage 3 — Execution
      labelOf(PERMIT_OPTIONS, getVal(p, "stage3", "permitsStatus")),
      labelOf(EXECUTION_OPTIONS, getVal(p, "stage3", "civilStatus")),
      getVal(p, "stage3", "actualStartDate"),
      getVal(p, "stage3", "actualEndDate"),
      getVal(p, "stage3", "civilActualMeters"),
      getVal(p, "stage3", "mhHh"),
      getVal(p, "stage3", "odbOdf"),
      getVal(p, "stage3", "closures"),
      getVal(p, "stage3", "hddActualMeters"),
      labelOf(DONE_OPTIONS, getVal(p, "stage3", "fiberSplicingStatus")),
      labelOf(DONE_OPTIONS, getVal(p, "stage3", "patchingStatus")),
      labelOf(CLOSE_PERMIT_OPTIONS, getVal(p, "stage3", "closePermit")),
      // Stage 4 — PAT, GIS, CRQ HO, Re-PAT
      getVal(p, "stage4", "owsPatRequestDate"),
      getVal(p, "stage4", "patReqNo"),
      getVal(p, "stage4", "patStartDate"),
      getVal(p, "stage4", "patStage"),
      labelOf(PAT_STATUS_OPTIONS, getVal(p, "stage4", "patStatus")),
      getVal(p, "stage4", "gisDocsSentDate"),
      getVal(p, "stage4", "gisReceivedDate"),
      labelOf(STATUS_OPTIONS, getVal(p, "stage4", "gisStatus")),
      getVal(p, "stage4", "crqHoSubmittedFilesDate"),
      getVal(p, "stage4", "crqHoNo"),
      getVal(p, "stage4", "crqHoReqNo"),
      labelOf(CRQ_HO_OPTIONS, getVal(p, "stage4", "crqHoStatus")),
      getVal(p, "stage4", "repatSubmittedFilesDate"),
      getVal(p, "stage4", "repatReqNo"),
      getVal(p, "stage4", "repatStage"),
      getVal(p, "stage4", "repatDate"),
      getVal(p, "stage4", "repatStatus"),
      // Stage 5 — PCR, SDN, RFS, PAC
      getVal(p, "stage5", "pcrRef"),
      labelOf(STATUS_OPTIONS, getVal(p, "stage5", "pcrStatus")),
      getVal(p, "stage5", "pcrDate"),
      labelOf(STATUS_OPTIONS, getVal(p, "stage5", "sdnStatus")),
      getVal(p, "stage5", "sdnRef"),
      getVal(p, "stage5", "sdnDate"),
      getVal(p, "stage5", "rfsSubmittedFilesDate"),
      getVal(p, "stage5", "rfsAmount"),
      getVal(p, "stage5", "rfsDate"),
      labelOf(STATUS_OPTIONS, getVal(p, "stage5", "rfsStatus")),
      getVal(p, "stage5", "pacDate"),
      getVal(p, "stage5", "pacSubmitFilesDate"),
      getVal(p, "stage5", "pacCrqNo"),
      getVal(p, "stage5", "pacErqNo"),
      getVal(p, "stage5", "pacAmount"),
      labelOf(PATSUB_OPTIONS, getVal(p, "stage5", "pacStatus")),
      // Stage 6 — FAC & Clearance
      getVal(p, "stage6", "facDate"),
      getVal(p, "stage6", "facSubmitFilesDate"),
      getVal(p, "stage6", "facCrqNo"),
      labelOf(CLEARANCE_OPTIONS, getVal(p, "stage6", "clearancePermit")),
      getVal(p, "stage6", "facAmount"),
      getVal(p, "stage6", "facReqNo"),
      labelOf(STATUS_OPTIONS, getVal(p, "stage6", "finalClearanceStatus")),
      labelOf(PATSUB_OPTIONS, getVal(p, "stage6", "facStatus")),
      // Notes
      notesMap[p.id] ?? "",
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `STAGES_Tracksheet_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setToast("Export complete");
  }

  const filtered = projects.filter(
    (p) =>
      p.project_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.po_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.plan_no?.toLowerCase().includes(search.toLowerCase()) ||
      p.site_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-gray-400">
            {isGuest
              ? "Guest mode — exploring a demo project. Sign up to create and manage your own projects."
              : "Engineers manage their own projects and task progress."}
          </p>
        </div>
        <div className="flex gap-2">
          {!isGuest && (
            <>
              <Button variant="secondary" onClick={exportCSV}>
                <FileSpreadsheet size={16} className="mr-1.5" /> Export CSV
              </Button>
              <Button variant="primary" onClick={() => setShowAdd(true)}>
                <Plus size={16} className="mr-1.5" /> Add Project
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, PO No., Plan No., Site ID..."
          className="w-full rounded-lg border border-ink-700 bg-ink-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-gold/50"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-ink-700 bg-ink-800 py-16 text-center">
          <p className="text-gray-400">No projects yet. Click "Add Project" to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-700 bg-ink-800">
          <table className="w-full min-w-[1560px] text-sm border-collapse">
            <thead>
              <tr className="border-b border-ink-700 text-left text-[10px] uppercase tracking-wider text-white/90">
                {COLS.map((c, i) => (
                  <th key={i} className={`px-3 py-3 font-semibold whitespace-nowrap ${i === COLS.length - 1 ? "text-right" : ""}`}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withSequentialSn(filtered).map((p) => {
                const dboq = fmtNumber(getVal(p, "stage1", "dboqAmount"));
                const aboq = fmtNumber(getVal(p, "stage2", "aboqAmount"));
                const permitStatus = getVal(p, "stage3", "permitsStatus");
                const executionStatus = getVal(p, "stage3", "civilStatus");
                const patStatus    = getVal(p, "stage4", "patStatus");
                const crqHoStatus  = getVal(p, "stage4", "crqHoStatus");
                const gisStatus    = getVal(p, "stage4", "gisStatus");
                const pcrStatus    = getVal(p, "stage5", "pcrSdnStatus");
                const rfsStatus    = getVal(p, "stage5", "rfsStatus");
                const repatStatus   = getVal(p, "stage4", "repatStatus");
                const pacStatus    = getVal(p, "stage5", "pacStatus");
                const facStatus    = getVal(p, "stage6", "facCrqStatus");

                return (
                  <tr
                    key={p.id}
                    className="border-b border-ink-700/40 hover:bg-ink-700/25 cursor-pointer transition-colors"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    {/* SN */}
                    <td className="px-3 py-3 font-mono text-xs text-gold whitespace-nowrap">{p.displaySn}</td>

                    {/* Project Name */}
                    <td className="px-3 py-3 font-medium text-white max-w-[220px]">
                      <span className="line-clamp-2 leading-snug" title={p.project_name || ""}>{p.project_name || "—"}</span>
                    </td>

                    {/* City */}
                    <td className="px-3 py-3 text-xs text-gray-300 whitespace-nowrap">{p.city || "—"}</td>

                    {/* Plan No. */}
                    <td className="px-3 py-3 text-xs text-gray-300 whitespace-nowrap">{p.plan_no || "—"}</td>

                    {/* PO No. */}
                    <td className="px-3 py-3 text-xs text-gray-300 whitespace-nowrap">{p.po_number || "—"}</td>

                    {/* DBOQ Amount */}
                    <td className="px-3 py-3 text-right font-mono text-xs text-gray-300 whitespace-nowrap">
                      {dboq !== "—" ? <span>{dboq} <span className="text-gray-600 text-[9px]">SAR</span></span> : <span className="text-gray-600">—</span>}
                    </td>

                    {/* ABOQ Amount */}
                    <td className="px-3 py-3 text-right font-mono text-xs text-gray-300 whitespace-nowrap">
                      {aboq !== "—" ? <span>{aboq} <span className="text-gray-600 text-[9px]">SAR</span></span> : <span className="text-gray-600">—</span>}
                    </td>

                    {/* Permit Status */}
                    <td className="px-3 py-3"><StatusPill type="permit" value={permitStatus} /></td>

                    {/* The Execution */}
                    <td className="px-3 py-3"><StatusPill type="execution" value={executionStatus} /></td>

                                      
                    {/* PAT Status */}
                    <td className="px-3 py-3"><StatusPill type="pat-status" value={patStatus} /></td>

                    {/* CRQ HO Status */}
                    <td className="px-3 py-3"><StatusPill type="crq-ho" value={crqHoStatus} /></td>

                    {/* GIS Status */}
                    <td className="px-3 py-3"><StatusPill type="status" value={gisStatus} /></td>

                    {/* PCR & SDN */}
                    <td className="px-3 py-3"><StatusPill type="status" value={pcrStatus} /></td>

                    {/* RFS Status */}
                    <td className="px-3 py-3"><StatusPill type="status" value={rfsStatus} /></td>

                    {/* Re-PAT Status */}
                    <td className="px-3 py-3"><StatusPill type="repat-status" value={repatStatus} /></td>

                    {/* PAC Status */}
                    <td className="px-3 py-3"><StatusPill type="patsub" value={pacStatus} /></td>

                    {/* FAC Status */}
                    <td className="px-3 py-3"><StatusPill type="patsub" value={facStatus} /></td>

                    {/* Actions */}
                    <td className="px-3 py-3 text-right">
                      {!isGuest && (
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setEditTarget(p)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-ink-700 hover:text-gold transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ProjectFormModal
        open={showAdd || editTarget !== null}
        onClose={() => { setShowAdd(false); setEditTarget(null); }}
        onSave={handleSave}
        initial={editTarget}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-300 animate-slide-in">
          {toast}
        </div>
      )}
    </div>
  );
}
