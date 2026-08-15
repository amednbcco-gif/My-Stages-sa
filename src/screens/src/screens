import { useState } from "react";
import { Lock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Spinner } from "../components/ui";

export function ResetPasswordScreen() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    const { error } = await updatePassword(newPassword);
    setBusy(false);

    if (error) {
      setError(error);
    } else {
      setDone(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-ink-700/60 bg-ink-800/90 p-7 shadow-2xl">
          <h1 className="mb-1 text-lg font-bold text-white">Set a new password</h1>
          <p className="mb-5 text-sm text-gray-400">
            Choose a new password for your account.
          </p>

          {done ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-300">
              Password updated successfully. Redirecting…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-900/60 px-4 py-3.5 focus-within:border-gold/50 transition-colors">
                <Lock size={17} className="shrink-0 text-gray-500" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  required
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-900/60 px-4 py-3.5 focus-within:border-gold/50 transition-colors">
                <Lock size={17} className="shrink-0 text-gray-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gold py-3.5 text-sm font-bold text-ink-900 shadow-md transition-all hover:brightness-110 disabled:opacity-60"
              >
                {busy ? (
                  <Spinner size={18} />
                ) : (
                  <>
                    Update Password
                    <ArrowRight size={17} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
