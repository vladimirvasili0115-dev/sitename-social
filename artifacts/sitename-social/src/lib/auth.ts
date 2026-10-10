import type { AuthUser } from "@/types";

const STORAGE_KEY = "sitename-auth";
export const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

export const PUBLIC_ROUTES = ["/terms", "/privacy", "/reset-password"];
export const isPublicRoute = (pathname: string) => PUBLIC_ROUTES.includes(pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname);

export function isAuthRoute(pathname: string) {
  const clean = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return AUTH_ROUTES.includes(clean);
}

// Mock session: replace these three functions with real API calls when the backend exists.
export function readSession(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function writeSession(user: AuthUser, remember: boolean) {
  clearSession();
  const storage = remember ? window.localStorage : window.sessionStorage;
  storage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(STORAGE_KEY);
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export const MIN_PASSWORD_LENGTH = 6;

export function passwordScore(value: string): 0 | 1 | 2 | 3 {
  if (!value) return 0;
  if (value.length < MIN_PASSWORD_LENGTH) return 1;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((rule) => rule.test(value)).length;
  return value.length >= 10 && kinds >= 3 ? 3 : kinds >= 2 ? 2 : 1;
}
