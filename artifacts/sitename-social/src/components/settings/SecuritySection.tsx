"use client";
import { useState, type FormEvent } from "react";
import { Lock, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { sessions } from "@/data/settings";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { AuthField } from "@/components/auth/AuthField";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { SettingRow } from "./SettingRow";
import { SettingsSection } from "./SettingsSection";
import { useSettings } from "./useSettings";
import { useAuth, type AuthResult } from "@/components/auth/AuthProvider";
import { FormError } from "@/components/auth/FormError";

type Errors = Partial<Record<"current" | "next" | "confirm", TranslationKey>>;

export function SecuritySection() {
  const { t } = useTranslation();
  const { settings, set, update } = useSettings();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);
  const { updatePassword } = useAuth();
  const [failure, setFailure] = useState<AuthResult>(null);
  const field = (key: keyof typeof form) => (event: { target: { value: string } }) => { setSaved(false); setForm((value) => ({ ...value, [key]: event.target.value })); };
  const active = sessions.filter((session) => !settings.endedSessions.includes(session.id));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Errors = {};
    if (!form.current) found.current = "auth.errRequired";
    if (form.next.length < MIN_PASSWORD_LENGTH) found.next = "auth.errPassword";
    if (form.confirm !== form.next) found.confirm = "auth.errMatch";
    setErrors(found);
    if (Object.keys(found).length) return;
    const result = await updatePassword(form.next);
    setFailure(result);
    if (result) return;
    setForm({ current: "", next: "", confirm: "" });
    setSaved(true);
  }

  return (
    <>
      <SettingsSection title={t("settings.secPassword")}>
        <form onSubmit={handleSubmit} noValidate className="space-y-4 p-4">
          <AuthField label={t("settings.secCurrent")} icon={Lock} type="password" autoComplete="current-password" value={form.current} onChange={field("current")} error={errors.current && t(errors.current)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div><AuthField label={t("settings.secNew")} icon={Lock} type="password" autoComplete="new-password" value={form.next} onChange={field("next")} error={errors.next && t(errors.next)} /><PasswordStrength value={form.next} /></div>
            <AuthField label={t("auth.confirmPassword")} icon={Lock} type="password" autoComplete="new-password" value={form.confirm} onChange={field("confirm")} error={errors.confirm && t(errors.confirm)} />
          </div>
          <FormError message={failure && t(failure)} />
          <div className="flex items-center gap-3">
            <Button type="submit">{t("settings.secPassword")}</Button>
            {saved ? <p role="status" className="text-sm text-accent">{t("settings.secSaved")}</p> : null}
          </div>
        </form>
      </SettingsSection>
      <SettingsSection>
        <SettingRow icon={ShieldCheck} title={t("settings.sec2fa")} hint={t("settings.sec2faHint")}><Switch checked={settings.twoFactor} onChange={(twoFactor) => set({ twoFactor })} label={t("settings.sec2fa")} /></SettingRow>
      </SettingsSection>
      <SettingsSection title={t("settings.secSessions")}>
        {active.map((session) => (
          <SettingRow key={session.id} icon={MonitorSmartphone} title={session.device} hint={session.current ? `${session.place} · ${t("settings.secThisDevice")}` : session.place}>
            {session.current ? null : <Button variant="outline" className="h-9 px-3 text-xs" onClick={() => update((current) => ({ ...current, endedSessions: [...current.endedSessions, session.id] }))}>{t("settings.secEnd")}</Button>}
          </SettingRow>
        ))}
      </SettingsSection>
    </>
  );
}
