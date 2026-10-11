"use client";
import { VerifiedMark, useVerified } from "@/components/ui/VerifiedMark";
import { useState, type ChangeEvent } from "react";
import { Camera, EyeOff, MapPin, Pencil } from "lucide-react";
import type { ProfileDetails, ProfileEdits, User } from "@/types";
import { resizeImage } from "@/lib/profile";
import { AvatarCropper } from "./AvatarCropper";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useInvisible } from "@/components/invisible/useInvisible";

type Stat = { label: TranslationKey; value: number };
type Props = { user: User; details: ProfileDetails; stats: Stat[]; onUpdate: (patch: ProfileEdits) => void; onEdit: () => void };

export function ProfileHeader({ user, details, stats, onUpdate, onEdit }: Props) {
  const { t } = useTranslation();
  const official = useVerified(user.id) === "official";
  const { hidesOnline } = useInvisible();
  const [cropping, setCropping] = useState<string | null>(null);
  const pick = (field: "avatar" | "cover", size: number) => async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      // A new profile photo is framed by the user first; the cover is used as it is.
      if (field === "avatar") setCropping(await resizeImage(file, 1200));
      else onUpdate({ [field]: await resizeImage(file, size) });
    } catch {
      // Unreadable image: keep the current one.
    }
  };
  return (
    <Card className="overflow-hidden">
      {cropping ? <AvatarCropper src={cropping} onCancel={() => setCropping(null)} onSave={(avatar) => { setCropping(null); onUpdate({ avatar }); }} /> : null}
      <div className="relative h-40 bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] sm:h-56">
        {details.cover ? <img src={details.cover} alt="" className="h-full w-full object-cover" /> : null}
        <label className="absolute right-3 top-3 flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-text hover:bg-surface-2">
          <Camera size={15} /><span className="hidden sm:inline">{t("profile.changeCover")}</span>
          <input type="file" accept="image/*" className="sr-only" aria-label={t("profile.changeCover")} onChange={pick("cover", 1400)} />
        </label>
      </div>
      <div className="px-5 pb-6 sm:px-9">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="relative -mt-14 h-28 w-28 shrink-0 sm:-mt-16 sm:h-32 sm:w-32">
            <span className={`block h-full w-full rounded-full ${official ? "bg-[linear-gradient(135deg,#F6D365,#E7B93C,#B8860B)] p-[4px]" : "bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] p-[3px]"}`}>
              <img src={user.avatar} alt={user.name} className="h-full w-full rounded-full border-4 border-surface object-cover" />
            </span>
            <label className="absolute bottom-1 right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-text hover:bg-surface-2">
              <Camera size={16} />
              <input type="file" accept="image/*" className="sr-only" aria-label={t("profile.changePhoto")} onChange={pick("avatar", 400)} />
            </label>
          </div>
          <div className="min-w-0 flex-1 sm:pb-1 sm:pt-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="truncate text-2xl font-semibold tracking-[-0.03em]">{user.name}<VerifiedMark userId={user.id} size={21} /></h1>
              {official ? <span className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold" style={{ borderColor: "#E7B93C", color: "#E7B93C" }}>{t("verified.official")}</span> : null}
              {hidesOnline
                ? <span className="flex items-center gap-1.5 text-xs font-medium text-muted"><EyeOff size={13} />{t("invisible.badge")}</span>
                : <span className="flex items-center gap-1.5 text-xs font-medium text-accent"><span className="h-2 w-2 rounded-full bg-accent" />{t("common.onlineNow")}</span>}
            </div>
            <p className="mt-0.5 text-sm text-muted">@{user.handle}</p>
            {details.status ? <p className="mt-2 text-sm leading-6 text-text">{details.status}</p> : null}
            {details.city ? <p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><MapPin size={13} />{details.city}</p> : null}
          </div>
          <Button variant="outline" onClick={onEdit} className="shrink-0 sm:mb-1"><Pencil size={15} />{t("profile.edit")}</Button>
        </div>
        <dl className="mt-5 grid grid-cols-4 gap-2 border-t border-border pt-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <dd className="text-lg font-semibold tabular-nums">{stat.value}</dd>
              <dt className="truncate text-[11px] text-muted">{t(stat.label)}</dt>
            </div>
          ))}
        </dl>
      </div>
    </Card>
  );
}
