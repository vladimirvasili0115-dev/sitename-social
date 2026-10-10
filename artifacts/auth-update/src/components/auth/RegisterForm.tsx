"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, UserRound } from "lucide-react";
import { isEmail, MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { AuthField } from "./AuthField";
import { PasswordStrength } from "./PasswordStrength";
import { useAuth } from "./AuthProvider";

type Field = "name" | "email" | "password" | "confirm" | "terms";
type Errors = Partial<Record<Field, TranslationKey>>;

export function RegisterForm() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const update = (field: keyof typeof form) => (event: { target: { value: string } }) => setForm((current) => ({ ...current, [field]: event.target.value }));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};
    if (form.name.trim().length < 2) next.name = "auth.errRequired";
    if (!isEmail(form.email)) next.email = "auth.errEmail";
    if (form.password.length < MIN_PASSWORD_LENGTH) next.password = "auth.errPassword";
    if (form.confirm !== form.password) next.confirm = "auth.errMatch";
    if (!terms) next.terms = "auth.errTerms";
    setErrors(next);
    if (Object.keys(next).length) return;
    signIn({ name: form.name.trim(), email: form.email.trim() });
    router.replace("/feed");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <AuthField label={t("auth.name")} icon={UserRound} autoComplete="name" value={form.name} onChange={update("name")} error={errors.name && t(errors.name)} />
      <AuthField label={t("auth.email")} icon={Mail} type="email" autoComplete="email" value={form.email} onChange={update("email")} error={errors.email && t(errors.email)} />
      <div>
        <AuthField label={t("auth.password")} icon={Lock} type="password" autoComplete="new-password" value={form.password} onChange={update("password")} error={errors.password && t(errors.password)} />
        <PasswordStrength value={form.password} />
      </div>
      <AuthField label={t("auth.confirmPassword")} icon={Lock} type="password" autoComplete="new-password" value={form.confirm} onChange={update("confirm")} error={errors.confirm && t(errors.confirm)} />
      <div>
        <label className="flex cursor-pointer items-start gap-2 text-xs leading-5 text-muted">
          <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]" />
          {t("auth.terms")}
        </label>
        {errors.terms ? <p className="mt-1.5 text-xs text-[var(--danger)]">{t(errors.terms)}</p> : null}
      </div>
      <Button type="submit" className="h-12 w-full">{t("auth.registerButton")}<ArrowRight size={16} /></Button>
    </form>
  );
}
