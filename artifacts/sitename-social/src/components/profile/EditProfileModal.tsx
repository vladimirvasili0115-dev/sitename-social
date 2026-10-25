"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Briefcase, Cake, GraduationCap, MapPin, Quote, UserRound, X } from "lucide-react";
import type { ProfileDetails, ProfileEdits, Relationship, User } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import { AuthField } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { relationshipLabels } from "./ProfileAbout";

type Props = { user: User; details: ProfileDetails; onSave: (patch: ProfileEdits) => void; onClose: () => void };
const inputClass = "w-full rounded-xl border border-border bg-surface-2 px-3.5 text-sm text-text outline-none focus:border-accent";

export function EditProfileModal({ user, details, onSave, onClose }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: user.name, status: details.status, bio: details.bio, city: details.city, birthday: details.birthday,
    relationship: details.relationship, work: details.work, education: details.education, gender: details.gender ?? "",
  });
  const [nameError, setNameError] = useState(false);
  const set = (field: keyof typeof form) => (event: { target: { value: string } }) => setForm((current) => ({ ...current, [field]: event.target.value }));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.name.trim().length < 2) return setNameError(true);
    const { gender, ...rest } = form;
    onSave({ ...rest, name: form.name.trim(), ...(gender ? { gender: gender as "male" | "female" } : {}) });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] p-0 sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <Card role="dialog" aria-modal="true" aria-labelledby="edit-profile-title" className="flex max-h-[92dvh] w-full max-w-[520px] flex-col rounded-b-none sm:rounded-b-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 id="edit-profile-title" className="text-base font-semibold">{t("profile.edit")}</h2>
          <IconButton aria-label={t("common.cancel")} onClick={onClose}><X size={18} /></IconButton>
        </div>
        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="grid gap-4 overflow-y-auto p-5 sm:grid-cols-2">
            <AuthField className="sm:col-span-2" label={t("auth.name")} icon={UserRound} value={form.name} onChange={set("name")} error={nameError ? t("auth.errRequired") : undefined} />
            <AuthField className="sm:col-span-2" label={t("profile.status")} icon={Quote} value={form.status} maxLength={80} onChange={set("status")} />
            <AuthField label={t("profile.city")} icon={MapPin} value={form.city} onChange={set("city")} />
            <AuthField label={t("profile.birthday")} icon={Cake} type="date" value={form.birthday} onChange={set("birthday")}  />
            <AuthField label={t("profile.work")} icon={Briefcase} value={form.work} onChange={set("work")} />
            <AuthField label={t("profile.education")} icon={GraduationCap} value={form.education} onChange={set("education")} />
            <label className="block text-xs font-medium text-muted sm:col-span-2">{t("auth.gender")}
              {/* Gender is chosen once at registration; afterwards only an admin can change it. */}
              <select value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))} className={`${inputClass} mt-1.5 h-12 disabled:opacity-60`}>
                <option value="" disabled>—</option>
                <option value="male">{t("auth.male")}</option>
                <option value="female">{t("auth.female")}</option>
              </select>
            </label>
            <label className="block text-xs font-medium text-muted sm:col-span-2">{t("profile.relationship")}
              <select value={form.relationship} onChange={(event) => setForm((current) => ({ ...current, relationship: event.target.value as Relationship }))} className={`${inputClass} mt-1.5 h-12`}>
                {(Object.keys(relationshipLabels) as Relationship[]).map((key) => <option key={key} value={key}>{t(relationshipLabels[key])}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium text-muted sm:col-span-2">{t("profile.bio")}
              <textarea value={form.bio} onChange={set("bio")} rows={3} maxLength={300} className={`${inputClass} mt-1.5 resize-none py-3 leading-6`} />
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
            <Button type="button" variant="subtle" onClick={onClose}>{t("common.cancel")}</Button>
            <Button type="submit">{t("profile.save")}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
