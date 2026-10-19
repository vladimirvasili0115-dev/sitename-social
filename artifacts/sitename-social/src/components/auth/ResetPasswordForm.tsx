"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { AuthField } from "./AuthField";
import { FormError } from "./FormError";
import { PasswordStrength } from "./PasswordStrength";
import { useAuth, type AuthResult } from "./AuthProvider";
import { supabase } from "@/lib/supabase";

export function ResetPasswordForm() {
  const { t } = useTranslation();
  const { user, ready, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"password" | "confirm", TranslationKey>>>({});
  const [failure, setFailure] = useState<AuthResult>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  // The e-mail link opens this page with a one-time key in the address. The page turns that key into a session
  // itself (both link styles Supabase sends), and waits for it instead of saying "expired" too early.
  const [linking, setLinking] = useState(true);
  const [linkError, setLinkError] = useState(false);
  useEffect(() => {
    if (!supabase) { setLinking(false); return; }
    const client = supabase;
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    if (hash.get("error") || query.get("error")) { setLinkError(true); setLinking(false); return; }
    void (async () => {
      try {
        const code = query.get("code");
        const access = hash.get("access_token");
        const refresh = hash.get("refresh_token");
        const tokenHash = query.get("token_hash");
        if (code) await client.auth.exchangeCodeForSession(code);
        else if (tokenHash) await client.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
        else if (access && refresh) { const now = await client.auth.getSession(); if (!now.data.session) await client.auth.setSession({ access_token: access, refresh_token: refresh }); }
      } catch { setLinkError(true); }
      const { data } = await client.auth.getSession();
      if (!data.session) setLinkError(true);
      setLinking(false);
    })();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: typeof errors = {};
    if (password.length < MIN_PASSWORD_LENGTH) found.password = "auth.errPassword";
    if (confirm !== password) found.confirm = "auth.errMatch";
    setErrors(found);
    if (Object.keys(found).length) return;
    setPending(true);
    const result = await updatePassword(password);
    setPending(false);
    setFailure(result);
    if (!result) setDone(true);
  }

  if (done) {
    return (
      <div role="status" className="py-2 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface-2 text-accent"><ShieldCheck size={24} /></span>
        <p className="mt-4 text-sm leading-6 text-text">{t("auth.resetDone")}</p>
        <Link href="/feed" className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-bg">{t("nav.feed")}</Link>
      </div>
    );
  }
  if (linking || (!ready && !linkError)) return <p role="status" className="py-4 text-center text-sm text-muted">{t("auth.wait")}</p>;
  if (!user && linkError) return <div className="space-y-3"><FormError message={t("auth.resetExpired")} /><Link href="/forgot-password" className="block text-center text-sm font-semibold text-accent">{t("auth.resetAgain")}</Link></div>;
  if (ready && !user) return <p role="status" className="py-4 text-center text-sm text-muted">{t("auth.wait")}</p>;
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <AuthField label={t("settings.secNew")} icon={Lock} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password && t(errors.password)} />
        <PasswordStrength value={password} />
      </div>
      <AuthField label={t("auth.confirmPassword")} icon={Lock} type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} error={errors.confirm && t(errors.confirm)} />
      <FormError message={failure && t(failure)} />
      <Button type="submit" disabled={pending} className="h-12 w-full disabled:opacity-60">{t(pending ? "auth.wait" : "auth.resetButton")}</Button>
    </form>
  );
}
