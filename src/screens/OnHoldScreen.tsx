import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, X, FileSpreadsheet, Save as SaveIcon, Pencil } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Spinner, Button } from "../components/ui";
import type { OnHoldColumn, OnHoldRow, OnHoldCell } from "../lib/types";

const DEFAULT_COLUMNS = ["SN.", "Project Name", "PO Value", "City", "Note"];

export function OnHoldScreen() {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [columns, setColumns] = useState<OnHoldColumn[]>([]);
  const [rows, setRows] = useState<OnHoldRow[]>([]);
  const [cells, setCells] = useState<OnHoldCell[]>([]);
  const [editingHeader, setEditingHeader] = useState<string | null>(null);
  const [headerDraft, setHeaderDraft] = useState("");
  const [mode, setMode] = useState<"view" | "edit">("view");

  const cellValue = useCallback(
    (rowId: string, columnId: string) => cells.find((c) => c.row_id === rowId && c.column_id === columnId)?.value ?? "",
    [cells]
  );

  function isNoteColumn(col: OnHoldColumn) {
    return col.label.trim().toLowerCase() === "note";
  }

  function isSnColumn(col: OnHoldColumn) {
    return col.label.trim().toUpperCase() === "SN.";
  }

  async function resolveOwnerId(): Promise<string | null> {
    if (!user) return null;
    const { data: tm } = await supabase
      .from("team_members")
      .select("owner_id")
      .eq("user_id", user.id)
      .maybeSingle();
    return tm?.owner_id ?? user.id;
  }

  async function loadAll() {
    if (isGuest) {
      const demoCols: OnHoldColumn[] = DEFAULT_COLUMNS.map((label, i) => ({
        id: `demo-col-${i}`,
        owner_id: "demo",
        label,
        position: i,
        created_at: new Date().toISOString(),
      }));
      setColumns(demoCols);
      setRows([]);
      setCells([]);
      setOwnerId(null);
      setMode("view");
      setLoading(false);
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      const resolved = await resolveOwnerId();
      setOwnerId(resolved);
      if (!resolved) { return; }

      let { data: colsData, error: colsErr } = await supabase
        .from("on_hold_columns")
        .select("*")
        .eq("owner_id", resolved)
        .order("position", { ascending: true });

      if (colsErr) console.error("on_hold_columns select error:", colsErr);

      if (!colsData || colsData.length === 0) {
        const seeded = await Promise.all(
          DEFAULT_COLUMNS.map((label, i) =>
            supabase.from("on_hold_columns").insert({ owner_id: resolved, label, position: i }).select().single()
          )
        );
        seeded.forEach((r) => { if (r.error) console.error("seed column error:", r.error); });
        colsData = seeded.map((r) => r.data).filter(Boolean) as typeof colsData;
      }
      setColumns((colsData as OnHoldColumn[]) ?? []);

      const { data: rowsData, error: rowsErr } = await supabase
        .from("on_hold_rows")
        .select("*")
        .eq("owner_id", resolved)
        .order("position", { ascending: true });

      if (rowsErr) console.error("on_hold_rows select error:", rowsErr);
      setRows((rowsData as OnHoldRow[]) ?? []);

      const rowIds = ((rowsData as OnHoldRow[]) ?? []).map((r) => r.id);
      if (rowIds.length > 0) {
        const { data: cellsData, error: cellsErr } = await supabase.from("on_hold_cells").select("*").in("row_id", rowIds);
        if (cellsErr) console.error("on_hold_cells select error:", cellsErr);
        setCells((cellsData as OnHoldCell[]) ?? []);
      } else {
        setCells([]);
      }
      setMode("view");
    } catch (err) {
      console.error("OnHoldScreen loadAll crashed:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [user?.id, isGuest]);

  async function addColumn() {
    if (!ownerId) return;
    const label = prompt("اسم العمود الجديد:");
    if (!label || !label.trim()) return;
    const nextPos = columns.length > 0 ? Math.max(...columns.map((c) => c.position)) + 1 : 0;
    const { data, error } = await supabase
      .from("on_hold_columns")
      .insert({ owner_id: ownerId, label: label.trim(), position: nextPos })
      .select()
      .single();
    if (!error && data) setColumns((prev) => [...prev, data as OnHoldColumn]);
  }

  async function renameColumn(col: OnHoldColumn) {
    const label = headerDraft.trim();
    setEditingHeader(null);
    if (!label || label === col.label) return;
    await supabase.from("on_hold_columns").update({ label }).eq("id", col.id);
    setColumns((prev) => prev.map((c) => (c.id === col.id ? { ...c, label } : c)));
  }

  async function deleteColumn(col: OnHoldColumn) {
    if (!confirm(`Delete column "${col.label}"? This removes its data from every row.`)) return;
    await supabase.from("on_hold_columns").delete().eq("id", col.id);
    setColumns((prev) => prev.filter((c) => c.id !== col.id));
    setCells((prev) => prev.filter((c) => c.column_id !== col.id));
  }

  async function addRow() {
    if (!ownerId) return;
    const nextPos = rows.length > 0 ? Math.max(...rows.map((r) => r.position)) + 1 : 0;
    const { data, error } = await supabase
      .from("on_hold_rows")
      .insert({ owner_id: ownerId, position: nextPos })
      .select()
      .single();
    if (!error && data) setRows((prev) => [...prev, data as OnHoldRow]);
  }

  async function deleteRow(rowId: string) {
    if (!confirm("Delete this row?")) return;
    await supabase.from("on_hold_rows").delete().eq("id", rowId);
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    setCells((prev) => prev.filter((c) => c.row_id !== rowId));
  }

  function updateCellLocal(rowId: string, columnId: string, value: string) {
    setCells((prev) => {
      const exists = prev.find((c) => c.row_id === rowId && c.column_id === columnId);
      if (exists) return prev.map((c) => (c.row_id === rowId && c.column_id === columnId ? { ...c, value } : c));
      return [...prev, { id: `temp-${rowId}-${columnId}`, row_id: rowId, column_id: columnId, value, updated_at: new Date().toISOString() }];
    });
  }

  async function persistCell(rowId: string, columnId: string, value: string) {
    await supabase
      .from("on_hold_cells")
      .upsert({ row_id: rowId, column_id: columnId, value }, { onConflict: "row_id,column_id" });
  }

  function enterEditMode() {
    if (isGuest) return;
    setMode("edit");
  }

  async function saveAll() {
    if (isGuest) { setMode("view"); return; }
    const payload = rows.flatMap((row) =>
      columns.map((col) => ({
        row_id: row.id,
        column_id: col.id,
        value: cellValue(row.id, col.id),
      }))
    );
    if (payload.length > 0) {
      const { error } = await supabase.from("on_hold_cells").upsert(payload, { onConflict: "row_id,column_id" });
      if (error) console.error("saveAll upsert error:", error);
    }
    setMode("view");
  }

  function autoGrow(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  function exportCSV() {
    const headers = columns.map((c) => c.label);
    const dataRows = rows.map((row) => columns.map((col) => cellValue(row.id, col.id)));
    const csv = [headers, ...dataRows]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `STAGES_OnHold_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="mb-2 flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-2xl font-bold text-white">On Hold</h1>
          <p className="text-sm text-gray-400">
            Custom tracker — add columns and rows and name them however you like. Shared with your whole team.
            {!isGuest && (mode === "view" ? " Click any cell to edit." : " Editing — click Save when done.")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportCSV}>
            <FileSpreadsheet size={16} className="mr-1.5" /> Export CSV
          </Button>
          {!isGuest && (
            <>
              <Button variant="secondary" onClick={addColumn}>
                <Plus size={16} className="mr-1.5" /> Add Column
              </Button>
              <Button variant="primary" onClick={addRow}>
                <Plus size={16} className="mr-1.5" /> Add Row
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink-700 bg-ink-800">
        <table className="w-full min-w-[600px] text-sm border-collapse table-fixed">
          <thead>
            <tr className="border-b border-ink-700 text-left text-[10px] uppercase tracking-wider text-white/90">
              {columns.map((col) => (
                <th key={col.id} className={`px-3 py-3 font-semibold whitespace-nowrap ${isSnColumn(col) ? "w-16" : isNoteColumn(col) ? "w-64" : "w-40"}`}>
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
                        onClick={() => { if (!isGuest) { setEditingHeader(col.id); setHeaderDraft(col.label); } }}
                        className="hover:text-gold transition-colors truncate"
                        title="Rename column"
                      >
                        {col.label}
                      </button>
                      {!isGuest && (
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-10 text-center text-gray-500">
                  No rows yet. {!isGuest && 'Click "Add Row" to get started.'}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-ink-700/40 hover:bg-ink-700/25 transition-colors align-top">
                  {columns.map((col) => {
                    const isSn = isSnColumn(col);
                    const isNote = isNoteColumn(col);
                    const value = cellValue(row.id, col.id);

                    if (mode === "view" || isGuest) {
                      return (
                        <td
                          key={col.id}
                          onClick={enterEditMode}
                          className={`px-3 py-2 align-top ${!isGuest ? "cursor-text hover:bg-ink-700/30" : ""}`}
                        >
                          {isNote ? (
                            <p className="whitespace-pre-wrap break-words text-xs text-gray-300 min-h-[1.5em]">{value || "—"}</p>
                          ) : (
                            <p className={`text-xs text-gray-300 break-words ${isSn ? "text-center" : ""}`}>{value || "—"}</p>
                          )}
                        </td>
                      );
                    }

                    if (isNote) {
                      return (
                        <td key={col.id} className="px-3 py-2 align-top">
                          <textarea
                            value={value}
                            onChange={(e) => updateCellLocal(row.id, col.id, e.target.value)}
                            onInput={autoGrow}
                            rows={1}
                            placeholder="—"
                            className="w-full resize-none overflow-hidden rounded-lg border border-ink-700 bg-ink-900/50 px-2 py-1.5 text-xs text-white outline-none focus:border-gold/50 placeholder-gray-600 leading-relaxed"
                          />
                        </td>
                      );
                    }

                    return (
                      <td key={col.id} className={`px-3 py-2 align-top ${isSn ? "w-16" : ""}`}>
                        <input
                          value={value}
                          onChange={(e) => updateCellLocal(row.id, col.id, e.target.value)}
                          placeholder="—"
                          className={`rounded-lg border border-ink-700 bg-ink-900/50 px-2 py-1.5 text-xs text-white outline-none focus:border-gold/50 placeholder-gray-600 ${isSn ? "w-16 text-center" : "w-full"}`}
                        />
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right align-top">
                    {!isGuest && (
                      <button onClick={() => deleteRow(row.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isGuest && rows.length > 0 && (
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