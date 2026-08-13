import { useState, useRef, useEffect, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FolderKanban, LayoutDashboard, Users, UserCircle, LogOut, Menu, X, FileSpreadsheet, Phone, Mail, Settings } from "lucide-react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { computeProgress, currentStage, stageShortLabel } from "../lib/stages";
import { DEMO_PROJECT } from "../lib/demoProject";
import type { Project } from "../lib/types";

interface AppShellProps {
  children: ReactNode;
}

function StagesLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      <defs>
        <linearGradient id="shell-logo-g" x1="0" y1="0" x2="1" y2="1">
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
        stroke="url(#shell-logo-g)"
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="252" cy="124" r="16" fill="#f0b429" />
      <circle cx="252" cy="348" r="16" fill="#1a4abf" />
    </svg>
  );
}

const centerNav = [
  { to: "/theprojects", label: "The Projects", icon: FolderKanban },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/team", label: "Team", icon: Users },
];

export function AppShell({ children }: AppShellProps) {
  const { user, profile, isGuest, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSignOut() {
    setUserMenuOpen(false);
    await signOut();
    navigate("/");
  }

  async function exportCSV() {
    if (isGuest) {
      const projects = [DEMO_PROJECT];
      const headers = ["SN", "Project Name", "Site ID", "PO Number", "Plan No", "PO Value SAR", "Status", "Progress %", "Current Stage"];
      const rows = projects.map((p) => [
        p.sn, p.project_name, p.site_id, p.po_number, p.plan_no,
        p.po_value_sar, p.status,
        computeProgress(p), stageShortLabel(currentStage(p)),
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
      return;
    }
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    const projects = (data as Project[]) ?? [];
    const headers = ["SN", "Project Name", "Site ID", "PO Number", "Plan No", "PO Value SAR", "Status", "Progress %", "Current Stage"];
    const rows = projects.map((p) => [
      p.sn, p.project_name, p.site_id, p.po_number, p.plan_no,
      p.po_value_sar, p.status,
      computeProgress(p), stageShortLabel(currentStage(p)),
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

  const displayName = isGuest ? "Guest" : (profile?.full_name || "User");
  const displayRole = isGuest ? "guest" : (profile?.role || "engineer");
  const initials = isGuest ? "G" : (profile?.full_name || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-ink-900">
      {/* ── Top header ── */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-ink-700 bg-ink-800 px-4 md:px-6">

        {/* Left: Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center justify-center rounded-lg bg-[#0d1f3c] p-1.5">
            <StagesLogo size={26} />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-extrabold leading-none tracking-[0.18em] text-white">STAGES</p>
            <p className="text-[9px] tracking-wide text-gold leading-tight">Infrastructure Project Tracker</p>
          </div>
        </div>

        {/* Center: Nav (desktop) */}
        <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1 rounded-full bg-ink-900/60 p-1">
          {centerNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-gold text-ink-900 shadow"
                      : "text-gray-400 hover:text-white"
                  }`
                }
              >
                <Icon size={14} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Right: Export + User */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportCSV}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-900/60 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-all hover:border-gold/30 hover:text-white"
          >
            <FileSpreadsheet size={13} />
            Export CSV
          </button>

          {/* User menu */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-900/60 px-2.5 py-1.5 transition-all hover:border-gold/30"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-ink-900">
                {initials}
              </span>
              <span className="hidden sm:block text-right">
                <p className="text-xs font-semibold leading-none text-white">{displayName}</p>
                <p className="text-[10px] capitalize text-gold leading-tight">{displayRole}</p>
              </span>
              <svg width="10" height="10" viewBox="0 0 10 10" className="text-gray-500 hidden sm:block">
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
              </svg>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border border-ink-700 bg-ink-800 shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-ink-700">
                  <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{isGuest ? "Guest mode — read-only demo" : user?.email}</p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate("/profile"); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-gray-300 transition-colors hover:bg-ink-700 hover:text-white"
                  >
                    <Settings size={15} className="text-gray-400" />
                    Account Settings
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-rose-300 transition-colors hover:bg-rose-500/10"
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-gray-400 hover:text-white md:hidden"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-64 border-l border-ink-700 bg-ink-800 animate-slide-in flex flex-col">
            <div className="flex items-center justify-between border-b border-ink-700 px-4 py-4">
              <span className="font-bold tracking-widest text-white text-sm">STAGES</span>
              <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {centerNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                        isActive ? "bg-gold text-ink-900" : "text-gray-400 hover:bg-ink-700 hover:text-white"
                      }`
                    }
                  >
                    <Icon size={17} />
                    {item.label}
                  </NavLink>
                );
              })}
              <NavLink
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    isActive ? "bg-gold text-ink-900" : "text-gray-400 hover:bg-ink-700 hover:text-white"
                  }`
                }
              >
                <UserCircle size={17} />
                Profile
              </NavLink>
            </nav>
            <div className="border-t border-ink-700 p-3 space-y-1">
              <button
                onClick={() => { setMobileOpen(false); exportCSV(); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-300 hover:bg-ink-700 hover:text-white"
              >
                <FileSpreadsheet size={17} />
                Export CSV
              </button>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-500/10"
              >
                <LogOut size={17} />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Page content ── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-ink-700/50 bg-ink-800/40 py-6 text-center">
        <div className="mb-3 flex flex-col items-center gap-1">
          <div className="flex flex-col items-center justify-center rounded-xl bg-[#0d1f3c] px-3 py-2 shadow">
            <StagesLogo size={28} />
            <span className="mt-0.5 text-[9px] font-bold tracking-[0.3em] text-gold">STAGES</span>
          </div>
        </div>
        <p className="text-sm text-gray-400">
          Created by: <span className="font-bold text-gold">Eng. BACHIR ALARHABI</span>
        </p>
        <p className="text-xs text-gray-500 mt-0.5">Founder &amp; Solution Architect</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Phone size={11} />
            Contact us: <span className="font-semibold text-gold">+966536765870</span>
          </span>
          <span className="text-gold/30">·</span>
          <span className="flex items-center gap-1.5">
            <Mail size={11} />
            Email: <a href="mailto:infostages20@gmail.com" className="font-semibold text-gold hover:underline">infostages20@gmail.com</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
