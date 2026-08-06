import { useState, useEffect } from "react";
import { UserCircle, Lock, AlertTriangle, HardHat, Building2, Save, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Spinner } from "../components/ui";

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 z-[60] rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-300 animate-slide-in">
      {message}
    </div>
  );
}

export function ProfileScreen() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("engineer");
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [updatingPw, setUpdatingPw] = useState(false);
  const [pwError, setPwError] = useState("");

  const [deletingAccount, setDeletingAccount] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setRole(profile.role || "engineer");
    }
  }, [profile]);

  async function handleSaveProfile() {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, role })
      .eq("id", user?.id);
    if (!error) {
      setToast("Profile updated");
      await refreshProfile();
    }
    setSaving(false);
  }

  async function handleUpdatePassword() {
    if (newPassword.length < 6) {
      setPwError("Password must be at least 6 characters");
      return;
    }
    setPwError("");
    setUpdatingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwError(error.message);
    } else {
      setNewPassword("");
      setToast("Password updated");
    }
    setUpdatingPw(false);
  }

  async function handleDeleteAccount() {
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    setDeletingAccount(true);
    await supabase.from("profiles").delete().eq("id", user?.id);
    await signOut();
  }

  if (!profile) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <UserCircle size={30} className="text-white" />
          <h1 className="text-3xl font-bold text-white">Account Settings</h1>
        </div>
        <p className="mt-1 text-sm text-gray-400 ml-1">
          Update your name, account type, and password, or delete your account.
        </p>
      </div>

      <div className="max-w-2xl space-y-5">
        {/* Profile card */}
        <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6">
          <h2 className="mb-5 text-base font-semibold text-white">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Email</label>
              <input
                type="text"
                readOnly
                value={user?.email ?? ""}
                className="w-full rounded-lg border border-ink-700 bg-ink-900/50 px-3 py-2 text-sm text-gray-400 outline-none cursor-default"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-ink-700 bg-ink-900/50 px-3 py-2 text-sm text-white outline-none focus:border-gold/50 transition-colors"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-400">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRole("engineer")}
                  className={`flex flex-col items-center gap-2 rounded-xl border py-4 text-sm font-semibold transition-all ${
                    role === "engineer"
                      ? "border-gold bg-gold text-ink-900"
                      : "border-ink-600 bg-ink-900/40 text-gray-400 hover:border-ink-500 hover:text-white"
                  }`}
                >
                  <HardHat size={22} />
                  Site Engineer
                </button>
                <button
                  onClick={() => setRole("manager")}
                  className={`flex flex-col items-center gap-2 rounded-xl border py-4 text-sm font-semibold transition-all ${
                    role === "manager"
                      ? "border-gold bg-gold text-ink-900"
                      : "border-ink-600 bg-ink-900/40 text-gray-400 hover:border-ink-500 hover:text-white"
                  }`}
                >
                  <Building2 size={22} />
                  Manager
                </button>
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl border border-gold/60 bg-gold/90 px-5 py-2.5 text-sm font-semibold text-ink-900 transition-all hover:bg-gold disabled:opacity-60"
            >
              <Save size={15} />
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>

        {/* Change Password card */}
        <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6">
          <div className="mb-5 flex items-center gap-2">
            <Lock size={17} className="text-white" />
            <h2 className="text-base font-semibold text-white">Change Password</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPwError(""); }}
                placeholder="At least 6 characters"
                className="w-full rounded-lg border border-ink-700 bg-ink-900/50 px-3 py-2 text-sm text-white outline-none focus:border-gold/50 transition-colors placeholder:text-gray-600"
              />
              {pwError && <p className="mt-1 text-xs text-rose-400">{pwError}</p>}
            </div>
            <button
              onClick={handleUpdatePassword}
              disabled={updatingPw}
              className="flex items-center gap-2 rounded-xl border border-gold/60 bg-gold/90 px-5 py-2.5 text-sm font-semibold text-ink-900 transition-all hover:bg-gold disabled:opacity-60"
            >
              <RefreshCw size={15} />
              {updatingPw ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>

        {/* Danger Zone card */}
        <div className="rounded-2xl border border-rose-500/30 bg-ink-800 p-6">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle size={17} className="text-rose-400" />
            <h2 className="text-base font-semibold text-rose-400">Danger Zone</h2>
          </div>
          <p className="mb-5 text-xs text-gray-500 leading-relaxed">
            Deleting your account permanently removes you, your projects, notes, attachments, and team memberships.
            This cannot be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deletingAccount}
            className="flex items-center gap-2 rounded-xl border border-rose-500/40 px-5 py-2.5 text-sm font-semibold text-rose-400 transition-all hover:bg-rose-500/10 disabled:opacity-60"
          >
            <Trash2 size={15} />
            {deletingAccount ? "Deleting..." : "Delete My Account"}
          </button>
        </div>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
