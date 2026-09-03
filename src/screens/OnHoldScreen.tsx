import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, X, FileSpreadsheet } from "lucide-react";
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

  const cellValue = useCallback(
    (rowId: string, columnId: string) => cells.find((c) => c.row_id === rowId && c.column_id === columnId)?.value ?? "",
    [cells]
  );

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
          <p className="text-sm text-gray-400">Custom tracker — add columns and rows and name them however you like. Shared with your whole team.</p>
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
        <table className="w-full min-w-[600px] text-sm border-collapse">
          <thead>
            <tr className="border-b border-ink-700 text-left text-[10px] uppercase tracking-wider text-white/90">
               {columns.map((col) => (
                <th key={col.id} className={`px-3 py-3 font-semibold whitespace-nowrap ${col.label.trim().toUpperCase() === "SN." ? "w-16" : ""}`}>
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
                        onClick={() => { setEditingHeader(col.id); setHeaderDraft(col.label); }}
                        className="hover:text-gold transition-colors"
                        title="Rename column"
                      >
                        {col.label}
                      </button>
                      <button onClick={() => deleteColumn(col)} className="text-gray-600 hover:text-rose-300 transition-colors" title="Delete column">
                        <X size={11} />
                      </button>
                    </div>
                  )}
                </th>
              ))}
              <th className="px-3 py-3 font-semibold text-right"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-10 text-center text-gray-500">
                  No rows yet. Click "Add Row" to get started.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-ink-700/40 hover:bg-ink-700/25 transition-colors">
                                   {columns.map((col) => {
                    const isSn = col.label.trim().toUpperCase() === "SN.";
                    return (
                      <td key={col.id} className={`px-3 py-2 ${isSn ? "w-16" : ""}`}>
                                                <input
                          value={cellValue(row.id, col.id)}
                          onChange={(e) => updateCellLocal(row.id, col.id, e.target.value)}
                          onBlur={(e) => persistCell(row.id, col.id, e.target.value)}
                          placeholder="—"
                          disabled={isGuest}
                          className={`rounded-lg border border-ink-700 bg-ink-900/50 px-2 py-1.5 text-xs text-white outline-none focus:border-gold/50 placeholder-gray-600 disabled:opacity-60 disabled:cursor-not-allowed ${isSn ? "w-16 text-center" : "w-full"}`}
                        />
                      </td>
                    );
                  })}
                                    <td className="px-3 py-2 text-right">
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
    </div>
  );
}