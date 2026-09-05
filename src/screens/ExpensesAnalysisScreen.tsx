import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, X, FileSpreadsheet, Save as SaveIcon, Pencil, Calculator } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Spinner, Button } from "../components/ui";
import type { ExpenseColumn, ExpenseRow, ExpenseCell, ExpenseSummary, Project } from "../lib/types";

const DEFAULT_COLUMNS = ["SN.", "Item Type", "Item Description", "Unit", "Quantity", "Supplier Price", "Total Price"];

function fmtNum(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function ExpensesAnalysisScreen() {
  const { id } = useParams<{ id: string }>();
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const [columns, setColumns] = useState<ExpenseColumn[]>([]);
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [cells, setCells] = useState<ExpenseCell[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [manpowerDraft, setManpowerDraft] = useState("0");
  const [otherDraft, setOtherDraft] = useState("0");

  const [editingHeader, setEditingHeader] = useState<string | null>(null);
  const [headerDraft, setHeaderDraft] = useState("");
  const [mode, setMode] = useState<"view" | "edit">("view");

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const cellValue = useCallback(
    (rowId: string, columnId: string) => cells.find((c) => c.row_id === rowId && c.column_id === columnId)?.value ?? "",
    [cells]
  );

  function isSnColumn(col: ExpenseColumn) {
    return col.label.trim().toUpperCase() === "SN.";
  }
  function isDescColumn(col: ExpenseColumn) {
    return col.label.trim().toLowerCase() === "item description";
  }
  function isTotalColumn(col: ExpenseColumn) {
    return col.label.trim().toLowerCase() === "total price";
  }
    function isNarrowColumn(col: ExpenseColumn) {
    const l = col.label.trim().toLowerCase();
    return l === "unit" || l === "quantity" || l === "supplier price" || l === "item type" || l === "total price";
  }
  function isQuantityColumn(col: ExpenseColumn) {
    return col.label.trim().toLowerCase() === "quantity";
  }
  function isSupplierPriceColumn(col: ExpenseColumn) {
    return col.label.trim().toLowerCase() === "supplier price";
  }

  async function loadAll() {
    if (!id || !user) { setLoading(false); return; }
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
            .eq("field", "expenses")
            .maybeSingle();
          allowed = !!perm;
        }
      }
      setCanEdit(allowed);
      if (!allowed && !isGuest) { setAccessDenied(true); setLoading(false); return; }

      let { data: colsData } = await supabase
        .from("project_expense_columns")
        .select("*")
        .eq("project_id", id)
        .order("position", { ascending: true });

      if (!colsData || colsData.length === 0) {
        const seeded = await Promise.all(
          DEFAULT_COLUMNS.map((label, i) =>
            supabase.from("project_expense_columns").insert({ project_id: id, label, position: i }).select().single()
          )
        );
        colsData = seeded.map((r) => r.data).filter(Boolean) as typeof colsData;
      }
      setColumns((colsData as ExpenseColumn[]) ?? []);

      const { data: rowsData } = await supabase
        .from("project_expense_rows")
        .select("*")
        .eq("project_id", id)
        .order("position", { ascending: true });
      setRows((rowsData as ExpenseRow[]) ?? []);

      const rowIds = ((rowsData as ExpenseRow[]) ?? []).map((r) => r.id);
      if (rowIds.length > 0) {
        const { data: cellsData } = await supabase.from("project_expense_cells").select("*").in("row_id", rowIds);
        setCells((cellsData as ExpenseCell[]) ?? []);
      } else {
        setCells([]);
      }

      const { data: summaryData } = await supabase
        .from("project_expense_summary")
        .select("*")
        .eq("project_id", id)
        .maybeSingle();
      setSummary(summaryData as ExpenseSummary | null);
      setManpowerDraft(String((summaryData as ExpenseSummary | null)?.manpower_costs ?? 0));
      setOtherDraft(String((summaryData as ExpenseSummary | null)?.other_costs ?? 0));

      setMode("view");
    } catch (err) {
      console.error("ExpensesAnalysisScreen loadAll crashed:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [id, user?.id]);

    const qtyColumn = columns.find(isQuantityColumn);
  const priceColumn = columns.find(isSupplierPriceColumn);
  const itemsCostsTotal = (qtyColumn && priceColumn)
    ? rows.reduce((sum, row) => {
        const qty = parseFloat(cellValue(row.id, qtyColumn.id)) || 0;
        const price = parseFloat(cellValue(row.id, priceColumn.id)) || 0;
        return sum + qty * price;
      }, 0)
    : 0;
  const poValue = Number(project?.po_value_sar || 0);
  const manpowerCosts = Number(manpowerDraft) || 0;
  const otherCosts = Number(otherDraft) || 0;
  const advantage = poValue - itemsCostsTotal - manpowerCosts - otherCosts;

  useEffect(() => {
    if (!chartRef.current || !(window as any).Chart || loading) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const data = [
      Math.max(itemsCostsTotal, 0),
      Math.max(manpowerCosts, 0),
      Math.max(otherCosts, 0),
      Math.max(advantage, 0),
    ];

    chartInstance.current = new (window as any).Chart(chartRef.current, {
      type: "pie",
      data: {
        labels: ["Items Costs Total", "Manpower Costs", "Other Costs", "Advantage"],
        datasets: [{
          data,
          backgroundColor: ["#2a78d6", "#eb6834", "#9333ea", "#1baf7a"],
          borderColor: "#1a1a19",
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { color: "#9ca3af", font: { size: 12 } } },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const pct = poValue > 0 ? ((ctx.parsed / poValue) * 100).toFixed(1) : "0";
                return `${ctx.label}: ${Number(ctx.parsed).toLocaleString()} (${pct}%)`;
              },
            },
          },
        },
      },
    });

    return () => { chartInstance.current?.destroy(); };
  }, [itemsCostsTotal, manpowerCosts, otherCosts, advantage, poValue, loading]);

  async function addColumn() {
    if (!id) return;
    const label = prompt("اسم العمود الجديد:");
    if (!label || !label.trim()) return;
    const nextPos = columns.length > 0 ? Math.max(...columns.map((c) => c.position)) + 1 : 0;
    const { data, error } = await supabase
      .from("project_expense_columns")
      .insert({ project_id: id, label: label.trim(), position: nextPos })
      .select()
      .single();
    if (!error && data) setColumns((prev) => [...prev, data as ExpenseColumn]);
  }

  async function renameColumn(col: ExpenseColumn) {
    const label = headerDraft.trim();
    setEditingHeader(null);
    if (!label || label === col.label) return;
    await supabase.from("project_expense_columns").update({ label }).eq("id", col.id);
    setColumns((prev) => prev.map((c) => (c.id === col.id ? { ...c, label } : c)));
  }

  async function deleteColumn(col: ExpenseColumn) {
    if (!confirm(`Delete column "${col.label}"? This removes its data from every row.`)) return;
    await supabase.from("project_expense_columns").delete().eq("id", col.id);
    setColumns((prev) => prev.filter((c) => c.id !== col.id));
    setCells((prev) => prev.filter((c) => c.column_id !== col.id));
  }

  async function addRow() {
    if (!id) return;
    const nextPos = rows.length > 0 ? Math.max(...rows.map((r) => r.position)) + 1 : 0;
    const { data, error } = await supabase
      .from("project_expense_rows")
      .insert({ project_id: id, position: nextPos })
      .select()
      .single();
    if (!error && data) setRows((prev) => [...prev, data as ExpenseRow]);
  }

  async function deleteRow(rowId: string) {
    if (!confirm("Delete this row?")) return;
    await supabase.from("project_expense_rows").delete().eq("id", rowId);
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

  function enterEditMode() {
    if (isGuest || !canEdit) return;
    setMode("edit");
  }

   async function saveAll() {
    if (isGuest || !canEdit || !id) { setMode("view"); return; }
    const qtyCol = columns.find(isQuantityColumn);
    const priceCol = columns.find(isSupplierPriceColumn);
    const totalCol = columns.find(isTotalColumn);

    const payload = rows.flatMap((row) =>
      columns.map((col) => {
        let val = cellValue(row.id, col.id);
        if (totalCol && col.id === totalCol.id && qtyCol && priceCol) {
          const computed = (parseFloat(cellValue(row.id, qtyCol.id)) || 0) * (parseFloat(cellValue(row.id, priceCol.id)) || 0);
          val = String(computed);
        }
        return { row_id: row.id, column_id: col.id, value: val };
      })
    );
    if (payload.length > 0) {
      const { error } = await supabase.from("project_expense_cells").upsert(payload, { onConflict: "row_id,column_id" });
      if (error) console.error("saveAll upsert error:", error);
    }
    await supabase
      .from("project_expense_summary")
      .upsert({ project_id: id, manpower_costs: manpowerCosts, other_costs: otherCosts }, { onConflict: "project_id" });
    setSummary({ project_id: id, manpower_costs: manpowerCosts, other_costs: otherCosts, updated_at: new Date().toISOString() });
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
    const grandTotalRow = columns.map((col) => (isTotalColumn(col) ? fmtNum(itemsCostsTotal) : (col === columns[0] ? "Grand Total" : "")));
    const csv = [headers, ...dataRows, grandTotalRow]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Expenses_${project?.project_name || "project"}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  if (accessDenied || !project) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400">You don't have access to this page.</p>
        <Button variant="secondary" onClick={() => navigate(-1)} className="mt-4">Back</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-6 flex items-center gap-2">
        <Calculator size={18} className="text-gold" />
        <h1 className="text-2xl font-bold text-white">Project Expenses Analysis</h1>
      </div>

      <div className="mb-6 rounded-2xl border border-ink-700 bg-ink-800 px-5 py-4">
        <h2 className="text-lg font-bold text-white">{project.project_name || "—"}</h2>
        <p className="mt-1 text-sm text-gray-400">PO Value: SAR {fmtNum(poValue)}</p>
      </div>

      <div className="mb-2 flex justify-end">
        <Button variant="secondary" onClick={exportCSV}>
          <FileSpreadsheet size={16} className="mr-1.5" /> Export CSV
        </Button>
      </div>

            <div className="overflow-auto rounded-xl border border-ink-700 bg-ink-800" style={{ maxHeight: "60vh" }}>
        <table className="w-full min-w-[720px] text-sm border-collapse table-fixed">
          <thead>
            <tr className="sticky top-0 z-10 border-b border-ink-700 bg-ink-800 text-left text-[10px] uppercase tracking-wider text-white/90">
              {columns.map((col) => (
<th key={col.id} className={`px-3 py-3 font-semibold whitespace-nowrap ${isSnColumn(col) ? "w-14" : isDescColumn(col) ? "w-64" : isNarrowColumn(col) ? "w-24" : "w-32"}`}>
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
                        onClick={() => { if (canEdit && !isGuest) { setEditingHeader(col.id); setHeaderDraft(col.label); } }}
                        className="hover:text-gold transition-colors truncate"
                        title="Rename column"
                      >
                        {col.label}
                      </button>
                      {canEdit && !isGuest && (
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
                  No items yet. {canEdit && !isGuest && 'Click "Add Row" to get started.'}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-ink-700/40 hover:bg-ink-700/25 transition-colors align-top">
   {columns.map((col) => {
                    const isSn = isSnColumn(col);
                    const isDesc = isDescColumn(col);
                    const isNarrow = isNarrowColumn(col);
                    const isTotal = isTotalColumn(col);
                    const qtyCol = columns.find(isQuantityColumn);
                    const priceCol = columns.find(isSupplierPriceColumn);
                    const computedTotal =
                      isTotal && qtyCol && priceCol
                        ? (parseFloat(cellValue(row.id, qtyCol.id)) || 0) * (parseFloat(cellValue(row.id, priceCol.id)) || 0)
                        : null;
                    const value = isTotal && computedTotal !== null ? String(computedTotal) : cellValue(row.id, col.id);

                    if (mode === "view" || isGuest || !canEdit) {
                      return (
                        <td
                          key={col.id}
                          onClick={enterEditMode}
                          className={`px-3 py-2 align-top ${canEdit && !isGuest ? "cursor-text hover:bg-ink-700/30" : ""}`}
                        >
                          {isDesc ? (
                            <p className="whitespace-pre-wrap break-words text-xs text-gray-300 min-h-[1.5em]">{value || "—"}</p>
                          ) : (
                            <p className={`text-xs text-gray-300 break-words ${isSn || isNarrow ? "text-center" : ""}`}>{isTotal && computedTotal !== null ? fmtNum(computedTotal) : (value || "—")}</p>
                          )}
                        </td>
                      );
                    }

                    if (isDesc) {
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

                    if (isTotal) {
                      return (
                        <td key={col.id} className="px-3 py-2 align-top">
                          <div className="w-24 rounded-lg border border-ink-700 bg-ink-900/30 px-2 py-1.5 text-xs text-gray-300">
                            {computedTotal !== null ? fmtNum(computedTotal) : "—"}
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={col.id} className={`px-3 py-2 align-top ${isSn || isNarrow ? "w-24" : ""}`}>
                        <input
                          value={value}
                          onChange={(e) => updateCellLocal(row.id, col.id, e.target.value)}
                          placeholder="—"
                          className={`rounded-lg border border-ink-700 bg-ink-900/50 px-2 py-1.5 text-xs text-white outline-none focus:border-gold/50 placeholder-gray-600 ${isSn || isNarrow ? "w-24 text-center" : "w-full"}`}
                        />
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right align-top">
                    {canEdit && !isGuest && mode === "edit" && (
                      <button onClick={() => deleteRow(row.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-ink-900/60 font-bold text-white">
              {columns.map((col, i) => (
                <td key={col.id} className="px-3 py-2.5 text-xs">
                  {i === 0 ? "Grand Total" : isTotalColumn(col) ? fmtNum(itemsCostsTotal) : ""}
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

      {/* Summary dashboard */}
      <div className="mt-8 rounded-xl border border-ink-700 bg-ink-800 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between border-b border-ink-700/50 py-2">
            <span className="text-gray-400">Total PO/Contract Value</span>
            <span className="font-semibold text-white">SAR {fmtNum(poValue)}</span>
          </div>
          <div className="flex items-center justify-between border-b border-ink-700/50 py-2">
            <span className="text-gray-400">Items Costs Total</span>
            <span className="font-semibold text-white">SAR {fmtNum(itemsCostsTotal)}</span>
          </div>
          <div className="flex items-center justify-between border-b border-ink-700/50 py-2">
            <span className="text-gray-400">Manpower Costs</span>
            {mode === "edit" && canEdit && !isGuest ? (
              <input
                value={manpowerDraft}
                onChange={(e) => setManpowerDraft(e.target.value)}
                className="w-32 rounded-lg border border-ink-600 bg-ink-900/60 px-2 py-1 text-right text-xs text-white outline-none focus:border-gold/50"
              />
            ) : (
              <span className="font-semibold text-white">SAR {fmtNum(manpowerCosts)}</span>
            )}
          </div>
          <div className="flex items-center justify-between border-b border-ink-700/50 py-2">
            <span className="text-gray-400">Other Costs</span>
            {mode === "edit" && canEdit && !isGuest ? (
              <input
                value={otherDraft}
                onChange={(e) => setOtherDraft(e.target.value)}
                className="w-32 rounded-lg border border-ink-600 bg-ink-900/60 px-2 py-1 text-right text-xs text-white outline-none focus:border-gold/50"
              />
            ) : (
              <span className="font-semibold text-white">SAR {fmtNum(otherCosts)}</span>
            )}
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400">Advantage</span>
            <span className={`font-bold ${advantage >= 0 ? "text-emerald-400" : "text-rose-400"}`}>SAR {fmtNum(advantage)}</span>
          </div>
        </div>
      </div>

      {/* Pie chart */}
      <div className="mt-4 rounded-xl border border-ink-700 bg-ink-800 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Cost Distribution (% of PO Value)</h3>
        <div style={{ position: "relative", width: "100%", height: 280 }}>
          <canvas ref={chartRef} />
        </div>
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