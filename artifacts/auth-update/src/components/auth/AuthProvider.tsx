"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthUser } from "@/types";
import { clearSession, readSession, writeSession } from "@/lib/auth";

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  signIn: (user: AuthUser, remember?: boolean) => void;
  signOut: () => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setUser(readSession());
    setReady(true);
  }, []);
  const signIn = useCallback((next: AuthUser, remember = true) => {
    writeSession(next, remember);
    setUser(next);
  }, []);
  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);
  const value = useMemo(() => ({ user, ready, signIn, signOut }), [user, ready, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
