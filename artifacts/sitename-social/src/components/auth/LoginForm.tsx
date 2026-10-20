"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { isEmail, MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { AuthField } from "./AuthField";
import { FormError } from "./FormError";
import { useAuth, type AuthResult } from "./AuthProvider";

type Errors = Partial<Record<"email" | "password", TranslationKey>>;

export function LoginForm() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [failure, setFailure] = useState<AuthResult>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Errors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};
    if (!isEmail(email)) next.email = "auth.errEmail";
    if (password.length < MIN_PASSWORD_LENGTH) next.password = "auth.errPassword";
    setErrors(next);
    if (Object.keys(next).length) return;
    setPending(true);
    const result = await login(email.trim(), password, remember);
    setPending(false);
    setFailure(result);
    if (!result) router.replace("/feed");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <AuthField label={t("auth.email")} icon={Mail} type="email" name="email" autoComplete="username email" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email && t(errors.email)} />
      <AuthField label={t("auth.password")} icon={Lock} type="password" name="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password && t(errors.password)} />
      <div className="flex items-center justify-between gap-3 text-xs">
        <label className="flex cursor-pointer items-center gap-2 text-muted">
          <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          {t("auth.remember")}
        </label>
        <Link href="/forgot-password" className="font-medium text-accent hover:underline">{t("auth.forgotLink")}</Link>
      </div>
      <FormError message={failure && t(failure)} />
      <Button type="submit" disabled={pending} className="h-12 w-full disabled:opacity-60">{t(pending ? "auth.wait" : "auth.loginButton")}{pending ? null : <ArrowRight size={16} />}</Button>
    </form>
  );
}
