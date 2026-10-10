"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthUser, Gender } from "@/types";
import { clearSession, readSession, writeSession } from "@/lib/auth";
import { writeProfileEdits } from "@/lib/profile";
import { loadProfile } from "@/lib/profileSync";
import { supabase } from "@/lib/supabase";
import { resetRemotePosts } from "@/lib/postsSync";
import { resetRemotePhotos } from "@/lib/photosSync";
import { resetRemoteFriends, sendHeartbeat } from "@/lib/friendsSync";
import { resetRemoteMessages } from "@/lib/messagesSync";
import { resetRemoteNotices } from "@/lib/notificationsSync";
import { startRealtime } from "@/lib/realtime";
import { resetRemoteGroups } from "@/lib/groupsSync";
import { resetRemoteStories } from "@/lib/storiesSync";
import { resetRemoteGifts } from "@/lib/giftsSync";
import { resetRemoteVideos } from "@/lib/videosSync";
import { resetRemoteMusic } from "@/lib/musicSync";
import { startSettingsSync } from "@/lib/settingsSync";
import { checkBan, clearBan } from "@/lib/banSync";
import type { TranslationKey } from "@/i18n/LanguageProvider";

export type AuthResult = TranslationKey | null;
export type RegisterInput = { name: string; email: string; password: string; gender: Gender; birthday: string; city: string };
type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  requestReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);
const EPHEMERAL = "sitename-ephemeral";
const TAB_ALIVE = "sitename-tab";

function toKey(message: string): TranslationKey {
  const text = message.toLowerCase();
  if (text.includes("banned")) return "auth.errBanned";
  if (text.includes("invalid login")) return "auth.errCredentials";
  if (text.includes("already registered") || text.includes("already been registered")) return "auth.errExists";
  if (text.includes("rate limit") || text.includes("security purposes")) return "auth.errRate";
  if (text.includes("should be different")) return "auth.errSamePassword";
  return "auth.errGeneric";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setUser(readSession());
      setReady(true);
      return;
    }
    const client = supabase;
    // "Remember me" off: the session ends when the browser tab is closed.
    if (window.localStorage.getItem(EPHEMERAL) && !window.sessionStorage.getItem(TAB_ALIVE)) {
      window.localStorage.removeItem(EPHEMERAL);
      void client.auth.signOut();
    }
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      const account = session?.user;
      setUser(account ? { id: account.id, email: account.email ?? "", name: String(account.user_metadata?.name ?? "") } : null);
      setReady(true);
      if (account) window.setTimeout(() => void loadProfile(account.id), 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Keep the "online" mark fresh while the site is open.
  const accountId = user?.id;
  useEffect(() => {
    if (!supabase || !accountId) return;
    void sendHeartbeat();
    void checkBan();
    const timer = window.setInterval(() => {
      void sendHeartbeat();
      void checkBan();
    }, 60_000);
    const stopRealtime = startRealtime(accountId);
    const stopSettings = startSettingsSync(accountId);
    return () => {
      window.clearInterval(timer);
      stopRealtime();
      stopSettings();
    };
  }, [accountId]);

  const login = useCallback(async (email: string, password: string, remember: boolean): Promise<AuthResult> => {
    if (!supabase) {
      const account = { name: email.split("@")[0], email };
      writeSession(account, remember);
      setUser(account);
      return null;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return toKey(error.message);
    window.sessionStorage.setItem(TAB_ALIVE, "1");
    if (remember) window.localStorage.removeItem(EPHEMERAL);
    else window.localStorage.setItem(EPHEMERAL, "1");
    return null;
  }, []);

  const register = useCallback(async ({ password, ...input }: RegisterInput): Promise<AuthResult> => {
    if (!supabase) {
      writeProfileEdits({ ...input, handle: input.email.split("@")[0].toLowerCase(), status: "", bio: "", work: "", education: "", languages: [], interests: [], followers: 0, joined: new Date().toISOString().slice(0, 10) });
      writeSession({ name: input.name, email: input.email }, true);
      setUser({ name: input.name, email: input.email });
      return null;
    }
    const { name, gender, birthday, city, email } = input;
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, gender, birthday, city } } });
    if (error) return toKey(error.message);
    return data.session ? null : "auth.confirmEmail";
  }, []);

  const requestReset = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) return null;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    return error ? toKey(error.message) : null;
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    if (!supabase) return null;
    const { error } = await supabase.auth.updateUser({ password });
    return error ? toKey(error.message) : null;
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    resetRemotePosts();
    resetRemotePhotos();
    resetRemoteFriends();
    resetRemoteMessages();
    resetRemoteNotices();
    resetRemoteGroups();
    resetRemoteStories();
    resetRemoteGifts();
    clearBan();
    resetRemoteVideos();
    resetRemoteMusic();
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, login, register, requestReset, updatePassword, signOut }), [user, ready, login, register, requestReset, updatePassword, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
