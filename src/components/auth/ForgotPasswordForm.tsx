"use client";
import { useState, type FormEvent } from "react";
import { Mail, MailCheck } from "lucide-react";
import { isEmail } from "@/lib/auth";
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/Button";
import { AuthField } from "./AuthField";
import { FormError } from "./FormError";
import { useAuth, type AuthResult } from "./AuthProvider";

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [sent, setSent] = useState(false);
  const { requestReset } = useAuth();
  const [failure, setFailure] = useState<AuthResult>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = isEmail(email);
    setInvalid(!ok);
    if (!ok) return;
    setPending(true);
    const result = await requestReset(email.trim());
    setPending(false);
    setFailure(result);
    if (!result) setSent(true);
  }

  if (sent) {
    return (
      <div role="status" className="py-2 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface-2 text-accent"><MailCheck size={24} /></span>
        <h2 className="mt-4 text-lg font-semibold tracking-tight">{t("auth.sentTitle")}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{t("auth.sentText")}</p>
        <p className="mt-1 break-all text-sm font-medium text-text">{email.trim()}</p>
      </div>
    );
  }
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <AuthField label={t("auth.email")} icon={Mail} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} error={invalid ? t("auth.errEmail") : undefined} />
      <FormError message={failure && t(failure)} />
      <Button type="submit" disabled={pending} className="h-12 w-full disabled:opacity-60">{t(pending ? "auth.wait" : "auth.sendLink")}</Button>
    </form>
  );
}
