"use client";
import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, Cake, Camera, GraduationCap, ImageIcon, Info, MapPin, Quote, Settings, UserRound } from "lucide-react";
import type { Gender, Relationship } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import { useProfile } from "@/components/profile/useProfile";
import { useAuth } from "@/components/auth/AuthProvider";
import { relationshipLabels } from "@/components/profile/ProfileAbout";
import { AuthField } from "@/components/auth/AuthField";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { resizeImage } from "@/lib/profile";
import { loadProfile } from "@/lib/profileSync";
import { nextNameChange } from "@/lib/nameRule";
import { cn } from "@/lib/utils";

// "Edit profile" as its own page with sections (like VK): main info, about, education & work, photos.
type Section = "main" | "about" | "career" | "photos";
const input = "mt-1.5 h-12 w-full rounded-xl border border-border bg-surface-2 px-3.5 text-sm text-text outline-none focus:border-accent";

export default function EditProfilePage() {
  const { t } = useTranslation();
  const { user, details, update } = useProfile();
  const accountId = useAuth().user?.id;
  const [section, setSection] = useState<Section>("main");
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: user.name, status: details.status, bio: details.bio, city: details.city, birthday: details.birthday,
    relationship: details.relationship, work: details.work, education: details.education, gender: details.gender ?? "",
  });
  const set = (field: keyof typeof form) => (event: { target: { value: string } }) => { setSaved(false); setForm((current) => ({ ...current, [field]: event.target.value })); };
  const wait = nextNameChange(details.nameChanges, details.nameChangedAt);
  const freeLeft = Math.max(0, 2 - (details.nameChanges ?? 0));
  const sections: [Section, string, typeof UserRound][] = [["main", t("edit.main"), UserRound], ["about", t("profile.tabAbout"), Info], ["career", t("edit.career"), Briefcase], ["photos", t("edit.photos"), ImageIcon]];

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    update({
      ...(name.length >= 2 && name !== user.name && !wait ? { name } : {}),
      status: form.status, bio: form.bio, city: form.city, birthday: form.birthday, relationship: form.relationship as Relationship,
      work: form.work, education: form.education, ...(form.gender ? { gender: form.gender as Gender } : {}),
    });
    setSaved(true);
    // The server counts name changes; fetch the fresh numbers (and the name it kept) a moment later.
    if (accountId) window.setTimeout(() => void loadProfile(accountId), 1500);
  }
  const pick = (field: "avatar" | "cover", size: number) => async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try { update({ [field]: await resizeImage(file, size) }); setSaved(true); } catch { /* unreadable picture */ }
  };

  return (
    <div className="mx-auto max-w-[900px]">
      <Link href="/profile" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-text"><ArrowLeft size={16} />{t("edit.back")}</Link>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <Card className="p-2 md:w-[230px] md:shrink-0">
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            {sections.map(([id, label, Icon]) => (
              <button key={id} type="button" onClick={() => setSection(id)} aria-current={section === id ? "page" : undefined} className={cn("flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm", section === id ? "bg-surface-2 font-semibold text-text" : "text-muted hover:bg-surface-2 hover:text-text")}><Icon size={17} />{label}</button>
            ))}
            <Link href="/settings" className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-surface-2 hover:text-text"><Settings size={17} />{t("nav.settings")}</Link>
          </nav>
        </Card>
        <Card className="min-w-0 flex-1 p-5">
          <form onSubmit={save} noValidate className="space-y-4">
            {section === "main" ? (
              <>
                <h1 className="text-lg font-semibold">{t("edit.main")}</h1>
                <div>
                  <AuthField label={t("auth.name")} icon={UserRound} value={form.name} onChange={set("name")} disabled={Boolean(wait)} />
                  <p className="mt-1 text-[11px] text-muted">{wait ? t("edit.nameWait").replace("{d}", wait.toLocaleDateString()) : freeLeft ? t("edit.nameFree").replace("{n}", String(freeLeft)) : t("edit.nameRule")}</p>
                </div>
                <label className="block text-xs font-medium text-muted">{t("auth.gender")}
                  <select value={form.gender} onChange={set("gender")} className={input}>
                    <option value="" disabled>—</option>
                    <option value="male">{t("auth.male")}</option>
                    <option value="female">{t("auth.female")}</option>
                  </select>
                </label>
                <AuthField label={t("profile.birthday")} icon={Cake} type="date" value={form.birthday} onChange={set("birthday")} />
                <label className="block text-xs font-medium text-muted">{t("profile.relationship")}
                  <select value={form.relationship} onChange={set("relationship")} className={input}>
                    {(Object.keys(relationshipLabels) as Relationship[]).map((item) => <option key={item} value={item}>{t(relationshipLabels[item])}</option>)}
                  </select>
                </label>
                <AuthField label={t("profile.status")} icon={Quote} value={form.status} maxLength={80} onChange={set("status")} />
              </>
            ) : null}
            {section === "about" ? (
              <>
                <h1 className="text-lg font-semibold">{t("profile.tabAbout")}</h1>
                <AuthField label={t("profile.city")} icon={MapPin} value={form.city} onChange={set("city")} />
                <label className="block text-xs font-medium text-muted">{t("profile.bio")}
                  <textarea value={form.bio} onChange={set("bio")} maxLength={500} rows={5} className="mt-1.5 w-full resize-none rounded-xl border border-border bg-surface-2 px-3.5 py-3 text-sm text-text outline-none focus:border-accent" />
                </label>
              </>
            ) : null}
            {section === "career" ? (
              <>
                <h1 className="text-lg font-semibold">{t("edit.career")}</h1>
                <AuthField label={t("profile.work")} icon={Briefcase} value={form.work} onChange={set("work")} />
                <AuthField label={t("profile.education")} icon={GraduationCap} value={form.education} onChange={set("education")} />
              </>
            ) : null}
            {section === "photos" ? (
              <>
                <h1 className="text-lg font-semibold">{t("edit.photos")}</h1>
                <div className="flex items-center gap-4">
                  <Avatar user={user} className="h-20 w-20" />
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-surface-2"><Camera size={16} />{t("profile.changePhoto")}<input type="file" accept="image/*" className="sr-only" onChange={pick("avatar", 400)} /></label>
                </div>
                <div className="overflow-hidden rounded-xl border border-border">
                  {details.cover ? <img src={details.cover} alt="" className="h-32 w-full object-cover" /> : <div className="h-32 w-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))]" />}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-surface-2"><ImageIcon size={16} />{t("profile.changeCover")}<input type="file" accept="image/*" className="sr-only" onChange={pick("cover", 1400)} /></label>
              </>
            ) : null}
            {section !== "photos" ? (
              <div className="flex items-center gap-3 border-t border-border pt-4">
                <Button type="submit" className="px-5">{t("profile.save")}</Button>
                {saved ? <span role="status" className="text-sm font-medium text-accent">{t("edit.saved")}</span> : null}
              </div>
            ) : saved ? <p role="status" className="text-sm font-medium text-accent">{t("edit.saved")}</p> : null}
          </form>
        </Card>
      </div>
    </div>
  );
}
