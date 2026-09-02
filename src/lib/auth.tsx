import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Profile } from "./types";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isGuest: boolean;
  enterGuestMode: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  verifySignupOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  resendSignupOtp: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  async function loadProfile(uid: string) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, created_at")
      .eq("id", uid)
      .maybeSingle();
    setProfile(data as Profile | null);
  }

  // Permanent fix: whenever a user is signed in, link any pending team_members
  // invitation (matched by email, still missing user_id) to this real account.
  // Safe to call every time — it only ever touches rows where user_id is null,
  // so it's a no-op for accounts that are already linked.
  async function linkPendingTeamMembership(u: User) {
    if (!u.email) return;
    const { error, count } = await supabase
      .from("team_members")
      .update({ user_id: u.id })
      .ilike("email", u.email)
      .is("user_id", null);
    if (error) {
      console.error("[linkPendingTeamMembership] failed:", error.message, error);
    } else {
      console.log("[linkPendingTeamMembership] rows updated:", count);
    }
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        linkPendingTeamMembership(s.user);
        loadProfile(s.user.id).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      (async () => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await linkPendingTeamMembership(s.user);
          await loadProfile(s.user.id);
        } else {
          setProfile(null);
        }
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function refreshProfile() {
    if (user) await loadProfile(user.id);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string, fullName: string, role: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) return { error: error.message };
    return { error: null };
  }

   async function signOut() {
    setIsGuest(false);
    await supabase.auth.signOut();
    setProfile(null);
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message ?? null };
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  }

  async function verifySignupOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
    if (error) return { error: error.message };
    const u = data.user;
    if (u) {
      const meta = (u.user_metadata ?? {}) as { full_name?: string; role?: string };
      await supabase.from("profiles").upsert({
        id: u.id,
        full_name: meta.full_name ?? "",
        role: meta.role ?? "engineer",
      });
    }
    return { error: null };
  }

  async function resendSignupOtp(email: string) {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    return { error: error?.message ?? null };
  }

    function enterGuestMode() {
    setIsGuest(true);
  }

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, isGuest, enterGuestMode, signIn, signUp, signOut, refreshProfile, resetPassword, updatePassword, verifySignupOtp, resendSignupOtp }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
