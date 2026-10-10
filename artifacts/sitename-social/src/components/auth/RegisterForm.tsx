"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Cake, Lock, Mail, MapPin, UserRound } from "lucide-react";
import type { Gender } from "@/types";
import { MIN_AGE } from "@/config/site";
import { isEmail, MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { AuthField } from "./AuthField";
import { PasswordStrength } from "./PasswordStrength";
import { FormError } from "./FormError";
import { useAuth, type AuthResult } from "./AuthProvider";

type Field = "name" | "email" | "gender" | "birthday" | "city" | "password" | "confirm" | "terms";
type Errors = Partial<Record<Field, TranslationKey>>;
const genders: { id: Gender; label: TranslationKey }[] = [{ id: "male", label: "auth.male" }, { id: "female", label: "auth.female" }];

function ageOf(birthday: string) {
  const born = new Date(birthday);
  if (Number.isNaN(born.getTime())) return -1;
  const now = new Date();
  const hadBirthday = now.getMonth() > born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() >= born.getDate());
  return now.getFullYear() - born.getFullYear() - (hadBirthday ? 0 : 1);
}

export function RegisterForm() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [failure, setFailure] = useState<AuthResult>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", birthday: "", city: "", password: "", confirm: "" });
  const [gender, setGender] = useState<Gender | null>(null);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const update = (field: keyof typeof form) => (event: { target: { value: string } }) => setForm((current) => ({ ...current, [field]: event.target.value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};
    const age = ageOf(form.birthday);
    if (form.name.trim().length < 2) next.name = "auth.errRequired";
    if (!isEmail(form.email)) next.email = "auth.errEmail";
    if (!gender) next.gender = "auth.errGender";
    if (age < 0 || age > 120) next.birthday = "auth.errRequired";
    else if (age < MIN_AGE) next.birthday = "auth.errAge";
    if (form.city.trim().length < 2) next.city = "auth.errRequired";
    if (form.password.length < MIN_PASSWORD_LENGTH) next.password = "auth.errPassword";
    if (form.confirm !== form.password) next.confirm = "auth.errMatch";
    if (!terms) next.terms = "auth.errTerms";
    setErrors(next);
    if (Object.keys(next).length || !gender) return;
    setPending(true);
    const result = await register({ name: form.name.trim(), email: form.email.trim(), password: form.password, gender, birthday: form.birthday, city: form.city.trim() });
    setPending(false);
    setFailure(result);
    if (!result) router.replace("/feed");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <AuthField label={t("auth.name")} icon={UserRound} autoComplete="name" value={form.name} onChange={update("name")} error={errors.name && t(errors.name)} />
      <AuthField label={t("auth.email")} icon={Mail} type="email" autoComplete="email" value={form.email} onChange={update("email")} error={errors.email && t(errors.email)} />
      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-muted">{t("auth.gender")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {genders.map((item) => <button key={item.id} type="button" onClick={() => setGender(item.id)} aria-pressed={gender === item.id} className={cn("h-12 rounded-xl border text-sm font-semibold", gender === item.id ? "border-accent bg-surface-2 text-accent" : "border-border bg-surface-2 text-muted hover:text-text")}>{t(item.label)}</button>)}
        </div>
        {errors.gender ? <p className="mt-1.5 text-xs text-[var(--danger)]">{t(errors.gender)}</p> : null}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField label={t("profile.birthday")} icon={Cake} type="date" autoComplete="bday" value={form.birthday} onChange={update("birthday")} error={errors.birthday && t(errors.birthday)} />
        <AuthField label={t("profile.city")} icon={MapPin} autoComplete="address-level2" value={form.city} onChange={update("city")} error={errors.city && t(errors.city)} />
      </div>
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
        <p className="ml-6 mt-1 flex flex-wrap gap-x-3 text-xs">
          <Link href="/terms" className="font-medium text-accent hover:underline">{t("auth.termsLink")}</Link>
          <Link href="/privacy" className="font-medium text-accent hover:underline">{t("auth.privacyLink")}</Link>
        </p>
        {errors.terms ? <p className="mt-1.5 text-xs text-[var(--danger)]">{t(errors.terms)}</p> : null}
      </div>
      <FormError message={failure && t(failure)} />
      <Button type="submit" disabled={pending} className="h-12 w-full disabled:opacity-60">{t(pending ? "auth.wait" : "auth.registerButton")}{pending ? null : <ArrowRight size={16} />}</Button>
    </form>
  );
}
