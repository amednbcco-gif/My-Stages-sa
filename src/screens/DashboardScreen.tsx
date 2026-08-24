import { useState, useEffect } from "react";
import { FolderKanban, CircleCheck as CheckCircle2, Clock, DollarSign, TrendingUp, FileSpreadsheet, Wallet, Receipt, FileCheck2, Landmark, ClipboardCheck, Users } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Spinner, Button } from "../components/ui";
import { computeProgress, currentStage, stageShortLabel, STAGE_LABELS, MILESTONES } from "../lib/stages";
import { DEMO_PROJECT } from "../lib/demoProject";
import type { Project, TeamMember, ProjectPermission } from "../lib/types";

function fmtSAR(n: number) {
  if (!n || isNaN(n)) return "0";
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}


interface TeamEval {
  memberId: string;
  memberName: string;
  approvedCount: number;
  submittedCount: number;
  totalMilestones: number;
  pct: number;
  projectCount: number;
}

export function DashboardScreen() {
  const { user, profile, isGuest } = useAuth();
  const isManager = profile?.role === "manager";
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [permissions, setPermissions] = useState<ProjectPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (isGuest) {
        setProjects([DEMO_PROJECT]);
        setMembers([]);
        setPermissions([]);
        setLoading(false);
        return;
      }
      const [projRes, memRes, permRes] = await Promise.all([
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("team_members").select("*").order("created_at", { ascending: false }),
        supabase.from("project_permissions").select("*").order("created_at", { ascending: false }),
      ]);
      setProjects((projRes.data as Project[]) ?? []);
      const allMembers = (memRes.data as TeamMember[]) ?? [];
      // Engineers only see their own team member record; managers see all.
      setMembers(isManager ? allMembers : allMembers.filter((m) => m.user_id === user?.id));
      setPermissions((permRes.data as ProjectPermission[]) ?? []);
      setLoading(false);
    }
    if (user || isGuest) load();
  }, [user, isGuest]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  const total = projects.length;
  const completed = projects.filter((p) => p.status === "Completed").length;
  const inProgress = projects.filter((p) => p.status === "In Progress").length;
  const pending = projects.filter((p) => p.status === "Pending").length;
  const totalValueSAR = projects.reduce((sum, p) => sum + Number(p.po_value_sar || 0), 0);
  const avgProgress = total > 0 ? Math.round(projects.reduce((sum, p) => sum + computeProgress(p), 0) / total) : 0;

  const aboqApproved = projects.filter((p) => p.stage2?.aboqStatus === "approved");
  const rfsApproved = projects.filter((p) => p.stage5?.rfsStatus === "approved");
  const pacApproved = projects.filter((p) => p.stage5?.pacStatus === "approved");
  const facApproved = projects.filter((p) => p.stage6?.facStatus === "approved");

  const aboq = aboqApproved.reduce((sum, p) => sum + Number(p.stage2?.aboqAmount || p.po_value_sar || 0), 0);
  const rfs = rfsApproved.reduce((sum, p) => sum + Number(p.stage5?.rfsAmount || Number(p.stage2?.aboqAmount || p.po_value_sar || 0) * 0.8), 0);
  const pac = pacApproved.reduce((sum, p) => sum + Number(p.stage5?.pacAmount || Number(p.stage2?.aboqAmount || p.po_value_sar || 0) * 0.1), 0);
  const fac = facApproved.reduce((sum, p) => sum + Number(p.stage6?.facAmount || Number(p.stage2?.aboqAmount || p.po_value_sar || 0) * 0.1), 0);

  const stageDist: Record<string, number> = {};
  for (const s of Object.keys(STAGE_LABELS)) stageDist[s] = 0;
  projects.forEach((p) => {
    stageDist[currentStage(p)]++;
  });

  // ── Team Evaluate ──
//
// Evaluate each team member using ONLY the main milestones assigned through
// "Assign Milestones Access".
//
// The permission structure is:
// project_permissions
//   - team_member_id
//   - project_id
//   - scope = "field"
//   - field = MILESTONES.id
//   - stage = MILESTONES.stage
//
// Only permissions with scope === "field" are included.
//
// Evaluation weights:
// Completed status = 100%
// Submitted status = 50%
//
// Final Formula:
//
// (Approved + (Submitted × 0.5))
// -------------------------------- × 100
//   Total Assigned Milestones
//
// Example:
// 20 projects × 4 assigned milestones = 80 total milestones
//
// Approved = 30
// Submitted = 50
//
// (30 + (50 × 0.5)) / 80 × 100
// = 68.75% ≈ 69%

const completedValues = [
  "approved",
  "rectified",
  "handed over",
  "done",
  "clearanced",
  "closed",
  "patted",
  "issued",
].map((value) => value.toLowerCase());

const teamEvals: TeamEval[] = members.map((m) => {
  // Get ONLY milestone permissions assigned through
  // "Assign Milestones Access".
  //
  // Each permission represents one main milestone
  // assigned to this member for one project.
  const memberMilestonePerms = permissions.filter(
    (p) =>
      p.team_member_id === m.id &&
      p.scope === "field"
  );

  // Get unique project IDs that contain at least one
  // assigned main milestone for this member.
  const assignedProjectIds = new Set(
    memberMilestonePerms.map((p) => p.project_id)
  );

  // Get only the projects that actually have milestone permissions.
  const assignedProjects = projects.filter((p) =>
    assignedProjectIds.has(p.id)
  );

  let approvedCount = 0;
  let submittedCount = 0;
  let totalMilestones = 0;

  // Evaluate every assigned project.
  for (const project of assignedProjects) {
    // Get only this member's main milestone permissions
    // for the current project.
    const projectMilestonePerms = memberMilestonePerms.filter(
      (p) => p.project_id === project.id
    );

    // Each permission.field contains the exact MILESTONES.id
    // selected in "Assign Milestones Access".
    const assignedMilestoneIds = new Set(
      projectMilestonePerms.map((p) => String(p.field))
    );

    // Loop through ONLY the main milestones defined in MILESTONES.
    for (const ms of MILESTONES) {
      // Skip this milestone if it was not assigned to the member.
      if (!assignedMilestoneIds.has(String(ms.id))) {
        continue;
      }

      // This is one assigned main milestone.
      totalMilestones++;

      // Get the stage that belongs to this main milestone.
      const stage = ms.stage as keyof Project;

      const stageData = project[stage] as unknown as
        | Record<string, unknown>
        | undefined;

      // Read ONLY the status field defined for this main milestone.
      //
      // This prevents the evaluation from counting all status fields
      // inside the stage card.
      const status = String(
        stageData?.[ms.statusField.key] ?? ""
      )
        .trim()
        .toLowerCase();

      // Completed statuses = 100%
      if (completedValues.includes(status)) {
        approvedCount++;
      }

      // Submitted = 50%
      else if (status === "submitted") {
        submittedCount++;
      }
    }
  }

  // Final evaluation:
  //
  // (Approved + (Submitted × 0.5))
  // -------------------------------- × 100
  //   Total Assigned Milestones

  const pct =
    totalMilestones > 0
      ? Math.round(
          (
            (approvedCount + submittedCount * 0.5) /
            totalMilestones
          ) * 100
        )
      : 0;

  return {
    memberId: m.id,
    memberName: m.full_name || m.email,
    approvedCount,
    submittedCount,
    totalMilestones,
    pct,
    projectCount: assignedProjects.length,
  };
});
  function exportCSV() {
    const headers = ["SN", "Project Name", "Site ID", "Status", "Progress %", "Current Stage", "PO Value SAR"];
    const rows = projects.map((p) => [
      p.sn, p.project_name, p.site_id, p.status,
      computeProgress(p), stageShortLabel(currentStage(p)), p.po_value_sar,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `STAGES_Tracksheet_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const stats = [
    { label: "Total Projects", value: total, icon: FolderKanban, color: "text-sky-300", bg: "bg-sky-500/10" },
    { label: "Completed", value: completed, icon: CheckCircle2, color: "text-emerald-300", bg: "bg-emerald-500/10" },
    { label: "In Progress", value: inProgress, icon: Clock, color: "text-amber-300", bg: "bg-amber-500/10" },
    { label: "Total Value (SAR)", value: fmtSAR(totalValueSAR), icon: DollarSign, color: "text-gold", bg: "bg-gold/10" },
  ];

  const finCards = [
    {
      label: "ABOQ",
      sub: `${aboqApproved.length} project${aboqApproved.length === 1 ? "" : "s"} approved · 100% of PO value`,
      value: aboq,
      icon: Landmark,
      color: "text-sky-300",
      bg: "bg-sky-500/10",
      ring: "border-sky-500/20",
    },
    {
      label: "RFS",
      sub: `${rfsApproved.length} project${rfsApproved.length === 1 ? "" : "s"} approved · 80% of PO value`,
      value: rfs,
      icon: Receipt,
      color: "text-emerald-300",
      bg: "bg-emerald-500/10",
      ring: "border-emerald-500/20",
    },
    {
      label: "PAC",
      sub: `${pacApproved.length} project${pacApproved.length === 1 ? "" : "s"} approved · 10% of PO value`,
      value: pac,
      icon: FileCheck2,
      color: "text-amber-300",
      bg: "bg-amber-500/10",
      ring: "border-amber-500/20",
    },
    {
      label: "FAC",
      sub: `${facApproved.length} project${facApproved.length === 1 ? "" : "s"} approved · 10% of PO value`,
      value: fac,
      icon: Wallet,
      color: "text-gold",
      bg: "bg-gold/10",
      ring: "border-gold/20",
    },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Executive Command Center</h1>
          <p className="text-sm text-gray-400">Real-time overview of infrastructure projects, billing milestones, and cashflow realization.</p>
        </div>
        <Button variant="secondary" onClick={exportCSV}>
          <FileSpreadsheet size={16} className="mr-1.5" /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-ink-700 bg-ink-800 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className={`rounded-lg ${stat.bg} p-2`}>
                  <Icon size={18} className={stat.color} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Financial milestone cards: ABOQ / RFS / PAC / FAC */}
      <div className="mb-2 flex items-center gap-2">
        <Wallet size={16} className="text-gold" />
        <h2 className="text-sm font-semibold text-white">Financial Milestones (SAR)</h2>
      </div>
      <p className="mb-4 text-xs text-gray-500">
        ABOQ is the approved bill of quantities. RFS, PAC, and FAC are derived from the approved amount.
      </p>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {finCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`rounded-xl border ${c.ring} bg-ink-800 p-5 transition-transform hover:scale-[1.02]`}>
              <div className="mb-3 flex items-center justify-between">
                <div className={`rounded-lg ${c.bg} p-2`}>
                  <Icon size={18} className={c.color} />
                </div>
                <span className={`text-xs font-bold tracking-wider ${c.color}`}>{c.label}</span>
              </div>
              <p className="text-xl font-bold text-white">
                {fmtSAR(c.value)} <span className="text-xs font-normal text-gray-500">SAR</span>
              </p>
              <p className="mt-1 text-[11px] leading-snug text-gray-500">{c.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Progress overview */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-ink-700 bg-ink-800 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Average Progress</h3>
            <TrendingUp size={16} className="text-gold" />
          </div>
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#14365f" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="#d4af37" strokeWidth="8"
                  strokeDasharray={`${(avgProgress / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{avgProgress}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Completed</span>
                <span className="text-emerald-300">{completed}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">In Progress</span>
                <span className="text-sky-300">{inProgress}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Pending</span>
                <span className="text-amber-300">{pending}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stage distribution */}
        <div className="rounded-xl border border-ink-700 bg-ink-800 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Stage Distribution</h3>
          <div className="space-y-2">
            {Object.entries(STAGE_LABELS).map(([key]) => {
              const count = stageDist[key] ?? 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-xs text-gray-400">{stageShortLabel(key)}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-700">
                    <div className="h-full rounded-full bg-gold/70" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right text-xs text-gray-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team Evaluate */}
      <div className="rounded-xl border border-ink-700 bg-ink-800 p-5">
        <div className="mb-2 flex items-center gap-2">
          <ClipboardCheck size={16} className="text-gold" />
          <h3 className="text-sm font-semibold text-white">Team Evaluate</h3>
        </div>
        <p className="mb-4 text-xs text-gray-500">
          Approved / Done / Clearanced / Closed / PATTED / Issued / rectified / Handed Over = 100% · Submitted = 50%
        </p>
        {teamEvals.length === 0 ? (
          <div className="py-10 text-center">
            <Users size={28} className="mx-auto mb-2 text-gray-600" />
            <p className="text-sm text-gray-500">No team members yet. Add team members from the Team page to see their evaluation.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {teamEvals.map((te) => (
              <div
                key={te.memberId}
                className="flex flex-col gap-3 rounded-lg border border-ink-700/50 bg-ink-900/30 p-3 transition-colors hover:bg-ink-700/20 sm:flex-row sm:items-center"
              >
                {/* Member name + project count */}
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                    {te.memberName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{te.memberName}</p>
                    <p className="text-[11px] text-gray-500">{te.projectCount} project{te.projectCount !== 1 ? "s" : ""} · {te.totalMilestones} milestone{te.totalMilestones !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                {/* Counts */}
                <div className="flex items-center gap-4 pl-10 sm:pl-0">
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-bold text-emerald-300">
                      {te.approvedCount}
                    </span>
                    <span className="text-gray-500">Approved</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15 text-[11px] font-bold text-amber-300">
                      {te.submittedCount}
                    </span>
                    <span className="text-gray-500">Submitted</span>
                  </span>
                </div>

                {/* Percentage bar */}
                <div className="flex items-center gap-2 pl-11 sm:w-40 sm:pl-0">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-700 sm:max-w-[120px]">
                    <div
                      className={"h-full rounded-full transition-all duration-500 " + (te.pct >= 75 ? "bg-emerald-500" : te.pct >= 40 ? "bg-amber-500" : "bg-rose-500")}
                      style={{ width: `${te.pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-bold text-gray-200">{te.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
