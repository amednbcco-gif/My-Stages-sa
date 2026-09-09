import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, X, FileSpreadsheet, Save as SaveIcon, Pencil, GanttChartSquare } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Spinner, Button } from "../components/ui";
import type { PipColumn, PipRow, PipCell, Project } from "../lib/types";

const DEFAULT_COLUMNS = [
  "SN.",
  "Work Stages/Tasks /Type",
  "Scope",
  "Upload/Submit/Receive/Request /Apply/Start Date",
  "Recieve/ Delivery /Issuance/Clear/End Date",
  "Days",
  "Work days",
  "Done %",
];

const DEFAULT_TASKS = [
  "Design Documents (Documentation)",
  "Permits (Municipality/MOT/Access)",
  "Materials (Preparation &Transportation/Shipping)",
  "Execution (Civil Works (Trenching, Ducting, cabling, milling&paving)",
  "Integration/Splicing (TCN/MDT rack/ODB,ODF installation, Patching)",
  "PAT (C-PAT, E-PAT)",
  "CRQ HO (Documentation)",
  "GIS Certificate",
  "PCR",
  "SDN",
  "RFS",
  "PAC",
  "FAC",
];

function fmtDate(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("T")[0].split("-");
  if (parts.length < 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function daysBetween(start: string, end: string): number | null {
  if (!start || !end) return null;
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
  return Math.round((e.getTime() - s.getTime()) / 86400000);
}

export function PipScreen() {
  const { id } = useParams<{ id: string }>();
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const [columns, setColumns] = useState<PipColumn[]>([]);
  const [rows, setRows] = useState<PipRow[]>([]);
  const [cells, setCells] = useState<PipCell[]>([]);
  const [editingHeader, setEditingHeader] = useState<string | null>(null);
  const [headerDraft, setHeaderDraft] = useState("");
  const [mode, setMode] = useState<"view" | "edit">("view");

  const cellValue = useCallback(
    (rowId: string, columnId: string) => cells.find((c) => c.row_id === rowId && c.column_id === columnId)?.value ?? "",
    [cells]
  );

  function isSnCol(col: PipColumn) { return col.label.trim().toUpperCase() === "SN."; }
  function isTaskCol(col: PipColumn) { return col.label.trim().toLowerCase().startsWith("work stages"); }
  function isStartCol(col: PipColumn) { return col.label.trim().toLowerCase().includes("start date"); }
  function isEndCol(col: PipColumn) { return col.label.trim().toLowerCase().includes("end date"); }
  function isDaysCol(col: PipColumn) { return col.label.trim().toLowerCase() === "days"; }
  function isNarrowCol(col: PipColumn) {
    const l = col.label.trim().toLowerCase();
    return isSnCol(col) || l === "days" || l === "work days" || l === "done %" || l === "scope";
  }

  async function loadAll() {
    if (!id) { setLoading(false); return; }

    if (isGuest) {
      const demoCols: PipColumn[] = DEFAULT_COLUMNS.map((label, i) => ({
        id: `demo-col-${i}`, project_id: id, label, position: i, fixed: true, created_at: new Date().toISOString(),
      }));
      setColumns(demoCols);
      setRows([]);
      setCells([]);
      setCanEdit(false);
      setMode("view");
      setLoading(false);
      return;
    }

    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: proj } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
      if (!proj) { setAccessDenied(true); setLoading(false); return; }
      setProject(proj as Project);

      const p = proj as Project;
      let allowed = p.owner_id === user.id;
      if (!allowed) {
        const { data: tm } = await supabase
          .from("team_members")
          .select("id, can_edit_all")
          .eq("user_id", user.id)
          .eq("owner_id", p.owner_id)
          .maybeSingle();
        if (tm?.can_edit_all) {
          allowed = true;
        } else if (tm) {
          const { data: perm } = await supabase
            .from("project_permissions")
            .select("id")
            .eq("project_id", p.id)
            .eq("team_member_id", tm.id)
            .eq("scope", "field")
            .eq("field", "pip")
            .maybeSingle();
          allowed = !!perm;
        }
      }
      setCanEdit(allowed);
      if (!allowed) { setAccessDenied(true); setLoading(false); return; }

           let { data: colsData } = await supabase
        .from("project_pip_columns").select("*").eq("project_id", id).order("position", { ascending: true });

      if (!colsData || colsData.length < DEFAULT_COLUMNS.length) {
        const seeded = await Promise.all(
          DEFAULT_COLUMNS.map((label, i) =>
            supabase.from("project_pip_columns").insert({ project_id: id, label, position: i, fixed: true }).select().single()
          )
        );
        colsData = seeded.map((r) => r.data).filter(Boolean) as typeof colsData;
      }
      setColumns((colsData as PipColumn[]) ?? []);

           let { data: rowsData } = await supabase
        .from("project_pip_rows").select("*").eq("project_id", id).order("position", { ascending: true });

      if (!rowsData || rowsData.length < DEFAULT_TASKS.length) {
        const taskRows = await Promise.all(
          DEFAULT_TASKS.map((_, i) =>
            supabase.from("project_pip_rows").insert({ project_id: id, position: i, is_total: false, fixed: false }).select().single()
          )
        );
        const totalRow = await supabase.from("project_pip_rows").insert({ project_id: id, position: DEFAULT_TASKS.length, is_total: true, fixed: true }).select().single();
        rowsData = [...taskRows.map((r) => r.data), totalRow.data].filter(Boolean) as typeof rowsData;

        const taskCol = (colsData as PipColumn[]).find(isTaskCol);
        const snCol = (colsData as PipColumn[]).find(isSnCol);
        if (taskCol && snCol) {
          const seedCells = (rowsData as PipRow[]).flatMap((row, idx) => {
            if (row.is_total) {
              return [{ row_id: row.id, column_id: taskCol.id, value: "Total PIP Days" }];
            }
            return [
              { row_id: row.id, column_id: snCol.id, value: String(idx + 1) },
              { row_id: row.id, column_id: taskCol.id, value: DEFAULT_TASKS[idx] ?? "" },
            ];
          });
          if (seedCells.length > 0) await supabase.from("project_pip_cells").insert(seedCells);
        }
      }
      setRows((rowsData as PipRow[]) ?? []);

      const rowIds = ((rowsData as PipRow[]) ?? []).map((r) => r.id);
      if (rowIds.length > 0) {
        const { data: cellsData } = await supabase.from("project_pip_cells").select("*").in("row_id", rowIds);
        setCells((cellsData as PipCell[]) ?? []);
      } else {
        setCells([]);
      }
      setMode("view");
    } catch (err) {
      console.error("PipScreen loadAll crashed:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [id, user?.id, isGuest]);

  const startCol = columns.find(isStartCol);
  const endCol = columns.find(isEndCol);
  const daysCol = columns.find(isDaysCol);
  const taskRows = rows.filter((r) => !r.is_total).sort((a, b) => a.position - b.position);
  const totalRow = rows.find((r) => r.is_total);

  function rowDays(row: PipRow): number | null {
    if (!startCol || !endCol) return null;
    return daysBetween(cellValue(row.id, startCol.id), cellValue(row.id, endCol.id));
  }

  const totalDays = taskRows.reduce((sum, row) => sum + (rowDays(row) ?? 0), 0);

  // Gantt range
  const allDates = taskRows.flatMap((row) => {
    if (!startCol || !endCol) return [];
    return [cellValue(row.id, startCol.id), cellValue(row.id, endCol.id)].filter(Boolean);
  }).map((d) => new Date(d + "T00:00:00").getTime()).filter((t) => !isNaN(t));
  const minDate = allDates.length > 0 ? Math.min(...allDates) : null;
  const maxDate = allDates.length > 0 ? Math.max(...allDates) : null;
  const rangeDays = minDate !== null && maxDate !== null ? Math.max((maxDate - minDate) / 86400000, 1) : 1;

  async function addColumn() {
    if (!id || !canEdit) return;
    const label = prompt("اسم العمود الجديد:");
    if (!label || !label.trim()) return;
    const nextPos = columns.length > 0 ? Math.max(...columns.map((c) => c.position)) + 1 : 0;
    const { data, error } = await supabase
      .from("project_pip_columns").insert({ project_id: id, label: label.trim(), position: nextPos, fixed: false }).select().single();
    if (!error && data) setColumns((prev) => [...prev, data as PipColumn]);
  }

  async function renameColumn(col: PipColumn) {
    const label = headerDraft.trim();
    setEditingHeader(null);
    if (!label || label === col.label || col.fixed) return;
    await supabase.from("project_pip_columns").update({ label }).eq("id", col.id);
    setColumns((prev) => prev.map((c) => (c.id === col.id ? { ...c, label } : c)));
  }

  async function deleteColumn(col: PipColumn) {
    if (col.fixed) return;
    if (!confirm(`Delete column "${col.label}"?`)) return;
    await supabase.from("project_pip_columns").delete().eq("id", col.id);
    setColumns((prev) => prev.filter((c) => c.id !== col.id));
    setCells((prev) => prev.filter((c) => c.column_id !== col.id));
  }

  async function addRow() {
    if (!id || !canEdit) return;
    const insertPos = totalRow ? totalRow.position : rows.length;
    const { data: newRow, error } = await supabase
      .from("project_pip_rows").insert({ project_id: id, position: insertPos, is_total: false, fixed: false }).select().single();
    if (error || !newRow) return;
    if (totalRow) await supabase.from("project_pip_rows").update({ position: insertPos + 1 }).eq("id", totalRow.id);
    await loadAll();
  }

  async function deleteRow(row: PipRow) {
    if (row.fixed || row.is_total) return;
    if (!confirm("Delete this row?")) return;
    await supabase.from("project_pip_rows").delete().eq("id", row.id);
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    setCells((prev) => prev.filter((c) => c.row_id !== row.id));
  }

  function updateCellLocal(rowId: string, columnId: string, value: string) {
    setCells((prev) => {
      const exists = prev.find((c) => c.row_id === rowId && c.column_id === columnId);
      if (exists) return prev.map((c) => (c.row_id === rowId && c.column_id === columnId ? { ...c, value } : c));
      return [...prev, { id: `temp-${rowId}-${columnId}`, row_id: rowId, column_id: columnId, value, updated_at: new Date().toISOString() }];
    });
  }

  function enterEditMode() {
    if (isGuest || !canEdit) return;
    setMode("edit");
  }

  async function saveAll() {
    if (isGuest || !canEdit) { setMode("view"); return; }
    const payload = rows.flatMap((row) =>
      columns.map((col) => {
        let val = cellValue(row.id, col.id);
        if (daysCol && col.id === daysCol.id && !row.is_total) {
          const d = rowDays(row);
          val = d !== null ? String(d) : "";
        }
        return { row_id: row.id, column_id: col.id, value: val };
      })
    );
    if (totalRow && daysCol) {
      payload.push({ row_id: totalRow.id, column_id: daysCol.id, value: String(totalDays) });
    }
    if (payload.length > 0) {
      const { error } = await supabase.from("project_pip_cells").upsert(payload, { onConflict: "row_id,column_id" });
      if (error) console.error("saveAll upsert error:", error);
    }
    setMode("view");
  }

  function exportCSV() {
    const headers = columns.map((c) => c.label);
    const dataRows = rows.filter((r) => !r.is_total).map((row) =>
      columns.map((col) => (daysCol && col.id === daysCol.id ? String(rowDays(row) ?? "") : cellValue(row.id, col.id)))
    );
    const totalRowCsv = columns.map((col) =>
      isTaskCol(col) ? "Total PIP Days" : daysCol && col.id === daysCol.id ? String(totalDays) : ""
    );
    const csv = [headers, ...dataRows, totalRowCsv]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PIP_${project?.project_name || "project"}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  if (accessDenied) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400">You don't have access to this page.</p>
        <Button variant="secondary" onClick={() => navigate(-1)} className="mt-4">Back</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-6 flex items-center gap-2">
        <GanttChartSquare size={18} className="text-gold" />
        <h1 className="text-2xl font-bold text-white">PIP (Project Implementation Plan)</h1>
      </div>

      {project && (
        <div className="mb-6 rounded-2xl border border-ink-700 bg-ink-800 px-5 py-4">
          <h2 className="text-lg font-bold text-white">{project.project_name || "—"}</h2>
        </div>
      )}

      <div className="mb-2 flex justify-end">
        <Button variant="secondary" onClick={exportCSV}>
          <FileSpreadsheet size={16} className="mr-1.5" /> Export CSV
        </Button>
      </div>

      <div className="overflow-auto rounded-xl border border-ink-700 bg-ink-800" style={{ maxHeight: "60vh" }}>
        <table className="w-full min-w-[900px] text-sm border-collapse table-fixed">
          <thead>
            <tr className="sticky top-0 z-10 border-b border-ink-700 bg-ink-800 text-left text-[10px] uppercase tracking-wider text-white/90">
              {columns.map((col) => (
                <th key={col.id} className={`px-3 py-3 font-semibold whitespace-nowrap ${isSnCol(col) ? "w-16" : isTaskCol(col) ? "w-64" : isNarrowCol(col) ? "w-24" : "w-40"}`}>
                  {editingHeader === col.id ? (
                    <input
                      autoFocus
                      value={headerDraft}
                      onChange={(e) => setHeaderDraft(e.target.value)}
                      onBlur={() => renameColumn(col)}
                      onKeyDown={(e) => { if (e.key === "Enter") renameColumn(col); }}
                      className="w-full rounded border border-gold/50 bg-ink-900 px-1.5 py-1 text-xs text-white outline-none"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { if (canEdit && !isGuest && !col.fixed) { setEditingHeader(col.id); setHeaderDraft(col.label); } }}
                        className="hover:text-gold transition-colors truncate"
                        title={col.fixed ? col.label : "Rename column"}
                      >
                        {col.label}
                      </button>
                      {canEdit && !isGuest && !col.fixed && (
                        <button onClick={() => deleteColumn(col)} className="shrink-0 text-gray-600 hover:text-rose-300 transition-colors" title="Delete column">
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  )}
                </th>
              ))}
              <th className="px-3 py-3 font-semibold text-right w-10"></th>
            </tr>
          </thead>
          <tbody>
            {taskRows.map((row) => {
              const d = rowDays(row);
              return (
                <tr key={row.id} className="border-b border-ink-700/40 hover:bg-ink-700/25 transition-colors align-top">
                  {columns.map((col) => {
                    const isDays = daysCol && col.id === daysCol.id;
                    const value = isDays ? (d !== null ? String(d) : "") : cellValue(row.id, col.id);
                    const narrow = isNarrowCol(col);

                    if (isDays) {
                      return (
                        <td key={col.id} className="px-3 py-2 align-top">
                          <div className="w-16 rounded-lg border border-ink-700 bg-ink-900/30 px-2 py-1.5 text-xs text-gray-300">
                            {value || "—"}
                          </div>
                        </td>
                      );
                    }

                    if (mode === "view" || isGuest || !canEdit) {
                      return (
                        <td key={col.id} onClick={enterEditMode} className={`px-3 py-2 align-top ${canEdit && !isGuest ? "cursor-text hover:bg-ink-700/30" : ""}`}>
                          <p className={`text-xs text-gray-300 break-words ${narrow ? "text-center" : ""}`}>{value || "—"}</p>
                        </td>
                      );
                    }

                    if (isStartCol(col) || isEndCol(col)) {
                      return (
                        <td key={col.id} className="px-3 py-2 align-top">
                          <input type="date" value={value} onChange={(e) => updateCellLocal(row.id, col.id, e.target.value)}
                            className="w-full rounded-lg border border-ink-700 bg-ink-900/50 px-2 py-1.5 text-xs text-white outline-none focus:border-gold/50 [color-scheme:dark]" />
                        </td>
                      );
                    }

                    return (
                      <td key={col.id} className={`px-3 py-2 align-top ${narrow ? "w-24" : ""}`}>
                        <input value={value} onChange={(e) => updateCellLocal(row.id, col.id, e.target.value)} placeholder="—"
                          className={`rounded-lg border border-ink-700 bg-ink-900/50 px-2 py-1.5 text-xs text-white outline-none focus:border-gold/50 placeholder-gray-600 ${narrow ? "w-24 text-center" : "w-full"}`} />
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right align-top">
                    {canEdit && !isGuest && mode === "edit" && !row.fixed && (
                      <button onClick={() => deleteRow(row)} className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="sticky bottom-0 z-10 bg-ink-900 font-bold text-white">
              {columns.map((col, i) => (
                <td key={col.id} className="px-3 py-2.5 text-xs">
                  {isTaskCol(col) ? "Total PIP Days" : daysCol && col.id === daysCol.id ? String(totalDays) : ""}
                </td>
              ))}
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {canEdit && !isGuest && (
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" onClick={addColumn}>
            <Plus size={16} className="mr-1.5" /> Add Column
          </Button>
          <Button variant="primary" onClick={addRow}>
            <Plus size={16} className="mr-1.5" /> Add Row
          </Button>
        </div>
      )}

      {/* Gantt chart */}
      <div className="mt-8 rounded-xl border border-ink-700 bg-ink-800 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Gantt Chart</h3>
        {minDate === null || maxDate === null ? (
          <p className="text-xs text-gray-500">Add Start/End dates to tasks to see the Gantt chart.</p>
        ) : (
          <div className="space-y-2">
            {taskRows.map((row) => {
              const taskCol = columns.find(isTaskCol);
              const startVal = startCol ? cellValue(row.id, startCol.id) : "";
              const endVal = endCol ? cellValue(row.id, endCol.id) : "";
              const doneCol = columns.find((c) => c.label.trim().toLowerCase() === "done %");
              const donePct = doneCol ? Number(cellValue(row.id, doneCol.id)) || 0 : 0;
              if (!startVal || !endVal) return null;
              const s = new Date(startVal + "T00:00:00").getTime();
              const e = new Date(endVal + "T00:00:00").getTime();
              const leftPct = ((s - minDate) / (rangeDays * 86400000)) * 100;
              const widthPct = Math.max(((e - s) / (rangeDays * 86400000)) * 100, 1.5);
              return (
                <div key={row.id} className="flex items-center gap-3">
                  <span className="w-48 shrink-0 truncate text-[11px] text-gray-300">{taskCol ? cellValue(row.id, taskCol.id) : ""}</span>
                  <div className="relative h-5 flex-1 rounded bg-ink-900/60">
                    <div
                      className="absolute top-0 h-5 rounded bg-sky-500/80"
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      title={`${fmtDate(startVal)} → ${fmtDate(endVal)}`}
                    >
                      <div className="h-full rounded bg-emerald-500/80" style={{ width: `${Math.min(donePct, 100)}%` }} />
                    </div>
                  </div>
                  <span className="w-10 shrink-0 text-right text-[10px] text-gray-500">{donePct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {canEdit && !isGuest && (
        <div className="mt-4 flex justify-end">
          {mode === "edit" ? (
            <Button variant="primary" onClick={saveAll}>
              <SaveIcon size={16} className="mr-1.5" /> Save
            </Button>
          ) : (
            <Button variant="secondary" onClick={enterEditMode}>
              <Pencil size={16} className="mr-1.5" /> Edit
            </Button>
          )}
        </div>
      )}
    </div>
  );
}