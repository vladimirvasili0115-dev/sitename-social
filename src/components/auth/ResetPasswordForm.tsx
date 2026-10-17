"use client";
import { useState, type FormEvent } from "react";
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

export function ResetPasswordForm() {
  const { t } = useTranslation();
  const { user, ready, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"password" | "confirm", TranslationKey>>>({});
  const [failure, setFailure] = useState<AuthResult>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

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
  if (ready && !user) return <FormError message={t("auth.resetExpired")} />;
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
