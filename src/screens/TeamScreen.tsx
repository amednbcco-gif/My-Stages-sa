import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, Lock, Phone, Mail, Users } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Button, Input, Spinner } from "../components/ui";
import { Modal } from "../components/Modal";
import { STAGE_LABELS, STAGE_ORDER, STAGE_FIELDS } from "../lib/stages";
import type { TeamMember, ProjectPermission, Project } from "../lib/types";

type AccessScope = "full_project" | "whole_stage" | "specific_field";

interface PermissionRow extends ProjectPermission {
  project?: Project;
}

export function TeamScreen() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Add member modal
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [canAdd, setCanAdd] = useState(false);
  const [canView, setCanView] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  // Assign project access (inline per member)
  const [assignMemberId, setAssignMemberId] = useState<string | null>(null);
  const [assignProjectId, setAssignProjectId] = useState("");
  const [accessScope, setAccessScope] = useState<AccessScope>("full_project");
  const [assignStage, setAssignStage] = useState("");
  const [assignField, setAssignField] = useState("");
  const [assignCanEdit, setAssignCanEdit] = useState(true);
  const [assignSaving, setAssignSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [membersRes, projectsRes, permsRes] = await Promise.all([
      supabase.from("team_members").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("id,project_name,sn,site_id").order("created_at", { ascending: false }),
      supabase.from("project_permissions").select("*").order("created_at", { ascending: false }),
    ]);
    setMembers((membersRes.data as TeamMember[]) ?? []);
    setProjects((projectsRes.data as Project[]) ?? []);
    setPermissions((permsRes.data as PermissionRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  function resetAddForm() {
    setEmail("");
    setFullName("");
    setPhone("");
    setCanAdd(false);
    setCanView(false);
    setCanEdit(false);
  }

  async function handleAddMember() {
    if (!email) return;
    setSaving(true);
    const { error } = await supabase.from("team_members").insert({
      owner_id: user?.id,
      email: email.toLowerCase().trim(),
      full_name: fullName,
      phone,
      can_add_projects: canAdd,
      can_view_all: canView,
      can_edit_all: canEdit,
    });
    setSaving(false);
    if (!error) {
      setToast(`${fullName || email} added to team.`);
      setShowAdd(false);
      resetAddForm();
      load();
    }
  }

  async function handleDeleteMember(m: TeamMember) {
    if (!confirm(`Remove ${m.full_name || m.email} from your team?`)) return;
    await supabase.from("project_permissions").delete().eq("team_member_id", m.id);
    await supabase.from("team_members").delete().eq("id", m.id);
    setToast("Team member removed.");
    if (expanded === m.id) setExpanded(null);
    load();
  }

  function openAssign(memberId: string) {
    // Expand the row and open the assign panel
    setExpanded(memberId);
    setAssignMemberId(memberId);
    setAssignProjectId(projects[0]?.id ?? "");
    setAccessScope("full_project");
    setAssignStage("");
    setAssignField("");
    setAssignCanEdit(true);
  }

  function cancelAssign() {
    setAssignMemberId(null);
  }

  async function handleAssign() {
    if (!assignMemberId || !assignProjectId) return;
    setAssignSaving(true);

    const scope =
      accessScope === "full_project" ? "project" :
      accessScope === "whole_stage" ? "stage" : "field";

    const { error } = await supabase.from("project_permissions").insert({
      owner_id: user?.id,
      team_member_id: assignMemberId,
      project_id: assignProjectId,
      scope,
      stage: accessScope !== "full_project" ? assignStage : null,
      field: accessScope === "specific_field" ? assignField : null,
      can_edit: assignCanEdit,
    });
    setAssignSaving(false);
    if (!error) {
      setToast("Project access assigned.");
      setAssignMemberId(null);
      load();
    }
  }

  async function handleDeletePerm(permId: string) {
    await supabase.from("project_permissions").delete().eq("id", permId);
    setToast("Permission removed.");
    load();
  }

  function memberPerms(memberId: string) {
    return permissions.filter((p) => p.team_member_id === memberId);
  }

  function permLabel(p: ProjectPermission) {
    const proj = projects.find((x) => x.id === p.project_id);
    const projName = proj ? `${proj.sn || proj.project_name}` : "Unknown project";
    if (p.scope === "project") return `${projName} — Full project`;
    if (p.scope === "stage") return `${projName} — ${STAGE_LABELS[p.stage] ?? p.stage}`;
    const fieldLabel = STAGE_FIELDS[p.stage]?.find((f) => f.key === p.field)?.label ?? p.field;
    return `${projName} — ${STAGE_LABELS[p.stage] ?? p.stage} › ${fieldLabel}`;
  }

  const stageFieldOptions = assignStage ? (STAGE_FIELDS[assignStage] ?? []) : [];

  const canViewCount = members.filter((m) => m.can_view_all).length;
  const canEditCount = members.filter((m) => m.can_edit_all).length;
  const canAddCount  = members.filter((m) => m.can_add_projects).length;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Users size={22} className="text-gold" /> My Team
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Add your engineers &amp; staff, control who can view or edit your projects, and assign them to specific stages or fields.
          </p>
        </div>
        <Button variant="primary" onClick={() => { resetAddForm(); setShowAdd(true); }}>
          <Plus size={16} className="mr-1.5" /> Add Member
        </Button>
      </div>

      {/* Stat boxes */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-ink-700 bg-ink-800 px-5 py-4">
          <p className="text-sm text-gray-400">Can view all your projects</p>
          <p className="mt-1 text-3xl font-bold text-white">{canViewCount}</p>
        </div>
        <div className="rounded-xl border border-ink-700 bg-ink-800 px-5 py-4">
          <p className="text-sm text-gray-400">Can edit all your projects</p>
          <p className="mt-1 text-3xl font-bold text-white">{canEditCount}</p>
        </div>
        <div className="rounded-xl border border-ink-700 bg-ink-800 px-5 py-4">
          <p className="text-sm text-gray-400">Can add projects</p>
          <p className="mt-1 text-3xl font-bold text-white">{canAddCount}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={32} />
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-xl border border-ink-700 bg-ink-800 py-16 text-center">
          <p className="text-gray-400">No team members yet. Add your first team member to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m) => {
            const isOpen = expanded === m.id;
            const perms = memberPerms(m.id);
            const isAssigning = assignMemberId === m.id;
            const isPending = !m.user_id;

            return (
              <div key={m.id} className="rounded-xl border border-ink-700 bg-ink-800 overflow-hidden">
                {/* Row header */}
                <div className="flex items-start gap-3 p-4">
                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : m.id)}
                    className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                  >
                    {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white leading-none">{m.full_name || "Unnamed"}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Mail size={11} /> {m.email}</span>
                      {m.phone && <span className="flex items-center gap-1"><Phone size={11} /> {m.phone}</span>}
                      {isPending && (
                        <button
                          onClick={() => openAssign(m.id)}
                          className="flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[11px] font-medium text-gold hover:bg-gold/20 transition-colors"
                        >
                          <Lock size={10} /> Pending signup
                        </button>
                      )}
                    </div>

                    {/* Global permission badges */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs transition-colors ${m.can_view_all ? "border-gold/50 bg-gold/15 text-gold" : "border-ink-600 bg-ink-700/50 text-gray-500"}`}>
                        <Lock size={10} /> View all projects
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs transition-colors ${m.can_edit_all ? "border-gold/50 bg-gold/15 text-gold" : "border-ink-600 bg-ink-700/50 text-gray-500"}`}>
                        <Lock size={10} /> Edit all stages
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs transition-colors ${m.can_add_projects ? "border-gold/50 bg-gold/15 text-gold" : "border-ink-600 bg-ink-700/50 text-gray-500"}`}>
                        <Lock size={10} /> Add projects
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-gray-500">{perms.length} project-specific permission{perms.length !== 1 ? "s" : ""}</p>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteMember(m)}
                    className="flex-shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Expanded body */}
                {isOpen && (
                  <div className="border-t border-ink-700 px-4 pb-4 pt-3 space-y-4">
                    {/* Existing permissions list */}
                    {perms.length > 0 && (
                      <div className="space-y-1.5">
                        {perms.map((p) => (
                          <div key={p.id} className="flex items-center justify-between rounded-lg bg-ink-700/50 px-3 py-2">
                            <div>
                              <p className="text-xs text-gray-200">{permLabel(p)}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">{p.can_edit ? "Can edit" : "View only"}</p>
                            </div>
                            <button
                              onClick={() => handleDeletePerm(p.id)}
                              className="rounded p-1 text-gray-500 hover:text-rose-300 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Assign project access panel */}
                    {isAssigning ? (
                      <div className="rounded-xl border border-ink-600 bg-ink-900/60 p-4 space-y-4">
                        <p className="text-sm font-semibold text-white">Assign project access</p>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {/* Project picker */}
                          <div>
                            <label className="mb-1 block text-xs text-gray-400">Project</label>
                            <select
                              value={assignProjectId}
                              onChange={(e) => setAssignProjectId(e.target.value)}
                              className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-gold/60"
                            >
                              {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.sn ? `${p.sn} — ` : ""}{p.project_name || p.site_id || p.id}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Access type */}
                          <div>
                            <label className="mb-1 block text-xs text-gray-400">Access</label>
                            <select
                              value={accessScope}
                              onChange={(e) => {
                                setAccessScope(e.target.value as AccessScope);
                                setAssignStage("");
                                setAssignField("");
                              }}
                              className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-gold/60"
                            >
                              <option value="full_project">Full project</option>
                              <option value="whole_stage">Whole stage</option>
                              <option value="specific_field">Specific field</option>
                            </select>
                          </div>
                        </div>

                        {/* Stage picker */}
                        {(accessScope === "whole_stage" || accessScope === "specific_field") && (
                          <div>
                            <label className="mb-1 block text-xs text-gray-400">Stage</label>
                            <select
                              value={assignStage}
                              onChange={(e) => { setAssignStage(e.target.value); setAssignField(""); }}
                              className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-gold/60"
                            >
                              <option value="">— Select stage —</option>
                              {STAGE_ORDER.map((s) => (
                                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Field picker */}
                        {accessScope === "specific_field" && assignStage && (
                          <div>
                            <label className="mb-1 block text-xs text-gray-400">Field</label>
                            <select
                              value={assignField}
                              onChange={(e) => setAssignField(e.target.value)}
                              className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-gold/60"
                            >
                              <option value="">— Select field —</option>
                              {stageFieldOptions.map((f) => (
                                <option key={f.key} value={f.key}>{f.label}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Allow editing */}
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={assignCanEdit}
                            onChange={(e) => setAssignCanEdit(e.target.checked)}
                            className="accent-gold h-4 w-4"
                          />
                          Allow editing
                        </label>

                        <p className="text-[11px] text-gray-500">
                          Example: pick{" "}
                          <span className="text-gold">Stage 4 + RFS field</span> to let {m.full_name || m.email} edit only that field. Pick{" "}
                          <span className="text-gold">Full project</span> to grant access to all stages.
                        </p>

                        <div className="flex items-center gap-2 pt-1">
                          <Button variant="primary" onClick={handleAssign} disabled={
                            assignSaving ||
                            !assignProjectId ||
                            (accessScope !== "full_project" && !assignStage) ||
                            (accessScope === "specific_field" && !assignField)
                          }>
                            {assignSaving ? "Saving…" : "Assign"}
                          </Button>
                          <Button variant="ghost" onClick={cancelAssign}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => openAssign(m.id)}
                        className="flex items-center gap-1.5 text-xs text-gold hover:text-gold/80 transition-colors"
                      >
                        <Plus size={13} /> Assign project access
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Member Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Team Member"
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddMember} disabled={!email || saving}>
              {saving ? "Adding…" : "Add Member"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Email" value={email} onChange={setEmail} type="email" placeholder="engineer@company.com" required />
          <Input label="Full Name" value={fullName} onChange={setFullName} placeholder="Jane Doe" />
          <Input label="Phone" value={phone} onChange={setPhone} placeholder="+966 5X XXX XXXX" />
          <div className="space-y-2 pt-1">
            <p className="text-xs font-medium text-gray-400">Global Permissions</p>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={canView} onChange={(e) => setCanView(e.target.checked)} className="accent-gold h-4 w-4" />
              View all projects
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={canEdit} onChange={(e) => setCanEdit(e.target.checked)} className="accent-gold h-4 w-4" />
              Edit all stages
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={canAdd} onChange={(e) => setCanAdd(e.target.checked)} className="accent-gold h-4 w-4" />
              Add projects
            </label>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-300 animate-slide-in">
          {toast}
        </div>
      )}
    </div>
  );
}
