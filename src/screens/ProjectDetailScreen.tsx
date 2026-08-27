import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Pencil, Trash2, Paperclip, MapPin, DollarSign, Save,
  MessageSquare, Send, X, Check, LayoutGrid, List, Plus,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Button, Spinner, Badge } from "../components/ui";
import { ProjectFormModal } from "../components/ProjectFormModal";
import {
  STAGE_FIELDS,
  STAGE_LABELS,
  STAGE_ORDER,
  STATUS_OPTIONS,
  PATSUB_OPTIONS,
  PAT_STATUS_OPTIONS,
  CRQ_HO_OPTIONS,
  TEAM_OPTIONS,
  DONE_OPTIONS,
  EXECUTION_OPTIONS,
  CLOSE_PERMIT_OPTIONS,
  PERMIT_OPTIONS,
  CLEARANCE_OPTIONS,
  REPAT_OPTIONS,
  MILESTONES,
  computeProgress,
  addDays,
} from "../lib/stages";
import { getAbbreviation } from "../lib/demoProject";
import type { Project, ProjectNote as BaseProjectNote, StageAttachment, PermitRow } from "../lib/types";
type ProjectNote = BaseProjectNote & { author_name?: string };

/* ─── Helpers ────────────────────────────────────────────── */
function fmtDate(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("T")[0].split("-");
  if (parts.length < 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function fmtDateTime(d: string | Date): string {
  return new Date(d).toLocaleString("en-US");
}

function stageProgress(project: Project, stage: string): number {
  const fields = STAGE_FIELDS[stage].filter(
    (f) => f.type === "status" || f.type === "patsub" || f.type === "pat-status" || f.type === "crq-ho" || f.type === "close-permit" || f.type === "permit" || f.type === "clearance" || f.type === "done" || f.type === "execution"
  );
  if (!fields.length) return 0;
  const data = (project as unknown as Record<string, Record<string, unknown>>)[stage] ?? {};
  const approved = fields.filter((f) => data[f.key] === "approved" || data[f.key] === "closed").length;
  return Math.round((approved / fields.length) * 100);
}

function statusColor(val: string) {
  switch (val) {
    case "approved": return "border-emerald-500/70 text-emerald-300 bg-emerald-500/15";
    case "rectified": return "border-emerald-500/70 text-emerald-300 bg-emerald-500/15";
    case "inprogress": return "border-amber-500/70 text-amber-300 bg-amber-500/15";
    case "submitted": return "border-sky-500/70 text-sky-300 bg-sky-500/15";
    case "closed": return "border-emerald-500/70 text-emerald-300 bg-emerald-500/15";
    case "clearanced": return "border-teal-500/70 text-teal-300 bg-teal-500/15";
    case "civil_inprogress":
    case "fiber_inprogress":
    case "splicing_inprogress":
    case "patching_inprogress":
      return "border-sky-500/70 text-sky-300 bg-sky-500/15";
    default: return "border-ink-600 text-gray-400 bg-ink-900/50";
  }
}

const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`;

function optionsFor(type: string) {
  if (type === "patsub") return PATSUB_OPTIONS;
  if (type === "pat-status") return PAT_STATUS_OPTIONS;
  if (type === "crq-ho") return CRQ_HO_OPTIONS;
  if (type === "close-permit") return CLOSE_PERMIT_OPTIONS;
  if (type === "permit") return PERMIT_OPTIONS;
  if (type === "clearance") return CLEARANCE_OPTIONS;
  if (type === "done") return DONE_OPTIONS;
  if (type === "execution") return EXECUTION_OPTIONS;
  if (type === "repat-status") return REPAT_OPTIONS;
  return STATUS_OPTIONS;
}

type ViewMode = "card" | "list";

/* ─── Shared field renderer ──────────────────────────────── */
interface FieldInputProps {
  field: { key: string; label: string; type: string };
  value: unknown;
  stage: string;
  onFieldChange: (stage: string, key: string, value: string | number) => void;
  disabled?: boolean;
}
function FieldInput({ field, value, stage, onFieldChange, disabled }: FieldInputProps) {
  const isStatus = ["status","patsub","pat-status","crq-ho","close-permit","permit","clearance","done","execution","repat-status"].includes(field.type);

  if (disabled) {
    if (isStatus) {
      const val = String(value || "pending");
      const label = optionsFor(field.type).find((o) => o.value === val)?.label ?? val;
      return (
        <span className={`rounded-lg border px-2 py-1 text-xs font-semibold ${statusColor(val)}`}>{label}</span>
      );
    }
    if (field.type === "team") {
      const val = String(value || "");
      const label = TEAM_OPTIONS.find((o) => o.value === val)?.label ?? val ?? "—";
      return <span className="text-xs text-gray-300">{label || "—"}</span>;
    }
    if (field.type === "date") {
      return <span className="text-xs text-gray-300">{value ? fmtDate(String(value)) : "—"}</span>;
    }
    if (field.type === "number") {
      return <span className="text-xs text-gray-300">{fmtNum(Number(value) || 0)}</span>;
    }
    return <span className="text-xs text-gray-300">{String(value ?? "") || "—"}</span>;
  }

  if (isStatus) {
    return (
      <select
        value={String(value || "pending")}
        onChange={(e) => onFieldChange(stage, field.key, e.target.value)}
        className={`rounded-lg border px-2 py-1 text-xs font-semibold outline-none cursor-pointer transition-colors appearance-none pr-5 ${statusColor(String(value || "pending"))}`}
        style={{ backgroundImage: chevronBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 5px center" }}
      >
        {optionsFor(field.type).map((o) => (
          <option key={o.value} value={o.value} className="bg-ink-800 text-white">{o.label}</option>
        ))}
      </select>
    );
  }
  if (field.type === "team") {
    return (
      <select
        value={String(value || "")}
        onChange={(e) => onFieldChange(stage, field.key, e.target.value)}
        className="rounded-lg border border-ink-600 bg-ink-900/60 px-2 py-1 text-xs text-white outline-none cursor-pointer appearance-none pr-5 focus:border-gold/50"
        style={{ backgroundImage: chevronBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 5px center" }}
      >
        {TEAM_OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="bg-ink-800 text-white">{o.label}</option>
        ))}
      </select>
    );
  }
  if (field.type === "date") {
    return (
      <div className="flex flex-col gap-0.5">
        <input
          type="date"
          value={String(value || "")}
          onChange={(e) => onFieldChange(stage, field.key, e.target.value)}
          className="rounded-lg border border-ink-600 bg-ink-900/60 px-2 py-1 text-xs text-white outline-none focus:border-gold/50 [color-scheme:dark]"
        />
        {value ? <span className="text-[10px] text-gray-500 text-center">{fmtDate(String(value))}</span> : null}
      </div>
    );
  }
  if (field.type === "number") {
    return (
      <input
        type="number"
        value={String(value ?? 0)}
        onChange={(e) => onFieldChange(stage, field.key, Number(e.target.value) || 0)}
        className="w-24 rounded-lg border border-ink-600 bg-ink-900/60 px-2 py-1 text-right text-xs text-white outline-none focus:border-gold/50"
      />
    );
  }
  return (
    <input
      type="text"
      value={String(value ?? "")}
      onChange={(e) => onFieldChange(stage, field.key, e.target.value)}
      placeholder="—"
      className="w-28 rounded-lg border border-ink-600 bg-ink-900/60 px-2 py-1 text-xs text-white outline-none focus:border-gold/50 placeholder-gray-600"
    />
  );
}

/* ─── Stage Card (Card Layout) ───────────────────────────── */
interface StageCardProps {
  stage: string;
  project: Project;
  attachments: StageAttachment[];
  uploading: string | null;
  onFieldChange: (stage: string, key: string, value: string | number) => void;
  onUpload: (stage: string, file: File, fieldKey?: string) => void;
  onDeleteAttachment: (att: StageAttachment) => void;
  onDownloadAttachment: (att: StageAttachment) => void;
  onSaveStage: (stage: string) => void;
  canEdit: boolean;
}

// Stage 6 FAC Status now shown as first field inside the card body (before FAC Due Date)
const TOP_STATUS_FIELD: Record<string, { key: string; label: string }> = {};

function StageCard({ stage, project, attachments, uploading, onFieldChange, onUpload, onDeleteAttachment, onDownloadAttachment, onSaveStage, canEdit }: StageCardProps) {
  const fields = STAGE_FIELDS[stage];
  const stageData = (project as unknown as Record<string, Record<string, unknown>>)[stage] ?? {};
  const pct = stageProgress(project, stage);
  const isDone = pct === 100;
  const stageAtts = attachments.filter((a) => a.stage === stage);
  const isUploading = uploading === stage;
  const topStatus = TOP_STATUS_FIELD[stage];
  const topStatusVal = topStatus ? String(stageData[topStatus.key] ?? "pending") : "";

  return (
    <div className={`rounded-2xl border bg-ink-800 overflow-hidden transition-shadow ${isDone ? "border-emerald-500/30" : "border-ink-700"}`}>
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isDone ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40">
                <Check size={12} className="text-emerald-400" />
              </span>
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-700 border border-ink-600 text-xs font-bold text-gray-400">
                {STAGE_ORDER.indexOf(stage as typeof STAGE_ORDER[number]) + 1}
              </span>
            )}
            <h3 className={`text-sm font-bold ${isDone ? "text-emerald-300" : "text-white"}`}>{STAGE_LABELS[stage]}</h3>
          </div>
          <div className="flex items-center gap-2">
            {topStatus && (
              canEdit ? (
              <select
                value={topStatusVal}
                onChange={(e) => onFieldChange(stage, topStatus.key, e.target.value)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none cursor-pointer transition-colors appearance-none pr-7 ${statusColor(topStatusVal)}`}
                style={{ backgroundImage: chevronBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center" }}
              >
                {optionsFor("patsub").map((o) => (
                  <option key={o.value} value={o.value} className="bg-ink-800 text-white">{o.label}</option>
                ))}
              </select>
              ) : (
                <span className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${statusColor(topStatusVal)}`}>
                  {optionsFor("patsub").find((o) => o.value === topStatusVal)?.label ?? topStatusVal}
                </span>
              )
            )}
            <span className={`text-sm font-bold ${isDone ? "text-emerald-400" : "text-gray-400"}`}>{pct}%</span>
          </div>
        </div>
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-ink-700">
          <div className={`h-full rounded-full transition-all duration-500 ${isDone ? "bg-emerald-500" : "bg-gold"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="px-5 pb-3 space-y-0 divide-y divide-ink-700/40">
        {fields.map((field) => {
          const value = stageData[field.key] ?? "";
          return (
            <div key={field.key} className="flex items-center justify-between gap-4 py-2.5 min-h-[42px]">
              <span className="shrink-0 text-sm font-semibold text-white">{field.label}</span>
              <FieldInput field={field} value={value} stage={stage} onFieldChange={onFieldChange} disabled={!canEdit} />
            </div>
          );
        })}
      </div>

      <div className="border-t border-ink-700/50 px-5 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
            <Paperclip size={12} /> Attachments
            {stageAtts.length > 0 && (
              <span className="ml-1 rounded-full bg-ink-700 px-1.5 py-0.5 text-[10px] text-gray-300">{stageAtts.length}</span>
            )}
          </span>
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <button
                  onClick={() => onSaveStage(stage)}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:opacity-80 transition-opacity"
                >
                  <Save size={11} /> Save
                </button>
                <label className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-gold hover:opacity-80 transition-opacity">
                  <Paperclip size={11} /> Add file
                  <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(stage, f); e.target.value = ""; }} />
                </label>
              </>
            )}
          </div>
        </div>
        {isUploading && <p className="text-xs text-amber-300">Uploading…</p>}
        {stageAtts.length === 0 && !isUploading ? (
          <p className="text-xs text-gray-600">No files attached.</p>
        ) : (
          <div className="space-y-1">
            {stageAtts.map((att) => (
              <div key={att.id} className="flex items-center justify-between gap-2">
                <button onClick={() => onDownloadAttachment(att)} className="flex items-center gap-1.5 text-xs text-sky-300 hover:underline truncate">
                  <Paperclip size={10} /><span className="truncate">{att.file_name}</span>
                </button>
                {canEdit && (
                  <button onClick={() => onDeleteAttachment(att)} className="shrink-0 text-gray-600 hover:text-rose-300 transition-colors">
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Milestone cards (List Form) ─────────────────────────── */
interface MilestoneListProps {
  project: Project;
  attachments: StageAttachment[];
  uploading: string | null;
  onFieldChange: (stage: string, key: string, value: string | number) => void;
  onUpload: (stage: string, file: File, fieldKey?: string) => void;
  onDeleteAttachment: (att: StageAttachment) => void;
  onDownloadAttachment: (att: StageAttachment) => void;
  onSaveStage: (stage: string) => void;
  permits: PermitRow[];
  onPermitAdd: () => void;
  onPermitUpdate: (id: string, patch: Partial<PermitRow>) => void;
  onPermitDelete: (id: string) => void;
  canEditMilestone: (milestoneId: string) => boolean;
}

function milestoneDone(statusVal: unknown): boolean {
  return statusVal === "approved" || statusVal === "closed";
}

function PermitTable({ permits, onPermitAdd, onPermitUpdate, onPermitDelete, canEdit }: {
  permits: PermitRow[];
  onPermitAdd: () => void;
  onPermitUpdate: (id: string, patch: Partial<PermitRow>) => void;
  onPermitDelete: (id: string) => void;
  canEdit: boolean;
}) {
  const inputCls = "w-full rounded-lg border border-ink-600 bg-ink-900/60 px-2 py-1.5 text-xs text-white outline-none focus:border-gold/50 transition-colors";
  const roCls = "w-full rounded-lg border border-ink-700 bg-ink-900/40 px-2 py-1.5 text-xs text-gray-300";
  return (
    <div className="px-5 py-4">
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full min-w-[820px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-ink-600 text-gray-500">
              <th className="py-2 px-2 text-left font-semibold">SN</th>
              <th className="py-2 px-2 text-left font-semibold">Permit No</th>
              <th className="py-2 px-2 text-left font-semibold">Issued Date</th>
              <th className="py-2 px-2 text-left font-semibold">Start Date</th>
              <th className="py-2 px-2 text-left font-semibold">End Date</th>
              <th className="py-2 px-2 text-left font-semibold">CW (m)</th>
              <th className="py-2 px-2 text-left font-semibold">Permit Status</th>
              <th className="py-2 px-2 text-center font-semibold w-8"></th>
            </tr>
          </thead>
          <tbody>
            {permits.length === 0 ? (
              <tr><td colSpan={8} className="py-4 text-center text-gray-600">No permits yet.{canEdit ? " Click + to add one." : ""}</td></tr>
            ) : (
              permits.map((p) => (
                <tr key={p.id} className="border-b border-ink-700/40 hover:bg-ink-800/40 transition-colors">
                  <td className="py-1.5 px-2">
                    {canEdit ? <input type="number" className={inputCls + " w-12"} value={p.sn} onChange={(e) => onPermitUpdate(p.id, { sn: parseInt(e.target.value) || 1 })} /> : <span className={roCls + " w-12 block"}>{p.sn}</span>}
                  </td>
                  <td className="py-1.5 px-2">
                    {canEdit ? <input type="text" className={inputCls} value={p.permit_no} onChange={(e) => onPermitUpdate(p.id, { permit_no: e.target.value })} /> : <span className={roCls + " block"}>{p.permit_no || "—"}</span>}
                  </td>
                  <td className="py-1.5 px-2">
                    {canEdit ? <input type="date" className={inputCls} value={p.issued_date ?? ""} onChange={(e) => onPermitUpdate(p.id, { issued_date: e.target.value || null })} /> : <span className={roCls + " block"}>{p.issued_date ? fmtDate(p.issued_date) : "—"}</span>}
                  </td>
                  <td className="py-1.5 px-2">
                    {canEdit ? <input type="date" className={inputCls} value={p.start_date ?? ""} onChange={(e) => onPermitUpdate(p.id, { start_date: e.target.value || null })} /> : <span className={roCls + " block"}>{p.start_date ? fmtDate(p.start_date) : "—"}</span>}
                  </td>
                  <td className="py-1.5 px-2">
                    {canEdit ? <input type="date" className={inputCls} value={p.end_date ?? ""} onChange={(e) => onPermitUpdate(p.id, { end_date: e.target.value || null })} /> : <span className={roCls + " block"}>{p.end_date ? fmtDate(p.end_date) : "—"}</span>}
                  </td>
                  <td className="py-1.5 px-2">
                    {canEdit ? <input type="number" className={inputCls + " w-16"} value={p.cw_meters} onChange={(e) => onPermitUpdate(p.id, { cw_meters: parseFloat(e.target.value) || 0 })} /> : <span className={roCls + " w-16 block"}>{p.cw_meters}</span>}
                  </td>
                  <td className="py-1.5 px-2">
                    {canEdit ? (
                      <select value={p.permit_status} onChange={(e) => onPermitUpdate(p.id, { permit_status: e.target.value })} className={inputCls + " cursor-pointer"}>
                        {PERMIT_OPTIONS.map((o) => (<option key={o.value} value={o.value} className="bg-ink-800 text-white">{o.label}</option>))}
                      </select>
                    ) : (
                      <span className={`rounded-lg border px-2 py-1 text-xs font-semibold ${statusColor(p.permit_status)}`}>
                        {PERMIT_OPTIONS.find((o) => o.value === p.permit_status)?.label ?? p.permit_status}
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {canEdit && <button onClick={() => onPermitDelete(p.id)} className="text-gray-600 hover:text-rose-300 transition-colors"><Trash2 size={12} /></button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {canEdit && (
        <button onClick={onPermitAdd} className="mt-3 flex items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:border-gold/50 hover:text-gold transition-colors">
          <Plus size={12} /> Add Permit
        </button>
      )}
    </div>
  );
}

function MilestoneCard({
  milestone, project, attachments, uploading, onFieldChange, onUpload, onDeleteAttachment, onDownloadAttachment, onSaveStage,
  permits, onPermitAdd, onPermitUpdate, onPermitDelete, canEdit,
}: {
  milestone: typeof MILESTONES[number];
  project: Project;
  attachments: StageAttachment[];
  uploading: string | null;
  onFieldChange: (stage: string, key: string, value: string | number) => void;
  onUpload: (stage: string, file: File, fieldKey?: string) => void;
  onDeleteAttachment: (att: StageAttachment) => void;
  onDownloadAttachment: (att: StageAttachment) => void;
  onSaveStage: (stage: string) => void;
  permits: PermitRow[];
  onPermitAdd: () => void;
  onPermitUpdate: (id: string, patch: Partial<PermitRow>) => void;
  onPermitDelete: (id: string) => void;
  canEdit: boolean;
}) {
  const [showFiles, setShowFiles] = useState(false);
  const stageData = (project as unknown as Record<string, Record<string, unknown>>)[milestone.stage] ?? {};
  const statusVal = String(stageData[milestone.statusField.key] ?? "pending");
  const done = milestoneDone(statusVal);
  const msAtts = attachments.filter((a) => a.stage === milestone.stage && (a.field === milestone.id || a.field === "_stage"));
  const isUploading = uploading === `${milestone.stage}.${milestone.id}`;

  // count filled data fields
  const filledFields = milestone.fields.filter((f) => {
    const v = stageData[f.key];
    if (f.type === "number") return Number(v) > 0;
    return Boolean(v);
  }).length;
  const pct = milestone.fields.length > 0 ? Math.round((filledFields / milestone.fields.length) * 100) : 0;

  return (
    <div className={`rounded-2xl border bg-ink-800 overflow-hidden transition-all ${done ? "border-emerald-500/30" : "border-ink-700"}`}>
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-ink-700/50">
        {done ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 shrink-0">
            <Check size={14} className="text-emerald-400" />
          </span>
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-700 border border-ink-600 shrink-0">
            <span className="h-2 w-2 rounded-full bg-gold/60" />
          </span>
        )}
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <h3 className={`text-base font-bold leading-tight ${done ? "text-emerald-300" : "text-white"}`}>{milestone.title}</h3>
          {(() => { const full = getAbbreviation(milestone.title); return full ? <span className="text-[10px] text-gray-500 leading-tight">{full}</span> : null; })()}
        </div>

        {/* Status dropdown */}
        <div className="shrink-0">
          {canEdit ? (
          <select
            value={statusVal}
            onChange={(e) => onFieldChange(milestone.stage, milestone.statusField.key, e.target.value)}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none cursor-pointer transition-colors appearance-none pr-7 ${statusColor(statusVal)}`}
            style={{ backgroundImage: chevronBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center" }}
          >
            {optionsFor(milestone.statusType).map((o) => (
              <option key={o.value} value={o.value} className="bg-ink-800 text-white">{o.label}</option>
            ))}
          </select>
          ) : (
            <span className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${statusColor(statusVal)}`}>
              {optionsFor(milestone.statusType).find((o) => o.value === statusVal)?.label ?? statusVal}
            </span>
          )}
        </div>
      </div>

      {/* Fields grid OR permit table */}
      {milestone.id === "permit" ? (
        <PermitTable permits={permits} onPermitAdd={onPermitAdd} onPermitUpdate={onPermitUpdate} onPermitDelete={onPermitDelete} canEdit={canEdit} />
      ) : (
                       <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
          {milestone.fields.map((field) => {
            const value = stageData[field.key] ?? "";
            return (
              <div key={field.key} className="flex items-center gap-3">
                <label className="w-32 shrink-0 text-[11px] font-semibold text-white">{field.label}</label>
                <div className="flex-1 min-w-0">
                  <FieldInput field={field} value={value} stage={milestone.stage} onFieldChange={onFieldChange} disabled={!canEdit} />
                </div>
              </div>
            );
          })}
        </div>

      {/* Footer: progress + actions */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-ink-700/40 bg-ink-900/30">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-1 max-w-[120px] h-1 rounded-full bg-ink-700 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${done ? "bg-emerald-500" : "bg-gold"}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] text-gray-500 shrink-0">{filledFields}/{milestone.fields.length} filled</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {canEdit && (
          <button
            onClick={() => onSaveStage(milestone.stage)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-600/50 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:border-emerald-500/70 hover:text-emerald-200 transition-colors"
          >
            <Save size={12} /> Save
          </button>
          )}
          {/* Attachment button */}
          <button
            onClick={() => setShowFiles((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-800 px-2.5 py-1.5 text-xs font-semibold text-gray-300 hover:border-gold/50 hover:text-gold transition-colors"
          >
            <Paperclip size={12} />
            {msAtts.length > 0 && <span className="rounded-full bg-gold/20 px-1.5 text-[10px] text-gold">{msAtts.length}</span>}
          </button>
        </div>
      </div>

      {/* Attachments panel */}
      {showFiles && (
        <div className="border-t border-ink-700/40 px-5 py-3 bg-ink-900/40">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
              <Paperclip size={12} /> Attachments
              {msAtts.length > 0 && (
                <span className="ml-0.5 rounded-full bg-ink-700 px-1.5 py-0.5 text-[10px] text-gray-300">{msAtts.length}</span>
              )}
            </span>
            {canEdit && (
            <label className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-gold hover:opacity-80 transition-opacity">
              <Paperclip size={11} /> Add file
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUpload(milestone.stage, f, milestone.id);
                  e.target.value = "";
                }}
              />
            </label>
            )}
          </div>
          {isUploading && <p className="text-xs text-amber-300">Uploading…</p>}
          {msAtts.length === 0 && !isUploading ? (
            <p className="text-xs text-gray-600">No files attached.</p>
          ) : (
            <div className="space-y-1">
              {msAtts.map((att) => (
                <div key={att.id} className="flex items-center justify-between gap-2">
                  <button onClick={() => onDownloadAttachment(att)} className="flex items-center gap-1.5 text-xs text-sky-300 hover:underline truncate">
                    <Paperclip size={10} /><span className="truncate">{att.file_name}</span>
                  </button>
                  {canEdit && (
                    <button onClick={() => onDeleteAttachment(att)} className="shrink-0 text-gray-600 hover:text-rose-300 transition-colors">
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MilestoneList(props: MilestoneListProps) {
  const { canEditMilestone, ...rest } = props;
  return (
    <div className="space-y-3">
      {MILESTONES.map((m) => (
        <MilestoneCard key={m.id} milestone={m} {...rest} permits={props.permits} onPermitAdd={props.onPermitAdd} onPermitUpdate={props.onPermitUpdate} onPermitDelete={props.onPermitDelete} canEdit={canEditMilestone(m.id)} />
      ))}
    </div>
  );
}

/* ─── View Chooser ───────────────────────────────────────── */
interface ViewChooserProps {
  projectName: string;
  onChoose: (mode: ViewMode) => void;
}
function ViewChooser({ projectName, onChoose }: ViewChooserProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">Choose a view for</p>
      <h2 className="text-lg font-bold text-white mb-8 text-center">{projectName}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-md">
        {/* Card Layout */}
        <button
          onClick={() => onChoose("card")}
          className="group flex flex-col items-center gap-4 rounded-2xl border border-ink-700 bg-ink-800 px-6 py-8 hover:border-gold/50 hover:bg-ink-700/60 transition-all"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gold/10 border border-gold/20 group-hover:bg-gold/20 transition-colors">
            <LayoutGrid size={28} className="text-gold" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-white mb-1">Card Layout</p>
            <p className="text-xs text-gray-500 leading-relaxed">Stage cards arranged in a responsive grid, two per row, it works as a dashboard for important information, Collected and distributed in stages. Attachments sync with List Form automatically.</p>
          </div>
        </button>

        {/* List Form */}
        <button
          onClick={() => onChoose("list")}
          className="group flex flex-col items-center gap-4 rounded-2xl border border-ink-700 bg-ink-800 px-6 py-8 hover:border-sky-500/50 hover:bg-ink-700/60 transition-all"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 group-hover:bg-sky-500/20 transition-colors">
            <List size={28} className="text-sky-400" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-white mb-1">List Form</p>
            <p className="text-xs text-gray-500 leading-relaxed">All stages listed vertically — click any row to expand its fields, also it's filled with more information, To act as the primary interface, Filled the field here is automatically reflected in Card Layout, Attachments sync with Card Layout automatically</p>
          </div>
        </button>
      </div>
    </div>
  );
}

/* ─── Main Screen ────────────────────────────────────────── */
export function ProjectDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [attachments, setAttachments] = useState<StageAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [noteCategory, setNoteCategory] = useState("general");
  const [toast, setToast] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode | null>(null);
  const [permits, setPermits] = useState<PermitRow[]>([]);
  const [canEditAll, setCanEditAll] = useState(false);
  const [editableMilestoneIds, setEditableMilestoneIds] = useState<string[]>([]);
  const [, setPermsLoaded] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      supabase.from("projects").select("*").eq("id", id).maybeSingle(),
      supabase.from("project_notes").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("stage_attachments").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("project_permits").select("*").eq("project_id", id).order("sn", { ascending: true }),
    ]).then(([{ data: proj }, { data: notesData }, { data: attachData }, { data: permitsData }]) => {
      setProject(proj as Project | null);
      setNotes(notesData as ProjectNote[] ?? []);
      setAttachments(attachData as StageAttachment[] ?? []);
      setPermits(permitsData as PermitRow[] ?? []);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!project || !user) return;

    const isOwner = project.owner_id === user.id;
    if (isOwner) {
      setCanEditAll(true);
      setEditableMilestoneIds([]);
      setPermsLoaded(true);
      return;
    }

    setPermsLoaded(false);
    supabase
      .from("team_members")
      .select("id, can_edit_all")
      .eq("user_id", user.id)
      .eq("owner_id", project.owner_id)
      .maybeSingle()
      .then(({ data: tm }) => {
        if (!tm) {
          setCanEditAll(false);
          setEditableMilestoneIds([]);
          setPermsLoaded(true);
          return;
        }
        if (tm.can_edit_all) {
          setCanEditAll(true);
          setEditableMilestoneIds([]);
          setPermsLoaded(true);
          return;
        }
        setCanEditAll(false);
        supabase
          .from("project_permissions")
          .select("field")
          .eq("project_id", project.id)
          .eq("team_member_id", tm.id)
          .eq("scope", "field")
          .eq("can_edit", true)
          .then(({ data: perms }) => {
            setEditableMilestoneIds((perms ?? []).map((p) => p.field));
            setPermsLoaded(true);
          });
      });
  }, [project?.id, project?.owner_id, user?.id]);

  function canEditMilestone(milestoneId: string): boolean {
    if (canEditAll) return true;
    return editableMilestoneIds.includes(milestoneId);
  }

  function canEditStage(stage: string): boolean {
    if (canEditAll) return true;
    return MILESTONES.some((m) => m.stage === stage && editableMilestoneIds.includes(m.id));
  }

  async function handleSaveProject(data: Partial<Project>) {
    if (!project) return;
    const { error } = await supabase.from("projects").update(data).eq("id", project.id);
    if (!error) {
      setEditOpen(false);
      setProject((prev) => prev ? { ...prev, ...data } as Project : prev);
      showToast("Project updated");
    }
  }

  async function handleDeleteProject() {
    if (!project) return;
    if (!confirm(`Delete project "${project.project_name || project.sn}"? This cannot be undone.`)) return;
    await supabase.from("project_notes").delete().eq("project_id", project.id);
    await supabase.from("stage_attachments").delete().eq("project_id", project.id);
    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    if (!error) navigate("/projects");
  }

  async function updateStageField(stage: string, key: string, value: string | number) {
    if (!project) return;
    const stageData = (project as unknown as Record<string, Record<string, unknown>>)[stage] ?? {};
    const linked: Record<string, string | number> = { [key]: value };
    if (key === "pacCrqStatus") linked.pacStatus = value;
    else if (key === "pacStatus") linked.pacCrqStatus = value;
    else if (key === "facCrqStatus") linked.facStatus = value;
    else if (key === "facStatus") linked.facCrqStatus = value;
    const updated = { ...stageData, ...linked };
    const updateObj: Record<string, unknown> = { [stage]: updated };

    if (key === "rfsDate" && value) {
      const pacDate = addDays(String(value), 90);
      const facDate = addDays(String(value), 360);
      updated.pacDate = pacDate;
      const stage6Data = (project as unknown as Record<string, Record<string, unknown>>)["stage6"] ?? {};
      updateObj.stage6 = { ...stage6Data, facDate };
    }

    if (key === "aboqAmount" && stage === "stage2") {
      const aboqVal = Number(value) || 0;
      const rfsAmt = Math.round(aboqVal * 0.8 * 100) / 100;
      const pacAmt = Math.round(aboqVal * 0.1 * 100) / 100;
      const facAmt = Math.round(aboqVal * 0.1 * 100) / 100;
      const stage5Data = (project as unknown as Record<string, Record<string, unknown>>)["stage5"] ?? {};
      updateObj.stage5 = { ...stage5Data, rfsAmount: rfsAmt, pacAmount: pacAmt };
      const stage6Data = (project as unknown as Record<string, Record<string, unknown>>)["stage6"] ?? {};
      updateObj.stage6 = { ...(updateObj.stage6 as Record<string, unknown> ?? stage6Data), facAmount: facAmt };
    }

    if (key === "poAmount" && stage === "stage2") {
      const stage1Data = (project as unknown as Record<string, Record<string, unknown>>)["stage1"] ?? {};
      updateObj.stage1 = { ...stage1Data, dboqAmount: Number(value) || 0 };
    }

    // Optimistic local update so controlled inputs reflect changes immediately
    setProject((prev) => prev ? { ...prev, ...updateObj } as Project : prev);

    const { error } = await supabase.from("projects").update(updateObj).eq("id", project.id);
    if (error) {
      showToast("Save failed");
    }
  }

  async function notifyChange(message: string) {
    if (!project || !user) return;
    const actorName = profile?.full_name?.trim() || user.email || "Someone";
    await supabase.from("notifications").insert({
      owner_id: project.owner_id,
      project_id: project.id,
      project_name: project.project_name,
      actor_id: user.id,
      actor_name: actorName,
      message,
    });
  }

  async function saveStage(stage: string) {
    if (!project) return;
    const stageData = (project as unknown as Record<string, Record<string, unknown>>)[stage] ?? {};
    const { error } = await supabase.from("projects").update({ [stage]: stageData }).eq("id", project.id);
    if (!error) {
      showToast("Saved");
      notifyChange(`updated ${STAGE_LABELS[stage] ?? stage}`);
    }
    else showToast("Save failed");
  }

  async function addNote() {
    if (!project || !noteBody.trim()) return;
    const authorName = profile?.full_name?.trim() || user?.email || "Unknown";
    const { data, error } = await supabase
      .from("project_notes")
      .insert({ project_id: project.id, author_id: user?.id, author_name: authorName, body: noteBody, category: noteCategory })
      .select()
      .single();
    if (!error && data) {
      setNotes((prev) => [data as ProjectNote, ...prev]);
      setNoteBody("");
      showToast("Note added");
      notifyChange("added a note");
    }
  }

  async function deleteNote(noteId: string) {
    const { error } = await supabase.from("project_notes").delete().eq("id", noteId);
    if (!error) setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  const MAX_PROJECT_ATTACHMENTS_BYTES = 15 * 1024 * 1024; // 15 MB total per project

  async function handleUpload(stage: string, file: File, fieldKey = "_stage") {
    if (!project) return;

    const currentTotal = attachments.reduce((sum, a) => sum + (a.file_size || 0), 0);
    if (currentTotal + file.size > MAX_PROJECT_ATTACHMENTS_BYTES) {
      const usedMB = (currentTotal / (1024 * 1024)).toFixed(1);
      showToast(`Attachment limit reached (15MB per project). Used: ${usedMB}MB — delete a file first.`);
      return;
    }

    setUploading(`${stage}.${fieldKey}`);
    const filePath = `${project.id}/${stage}/${fieldKey}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from("stage-attachments").upload(filePath, file);
    if (upErr) { showToast("Upload failed"); setUploading(null); return; }
    const { data, error } = await supabase
      .from("stage_attachments")
      .insert({ project_id: project.id, stage, field: fieldKey, file_path: filePath, file_name: file.name, file_type: file.type, file_size: file.size, uploaded_by: user?.id })
      .select()
      .single();
    if (!error && data) {
      setAttachments((prev) => [data as StageAttachment, ...prev]);
      showToast("File uploaded");
    }
    setUploading(null);
  }

  async function deleteAttachment(att: StageAttachment) {
    await supabase.storage.from("stage-attachments").remove([att.file_path]);
    const { error } = await supabase.from("stage_attachments").delete().eq("id", att.id);
    if (!error) setAttachments((prev) => prev.filter((a) => a.id !== att.id));
  }

  async function downloadAttachment(att: StageAttachment) {
    const { data } = await supabase.storage.from("stage-attachments").createSignedUrl(att.file_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function addPermit() {
    if (!project) return;
    const nextSn = permits.length > 0 ? Math.max(...permits.map((p) => p.sn)) + 1 : 1;
    const { data, error } = await supabase
      .from("project_permits")
      .insert({ project_id: project.id, owner_id: project.owner_id, sn: nextSn, permit_no: "", permit_status: "pending" })
      .select()
      .single();
    if (!error && data) setPermits((prev) => [...prev, data as PermitRow]);
  }

  async function updatePermit(permitId: string, patch: Partial<PermitRow>) {
    setPermits((prev) => prev.map((p) => (p.id === permitId ? { ...p, ...patch } : p)));
    await supabase.from("project_permits").update(patch).eq("id", permitId);
  }

  async function deletePermit(permitId: string) {
    const { error } = await supabase.from("project_permits").delete().eq("id", permitId);
    if (!error) setPermits((prev) => prev.filter((p) => p.id !== permitId));
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400">Project not found.</p>
        <Button variant="secondary" onClick={() => navigate("/projects")} className="mt-4">Back</Button>
      </div>
    );
  }

  const progress = computeProgress(project);

  const sharedProps = {
    project,
    attachments,
    uploading,
    onFieldChange: updateStageField,
    onUpload: handleUpload,
    onDeleteAttachment: deleteAttachment,
    onDownloadAttachment: downloadAttachment,
    onSaveStage: saveStage,
    permits,
    onPermitAdd: addPermit,
    onPermitUpdate: updatePermit,
    onPermitDelete: deletePermit,
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Top bar */}
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => viewMode ? setViewMode(null) : navigate("/projects")}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> {viewMode ? "Change View" : "Back"}
        </button>
        <div className="flex items-center gap-2">
          {viewMode && (
            <div className="flex items-center rounded-lg border border-ink-700 bg-ink-800 p-0.5 gap-0.5">
              <button
                onClick={() => setViewMode("card")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${viewMode === "card" ? "bg-gold text-ink-950" : "text-gray-400 hover:text-white"}`}
              >
                <LayoutGrid size={13} /> Card
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${viewMode === "list" ? "bg-sky-500 text-white" : "text-gray-400 hover:text-white"}`}
              >
                <List size={13} /> List
              </button>
            </div>
          )}
          {canEditAll && (
            <>
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Pencil size={14} className="mr-1.5" /> Edit
              </Button>
              <Button variant="danger" onClick={handleDeleteProject}>
                <Trash2 size={14} className="mr-1.5" /> Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Project header */}
      <div className="mb-6 rounded-2xl border border-ink-700 bg-ink-800 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gold">{project.sn}</span>
              <span className="text-xs text-ink-600">·</span>
              <h1 className="text-lg md:text-xl font-bold text-white truncate">{project.project_name || "—"}</h1>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><MapPin size={11} /> {project.site_id || "No site"}</span>
              <span className="flex items-center gap-1.5"><DollarSign size={11} /> SAR {fmtNum(Number(project.po_value_sar || 0))}</span>
              {project.po_number && <span>PO: {project.po_number}</span>}
              {project.region && <span>{project.region}</span>}
              {project.city && <span>{project.city}</span>}
              {project.sector && <span>{project.sector}</span>}
              {project.project_type && <span>{project.project_type}</span>}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <Badge color={
              project.status === "Completed" ? "emerald" :
              project.status === "In Progress" ? "sky" :
              project.status === "New" ? "gray" : "amber"
            }>
              {project.status}
            </Badge>
            <p className="mt-1.5 text-3xl font-extrabold text-gold leading-none">{progress}%</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Overall Progress</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
          <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* View Chooser or Stage Content */}
      {!viewMode ? (
        <ViewChooser
          projectName={project.project_name || project.sn}
          onChoose={setViewMode}
        />
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STAGE_ORDER.map((stage) => (
            <StageCard key={stage} stage={stage} {...sharedProps} canEdit={canEditStage(stage)} />
          ))}
        </div>
      ) : (
        <MilestoneList {...sharedProps} canEditMilestone={canEditMilestone} />
      )}

      {/* Notes */}
      {viewMode && (
        <div className="mt-6 rounded-2xl border border-ink-700 bg-ink-800 px-5 py-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={16} className="text-gold" />
            <span className="text-sm font-bold text-white">Notes</span>
            {notes.length > 0 && (
              <span className="rounded-full bg-ink-700 px-2 py-0.5 text-xs text-gray-400">{notes.length}</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <select
              value={noteCategory}
              onChange={(e) => setNoteCategory(e.target.value)}
              className="shrink-0 rounded-lg border border-ink-600 bg-ink-900/70 px-3 py-2.5 text-sm text-white outline-none cursor-pointer appearance-none pr-7 focus:border-gold/50"
              style={{ backgroundImage: chevronBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
            >
              <option value="general">General</option>
              <option value="billing">Billing</option>
              <option value="field">Field</option>
              <option value="risk">Risk</option>
            </select>
            <div className="flex flex-1 gap-2">
              <input
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && noteBody.trim()) addNote(); }}
                placeholder="Write a note…"
                className="flex-1 rounded-lg border border-ink-600 bg-ink-900/70 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold/50"
              />
              <button
                onClick={addNote}
                disabled={!noteBody.trim()}
                className="shrink-0 flex items-center rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-ink-950 disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                <Send size={14} />
              </button>
            </div>
          </div>

          {notes.length === 0 ? (
            <p className="text-xs text-gray-600">No notes yet.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {notes.map((note) => (
                <div key={note.id} className="flex items-start justify-between gap-3 rounded-xl border border-ink-700/50 bg-ink-900/40 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                        note.category === "risk" ? "bg-rose-500/15 text-rose-300" :
                        note.category === "billing" ? "bg-amber-500/15 text-amber-300" :
                        note.category === "field" ? "bg-sky-500/15 text-sky-300" :
                        "bg-ink-700 text-gray-400"
                      }`}>{note.category ?? "general"}</span>
                      <span className="text-[11px] font-semibold text-gold">{note.author_name ?? "Unknown"}</span>
                      <span className="text-[10px] text-gray-600">{fmtDateTime(note.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed break-words">{note.body}</p>
                  </div>
                  <button onClick={() => deleteNote(note.id)} className="shrink-0 mt-0.5 text-gray-600 hover:text-rose-300 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ProjectFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveProject}
        initial={project}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-300 animate-slide-in">
          {toast}
        </div>
      )}
    </div>
  );
}
