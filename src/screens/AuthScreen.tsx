import { useState, useEffect } from "react";
import { Mail, Lock, ArrowRight, Phone, User, HardHat, Briefcase, X } from "lucide-react";
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
  const { signIn, signUp, enterGuestMode, resetPassword, verifySignupOtp, resendSignupOtp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("manager");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpResendMsg, setOtpResendMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  function startCooldown(seconds = 60) {
    setResendCooldown(seconds);
  }

  function parseRateLimitError(msg: string): string {
    const match = msg.match(/after (\d+) seconds/i);
    if (match) {
      const secs = parseInt(match[1], 10);
      startCooldown(secs);
      return `Please wait ${secs} seconds before requesting a new code.`;
    }
    return msg;
  }

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
      else {
        setOtpStep(true);
        setOtpCode("");
        setOtpError(null);
        startCooldown(60);
      }
    }
    setBusy(false);
  }

  ffunction handleGuest() {
    enterGuestMode();
    navigate("/dashboard");
  }

  function openForgotModal() {
    setResetEmail(email);
    setResetError(null);
    setResetSent(false);
    setShowForgotModal(true);
  }

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResetError(null);
    setResetBusy(true);
    const { error } = await resetPassword(resetEmail);
    setResetBusy(false);
    if (error) {
      setResetError(error);
    } else {
      setResetSent(true);
      setTimeout(() => {
        setShowForgotModal(false);
        setResetSent(false);
        setResetEmail("");
      }, 3000);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpError(null);
    setOtpBusy(true);
    const { error } = await verifySignupOtp(email, otpCode);
    setOtpBusy(false);
    if (error) {
      setOtpError(error);
    }
    // On success, the auth listener picks up the new session automatically
    // and the app navigates in — nothing else to do here.
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    setOtpError(null);
    setOtpResendMsg(null);
    const { error } = await resendSignupOtp(email);
    if (error) {
      setOtpError(parseRateLimitError(error));
    } else {
      setOtpResendMsg("A new code has been sent.");
      startCooldown(60);
    }
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
            Infrastructure Projects Tracker
          </p>
        </div>
      </div>

      {/* Auth card */}
      <div className="--osc mx-auto justify-center flex flex-col items-center w-full">
        <div className="rounded-3xl border border-ink-700/60 bg-ink-800/90 p-7 shadow-2xl">

          {otpStep ? (
            <>
              <h2 className="mb-1 text-lg font-bold text-white">Verify your email</h2>
              <p className="mb-5 text-sm text-gray-400">
                Enter the verification code we sent to <span className="text-gold">{email}</span>
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={10}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  required
                  className="w-full rounded-2xl border border-ink-700 bg-ink-900/60 px-4 py-3.5 text-center text-xl tracking-[0.3em] text-white placeholder-gray-600 outline-none focus:border-gold/50 transition-colors"
                />

                {otpError && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                    {otpError}
                  </div>
                )}
                {otpResendMsg && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                    {otpResendMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={otpBusy || otpCode.length < 4}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gold py-3.5 text-sm font-bold text-ink-900 shadow-md transition-all hover:brightness-110 disabled:opacity-60"
                >
                  {otpBusy ? <Spinner size={18} /> : (<>Verify &amp; Continue<ArrowRight size={17} strokeWidth={2.5} /></>)}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  className="w-full text-center text-xs font-semibold text-gold hover:underline disabled:text-gray-600 disabled:no-underline"
                >
                  {resendCooldown > 0
                    ? `Resend available in ${resendCooldown}s`
                    : "Didn't get a code? Resend"}
                </button>

                <button
                  type="button"
                  onClick={() => { setOtpStep(false); setOtpCode(""); setOtpError(null); setOtpResendMsg(null); }}
                  className="w-full text-center text-xs text-gray-500 hover:text-gray-300"
                >
                  Back
                </button>
              </form>
            </>
          ) : (
          <>
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
            <div>
              {mode === "signin" && (
                <div className="mb-1.5 flex items-center justify-between px-1">
                  <span className="text-xs font-medium text-gray-400">Password</span>
                  <button
                    type="button"
                    onClick={openForgotModal}
                    className="text-xs font-semibold text-gold hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
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
            </div>

            {/* Account type pill switcher — only on Sign Up */}
            {mode === "signup" && (
              <div className="pt-1">
                <p className="mb-2 text-xs font-medium text-gray-400">Account Type</p>
                <div className="flex flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("engineer")}
                     className={`flex flex-1 flex-col items-center gap-2 rounded-xl border py-4 text-sm font-semibold transition-all ${
                    role === "engineer"
                      ? "border-gold bg-gold text-ink-900"
                      : "border-ink-600 bg-ink-900/40 text-gray-400 hover:border-ink-500 hover:text-white"
                    }`}
                  >
                    <HardHat size={20} />
                    Site Engineer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("manager")}
                    className={`flex flex-1 flex-col items-center gap-2 rounded-xl border py-4 text-sm font-semibold transition-all ${
                    role === "manager"
                      ? "border-gold bg-gold text-ink-900"
                      : "border-ink-600 bg-ink-900/40 text-gray-400 hover:border-ink-500 hover:text-white"
                    }`}
                  >
                    <Briefcase size={20} />
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
                  We'll email you a verification code to confirm your address.
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
          </>
          )}
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

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="--osc mx-auto justify-center flex flex-col items-center w-full">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Reset your password</h2>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {!resetSent ? (
              <form onSubmit={handleResetSubmit} className="space-y-3">
                <p className="text-xs text-gray-400">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <div className="flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-900/60 px-4 py-3.5 focus-within:border-gold/50 transition-colors">
                  <Mail size={17} className="shrink-0 text-gray-500" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                  />
                </div>

                {resetError && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                    {resetError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resetBusy}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-gold py-3.5 text-sm font-bold text-ink-900 shadow-md transition-all hover:brightness-110 disabled:opacity-60"
                >
                  {resetBusy ? <Spinner size={18} /> : "Send reset link"}
                </button>
              </form>
            ) : (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-300">
                Check your email — we've sent you a link to reset your password.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
