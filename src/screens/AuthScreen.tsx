import { useState } from "react";
import { Mail, Lock, ArrowRight, Phone, User, HardHat, Briefcase } from "lucide-react";
import { useAuth } from "../lib/auth";
import { Spinner } from "../components/ui";

function StagesLogoIcon({ size = 52 }: { size?: number }) {
  const id = `lg-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0b429" />
          <stop offset="1" stopColor="#d4af37" />
        </linearGradient>
      </defs>
      <path
        d="M312 168 C312 140 288 124 252 124 C214 124 192 142 192 168
           C192 192 210 204 248 212 L276 218
           C322 228 344 246 344 282
           C344 322 308 348 252 348
           C196 348 160 322 160 278"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="252" cy="124" r="16" fill="#f0b429" />
      <circle cx="252" cy="348" r="16" fill="#1a4abf" />
    </svg>
  );
}

export function AuthScreen() {
  const { signIn, signUp, signInGuest } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("manager");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    if (mode === "signin") {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      const { error } = await signUp(email, password, fullName, role);
      if (error) setError(error);
      else setInfo("Account created! You can now sign in.");
    }
    setBusy(false);
  }

  function handleGuest() {
    signInGuest();
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-ink-900 px-4">

      {/* Top: Logo + Title */}
      <div className="flex flex-col items-center gap-3 pt-10 pb-6">
        {/* Logo box — no border, darker bg, big S */}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-[#0d1f3c] px-4 py-3 shadow-2xl">
          <StagesLogoIcon size={64} />
          <span className="mt-1 text-[10px] font-bold tracking-[0.3em] text-gold">STAGES</span>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-[0.15em] text-white">STAGES</h1>
          <p className="mt-0.5 text-sm font-medium tracking-wide text-gold">
            Infrastructure Project Tracker
          </p>
        </div>
      </div>

      {/* Auth card */}
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-ink-700/60 bg-ink-800/90 p-7 shadow-2xl">

          {/* Tab switcher */}
          <div className="mb-5 flex rounded-full bg-ink-900/70 p-1">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(null); setInfo(null); }}
              className={`flex-1 rounded-full py-2.5 text-sm font-bold transition-all duration-200 ${
                mode === "signin"
                  ? "bg-gold text-ink-900 shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); setInfo(null); }}
              className={`flex-1 rounded-full py-2.5 text-sm font-bold transition-all duration-200 ${
                mode === "signup"
                  ? "bg-gold text-ink-900 shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Sign Up extras */}
            {mode === "signup" && (
              <div className="flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-900/60 px-4 py-3.5 focus-within:border-gold/50 transition-colors">
                <User size={17} className="shrink-0 text-gray-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  required
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                />
              </div>
            )}

            {/* Email */}
            <div className="flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-900/60 px-4 py-3.5 focus-within:border-gold/50 transition-colors">
              <Mail size={17} className="shrink-0 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
              />
            </div>

            {/* Password */}
            <div className="flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-900/60 px-4 py-3.5 focus-within:border-gold/50 transition-colors">
              <Lock size={17} className="shrink-0 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
              />
            </div>

            {/* Account type pill switcher — only on Sign Up */}
            {mode === "signup" && (
              <div className="pt-1">
                <p className="mb-2 text-xs font-medium text-gray-400">Account Type</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("engineer")}
                    className={`flex flex-col items-center gap-2 rounded-2xl border py-4 text-sm font-bold transition-all duration-200 ${
                      role === "engineer"
                        ? "border-gold bg-gold text-ink-900 shadow-md"
                        : "border-ink-700 bg-ink-900/40 text-gray-300 hover:border-gold/30 hover:text-white"
                    }`}
                  >
                    <HardHat size={22} />
                    Site Engineer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("manager")}
                    className={`flex flex-col items-center gap-2 rounded-2xl border py-4 text-sm font-bold transition-all duration-200 ${
                      role === "manager"
                        ? "border-gold bg-gold text-ink-900 shadow-md"
                        : "border-ink-700 bg-ink-900/40 text-gray-300 hover:border-gold/30 hover:text-white"
                    }`}
                  >
                    <Briefcase size={22} />
                    Manager
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {role === "manager"
                    ? "Managers can view all projects, edit any stage, and add notes."
                    : "Site Engineers manage their own project stages and progress."}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-gold">
                  <Mail size={11} />
                  We'll email you a 6-digit code to verify your address.
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {error}
              </div>
            )}
            {info && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                {info}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gold py-3.5 text-sm font-bold text-ink-900 shadow-md transition-all hover:brightness-110 disabled:opacity-60"
            >
              {busy ? (
                <Spinner size={18} />
              ) : (
                <>
                  {mode === "signin" ? "Sign In" : "Create Account"}
                  <ArrowRight size={17} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-ink-700" />
            <span className="text-xs text-gray-500">or</span>
            <div className="h-px flex-1 bg-ink-700" />
          </div>

          {/* Continue as Guest */}
          <button
            type="button"
            onClick={handleGuest}
            className="w-full rounded-2xl border border-ink-700 bg-ink-900/40 py-3.5 text-sm font-bold text-gray-300 transition-all hover:border-gold/30 hover:text-white"
          >
            Continue as Guest
          </button>
        </div>
      </div>

      {/* Spacer to push footer down */}
      <div className="flex-1 min-h-10" />

      {/* Footer */}
      <footer className="flex flex-col items-center gap-2.5 pb-8 pt-10">
        {/* Small logo — no border */}
        <div className="flex flex-col items-center justify-center rounded-xl bg-[#0d1f3c] px-3 py-2.5 shadow-lg">
          <StagesLogoIcon size={32} />
          <span className="mt-0.5 text-[9px] font-bold tracking-[0.3em] text-gold">STAGES</span>
        </div>

        <p className="text-sm text-gray-400">
          Created by:{" "}
          <span className="font-bold text-gold">Eng. BACHIR ALARHABI</span>
        </p>
        <p className="text-xs text-gray-500">Founder &amp; Solution Architect</p>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Phone size={11} />
            Contact us:{" "}
            <span className="font-semibold text-gold">+966536765870</span>
          </span>
          <span className="text-gold/30">·</span>
          <span className="flex items-center gap-1.5">
            <Mail size={11} />
            Email:{" "}
            <a
              href="mailto:infostages20@gmail.com"
              className="font-semibold text-gold hover:underline"
            >
              infostages20@gmail.com
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
