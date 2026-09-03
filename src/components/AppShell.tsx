import { useState, useRef, useEffect, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FolderKanban, LayoutDashboard, Users, CircleUser as UserCircle, LogOut, Menu, X, Phone, Mail, Settings, Bell, Trash2, Waves, PauseCircle } from "lucide-react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

interface AppShellProps {
  children: ReactNode;
}

interface NotificationRow {
  id: string;
  project_id: string | null;
  project_name: string | null;
  actor_name: string;
  message: string;
  created_at: string;
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

function FiberBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, #1a4fa8 0%, #0d2a6b 35%, #071640 68%, #030a24 100%)",
        }}
      />
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 1600 900">
        <defs>
          <radialGradient id="fiberGlow" cx="50%" cy="42%" r="50%">
            <stop offset="0%" stopColor="#bfe8ff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#bfe8ff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="800" cy="380" rx="420" ry="300" fill="url(#fiberGlow)" />

        <g stroke="#7fd0ff" strokeLinecap="round" opacity="0.55">
          <line x1="800" y1="380" x2="100" y2="20" strokeWidth="1.5" />
          <line x1="800" y1="380" x2="300" y2="-60" strokeWidth="1" />
          <line x1="800" y1="380" x2="550" y2="-90" strokeWidth="1.5" />
          <line x1="800" y1="380" x2="800" y2="-100" strokeWidth="1" />
          <line x1="800" y1="380" x2="1050" y2="-90" strokeWidth="1.5" />
          <line x1="800" y1="380" x2="1300" y2="-60" strokeWidth="1" />
          <line x1="800" y1="380" x2="1500" y2="20" strokeWidth="1.5" />
          <line x1="800" y1="380" x2="-80" y2="250" strokeWidth="1.5" />
          <line x1="800" y1="380" x2="-80" y2="550" strokeWidth="1" />
          <line x1="800" y1="380" x2="50" y2="850" strokeWidth="1.5" />
          <line x1="800" y1="380" x2="350" y2="920" strokeWidth="1" />
          <line x1="800" y1="380" x2="800" y2="950" strokeWidth="1.5" />
          <line x1="800" y1="380" x2="1250" y2="920" strokeWidth="1" />
          <line x1="800" y1="380" x2="1550" y2="850" strokeWidth="1.5" />
          <line x1="800" y1="380" x2="1680" y2="550" strokeWidth="1" />
          <line x1="800" y1="380" x2="1680" y2="250" strokeWidth="1.5" />
        </g>

        <g stroke="#f0803c" strokeLinecap="round" opacity="0.4">
          <line x1="800" y1="380" x2="200" y2="140" strokeWidth="1.2" />
          <line x1="800" y1="380" x2="900" y2="-80" strokeWidth="1" />
          <line x1="800" y1="380" x2="1400" y2="180" strokeWidth="1.2" />
          <line x1="800" y1="380" x2="1300" y2="780" strokeWidth="1" />
          <line x1="800" y1="380" x2="500" y2="880" strokeWidth="1.2" />
          <line x1="800" y1="380" x2="60" y2="620" strokeWidth="1" />
        </g>

        <g fill="#ffffff">
          <circle cx="250" cy="120" r="2.4" className="fiber-dot fiber-dot-1" />
          <circle cx="1300" cy="180" r="2" className="fiber-dot fiber-dot-2" />
          <circle cx="1420" cy="520" r="2.6" className="fiber-dot fiber-dot-3" />
          <circle cx="380" cy="660" r="2.2" className="fiber-dot fiber-dot-4" />
          <circle cx="960" cy="760" r="2.4" className="fiber-dot fiber-dot-1" />
          <circle cx="120" cy="400" r="2" className="fiber-dot fiber-dot-2" />
          <circle cx="1520" cy="300" r="2.4" className="fiber-dot fiber-dot-3" />
        </g>
        <g fill="#ffb27a">
          <circle cx="700" cy="60" r="2" className="fiber-dot fiber-dot-2" />
          <circle cx="1100" cy="700" r="2.2" className="fiber-dot fiber-dot-4" />
        </g>
      </svg>
      <style>{`
        @keyframes fiberTwinkle {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }
        .fiber-dot { animation: fiberTwinkle 2.2s ease-in-out infinite; }
        .fiber-dot-2 { animation-duration: 2.6s; animation-delay: 0.4s; }
        .fiber-dot-3 { animation-duration: 1.9s; animation-delay: 0.8s; }
        .fiber-dot-4 { animation-duration: 2.4s; animation-delay: 1.2s; }
      `}</style>
    </div>
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

  const [bgTheme, setBgTheme] = useState<"dark" | "fiber">(() => {
    if (typeof window === "undefined") return "fiber";
    return (localStorage.getItem("stages_bg_theme") as "dark" | "fiber") || "fiber";
  });

  function toggleBgTheme() {
    setBgTheme((prev) => {
      const next = prev === "dark" ? "fiber" : "dark";
      localStorage.setItem("stages_bg_theme", next);
      return next;
    });
  }

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isGuest || !user) return;

    async function loadNotifications() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      const list = (data as NotificationRow[]) ?? [];
      setNotifications(list);
      const lastSeen = localStorage.getItem(`notif_last_seen_${user!.id}`);
      const unread = lastSeen ? list.filter((n) => new Date(n.created_at) > new Date(lastSeen)).length : list.length;
      setUnreadCount(unread);
    }
    loadNotifications();

    const channel = supabase
      .channel("notifications_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        setNotifications((prev) => [payload.new as NotificationRow, ...prev].slice(0, 30));
        setUnreadCount((c) => c + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isGuest, user]);

  function openNotifications() {
    setNotifOpen((v) => !v);
    if (!notifOpen && user) {
      localStorage.setItem(`notif_last_seen_${user.id}`, new Date().toISOString());
      setUnreadCount(0);
    }
  }

  async function clearNotifications() {
    const ids = notifications.map((n) => n.id);
    if (ids.length === 0) return;
    await supabase.from("notifications").delete().in("id", ids);
    setNotifications([]);
    setUnreadCount(0);
  }

  function timeAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  async function handleSignOut() {
    setUserMenuOpen(false);
    await signOut();
    navigate("/");
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
    <div className={`relative flex min-h-screen flex-col ${bgTheme === "fiber" ? "" : "bg-ink-900"}`}>
      {bgTheme === "fiber" && <FiberBackground />}
      {/* ── Top header ── */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-ink-700 bg-ink-800 px-4 md:px-6">

        {/* Left: Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center justify-center rounded-lg bg-[#0d1f3c] p-1.5">
            <StagesLogo size={26} />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-extrabold leading-none tracking-[0.18em] text-white">STAGES</p>
            <p className="text-[9px] tracking-wide text-gold leading-tight">Infrastructure Projects Tracker</p>
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

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-2 shrink-0">
                    {/* Background theme toggle */}
          <button
            onClick={toggleBgTheme}
            title={bgTheme === "fiber" ? "Switch to classic background" : "Switch to fiber background"}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-700 bg-ink-900/60 text-gray-300 transition-all hover:border-gold/30 hover:text-white"
          >
            <Waves size={14} />
          </button>

   {/* On Hold tracker */}
          <button
            onClick={() => navigate("/onhold")}
            title="On Hold"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-700 bg-ink-900/60 text-gray-300 transition-all hover:border-gold/30 hover:text-white"
          >
  <PauseCircle size={14} />
          </button>

                    {/* Notifications bell */}
          <div ref={notifRef} className="relative">
              <button
                onClick={openNotifications}
                className="relative flex items-center justify-center rounded-lg border border-ink-700 bg-ink-900/60 p-2 text-gray-300 transition-all hover:border-gold/30 hover:text-white"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-80 max-h-96 overflow-y-auto rounded-xl border border-ink-700 bg-ink-800 shadow-xl">
                  <div className="sticky top-0 border-b border-ink-700 bg-ink-800 px-4 py-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Notifications</p>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-rose-300 transition-colors"
                        title="Clear all notifications"
                      >
                        <Trash2 size={13} /> Clear
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-gray-500">No notifications yet.</p>
                  ) : (
                    <div className="divide-y divide-ink-700/60">
                      {notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => { setNotifOpen(false); if (n.project_id) navigate(`/projects/${n.project_id}`); }}
                          className="flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left hover:bg-ink-700/40 transition-colors"
                        >
                          <p className="text-xs text-gray-200">
                            <span className="font-semibold text-gold">{n.actor_name}</span> {n.message}
                          </p>
                          {n.project_name && <p className="text-[11px] text-gray-500 truncate w-full">{n.project_name}</p>}
                          <p className="text-[10px] text-gray-600">{timeAgo(n.created_at)}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
         </div>

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
              }
            </button>
</div>
          )}
          
            {/*userMenuOpen && */} 
              <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border border-ink-700 bg-ink-800 shadow-xl overflow-hidden">
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
      <main className="relative z-10 flex-1 overflow-y-auto">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-ink-700/50 bg-ink-800/40 py-6 text-center">
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