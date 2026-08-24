import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, Lock, Phone, Mail, Users } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Button, Input, Spinner } from "../components/ui";
import { Modal } from "../components/Modal";
import { MILESTONES } from "../lib/stages";
import type { TeamMember, ProjectPermission, Project } from "../lib/types";

function milestoneLabel(title: string): string {
  const englishOnly = title.replace(/[\u0600-\u06FF].*$/, "").trim();
  return `${englishOnly} Status`;
}

export function TeamScreen() {
  const { user, profile } = useAuth();
  const isManager = profile?.role === "manager";
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestonePerms, setMilestonePerms] = useState<ProjectPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Add member modal
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [canAdd, setCanAdd] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  // Assign milestones access (inline per member)
  const [assignMemberId, setAssignMemberId] = useState<string | null>(null);
  const [assignMilestoneIds, setAssignMilestoneIds] = useState<string[]>([]);
  const [assignSaving, setAssignSaving] = useState(false);

  async function load() {
    setLoading(true);
    if (isManager) {
      const [membersRes, projectsRes, permsRes] = await Promise.all([
        supabase.from("team_members").select("*").order("created_at", { ascending: false }),
        supabase.from("projects").select("id,project_name,sn,site_id").order("created_at", { ascending: false }),
        supabase.from("project_permissions").select("*").order("created_at", { ascending: false }),
      ]);
      setMembers((membersRes.data as TeamMember[]) ?? []);
      setProjects((projectsRes.data as Project[]) ?? []);
      setMilestonePerms((permsRes.data as ProjectPermission[]) ?? []);
    } else {
      // Engineers only see their own team member record
      const { data } = await supabase
        .from("team_members")
        .select("*")
        .eq("user_id", user?.id ?? "")
        .maybeSingle();
      setMembers(data ? [data as TeamMember] : []);
    }
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
    setCanEdit(false);
  }

  async function handleAddMember() {
    if (!email) return;
    setSaving(true);
    const cleanEmail = email.toLowerCase().trim();
    const { error } = await supabase.from("team_members").insert({
      owner_id: user?.id,
      email: cleanEmail,
      full_name: fullName,
      phone,
      can_add_projects: canAdd,
      can_view_all: true,
      can_edit_all: canEdit,
    });
    if (error) {
      setSaving(false);
      return;
    }

    // Create auth account + send verification code
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-member`;
      const res = await fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email: cleanEmail, full_name: fullName }),
      });
      const fnData = await res.json();
      if (!res.ok) {
        setToast(`Member added, but verification email may not have sent: ${fnData.error ?? "unknown error"}`);
      } else {
        setToast(`${fullName || cleanEmail} added — verification code sent to their email.`);
      }
    } catch {
      setToast(`${fullName || cleanEmail} added to team, but verification email could not be sent.`);
    }
    setSaving(false);
    setShowAdd(false);
    resetAddForm();
    load();
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
    // Expand the row and open the assign panel, preloading this member's current milestones
    setExpanded(memberId);
    setAssignMemberId(memberId);
    setAssignMilestoneIds(memberMilestonePerms(memberId).map((p) => p.field));
  }

  function cancelAssign() {
    setAssignMemberId(null);
  }

  function toggleMilestone(id: string) {
    setAssignMilestoneIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleAssignMilestones() {
    if (!assignMemberId) return;
    setAssignSaving(true);

    // Clear this member's previous milestone-based (field-scope) permissions across all projects
    await supabase
      .from("project_permissions")
      .delete()
      .eq("team_member_id", assignMemberId)
      .eq("scope", "field");

    if (assignMilestoneIds.length > 0 && projects.length > 0) {
      const rows = projects.flatMap((proj) =>
        assignMilestoneIds.map((milestoneId) => {
          const ms = MILESTONES.find((m) => m.id === milestoneId);
          return {
            owner_id: user?.id,
            team_member_id: assignMemberId,
            project_id: proj.id,
            scope: "field",
            stage: ms?.stage ?? "",
            field: milestoneId,
            can_edit: true,
          };
        })
      );
      await supabase.from("project_permissions").insert(rows);
    }

    setAssignSaving(false);
    setToast("Milestone access updated across all your current projects.");
    setAssignMemberId(null);
    load();
  }

  function memberMilestonePerms(memberId: string) {
    const rows = milestonePerms.filter((p) => p.team_member_id === memberId && p.scope === "field");
    const seen = new Set<string>();
    return rows.filter((p) => {
      if (seen.has(p.field)) return false;
      seen.add(p.field);
      return true;
    });
  }
  const canEditCount = members.filter((m) => m.can_edit_all).length;
  const canAddCount  = members.filter((m) => m.can_add_projects).length;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Users size={22} className="text-gold" /> {isManager ? "My Team" : "My Profile"}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {isManager
              ? "Add your engineers & staff, control who can view or edit your projects, and assign them to specific stages or fields."
              : "View your team membership and assigned milestone permissions."}
          </p>
        </div>
        {isManager && (
          <Button variant="primary" onClick={() => { resetAddForm(); setShowAdd(true); }}>
            <Plus size={16} className="mr-1.5" /> Add Member
          </Button>
        )}
      </div>

      {/* Stat boxes — manager only */}
      {isManager && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-ink-700 bg-ink-800 px-5 py-4">
            <p className="text-sm text-gray-400">Can view all your projects</p>
            <p className="mt-1 text-3xl font-bold text-white">{(members || []).filter(m => m.can_view_all || true).length}</p>
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
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={32} />
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-xl border border-ink-700 bg-ink-800 py-16 text-center">
          <p className="text-gray-400">{isManager ? "No team members yet. Add your first team member to get started." : "You are not linked to any team yet."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m) => {
            const isOpen = expanded === m.id;
            const perms = memberMilestonePerms(m.id);
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
                      {isPending && isManager && (
                        <button
                          onClick={() => openAssign(m.id)}
                          className="flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[11px] font-medium text-gold hover:bg-gold/20 transition-colors"
                        >
                          <Lock size={10} /> Pending signup
                        </button>
                      )}
                      {isPending && isManager && (
                        <button
                          onClick={async () => {
                            try {
                              const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-member`;
                              const res = await fetch(fnUrl, {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                                },
                                body: JSON.stringify({ email: m.email, full_name: m.full_name }),
                              });
                              const fnData = await res.json();
                              if (res.ok) setToast("Verification code re-sent to " + m.email);
                              else setToast("Could not resend: " + (fnData.error ?? "unknown error"));
                            } catch {
                              setToast("Could not resend verification code.");
                            }
                          }}
                          className="flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-400/10 px-2.5 py-0.5 text-[11px] font-medium text-sky-300 hover:bg-sky-400/20 transition-colors"
                        >
                          <Mail size={10} /> Resend code
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

                    <p className="mt-2 text-xs text-gray-500">{perms.length} milestone edit permission{perms.length !== 1 ? "s" : ""}</p>
                  </div>

                  {/* Delete — manager only */}
                  {isManager && (
                    <button
                      onClick={() => handleDeleteMember(m)}
                      className="flex-shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {/* Expanded body */}
                {isOpen && (
                  <div className="border-t border-ink-700 px-4 pb-4 pt-3 space-y-4">
                    {/* Existing milestone permissions list */}
                    {perms.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {perms.map((p) => {
                          const ms = MILESTONES.find((x) => x.id === p.field);
                          return (
                            <span
                              key={p.id}
                              className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs text-gold"
                            >
                              {ms ? milestoneLabel(ms.title) : p.field}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Assign milestones access panel — manager only */}
                    {isAssigning ? (
                      <div className="rounded-xl border border-ink-600 bg-ink-900/60 p-4 space-y-4">
                        <p className="text-sm font-semibold text-white">Assign milestones access</p>
                        <p className="text-[11px] text-gray-500">
                          {m.full_name || m.email} already sees all your projects. Check the milestones below to also let them edit that milestone across all your <span className="text-gold">current</span> projects. If you add a new project later, come back here and save again to extend access to it too.
                        </p>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {MILESTONES.map((ms) => (
                            <label
                              key={ms.id}
                              className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-gray-300 hover:border-gold/30 transition-colors cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={assignMilestoneIds.includes(ms.id)}
                                onChange={() => toggleMilestone(ms.id)}
                                className="accent-gold h-4 w-4"
                              />
                              {milestoneLabel(ms.title)}
                            </label>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <Button variant="primary" onClick={handleAssignMilestones} disabled={assignSaving}>
                            {assignSaving ? "Saving…" : "Save milestone access"}
                          </Button>
                          <Button variant="ghost" onClick={cancelAssign}>Cancel</Button>
                        </div>
                      </div>
                    ) : isManager ? (
                      <button
                        onClick={() => openAssign(m.id)}
                        className="flex items-center gap-1.5 text-xs text-gold hover:text-gold/80 transition-colors"
                      >
                        <Plus size={13} /> Assign milestones access
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Member Modal — manager only */}
      {isManager && (
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
            <p className="rounded-lg border border-ink-700 bg-ink-900/50 px-3 py-2 text-xs text-gray-400">
              This member will automatically be able to view all your projects. Use "Assign milestones access" after adding them to grant edit permission for specific milestones.
            </p>
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
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-300 animate-slide-in">
          {toast}
        </div>
      )}
    </div>
  );
}
