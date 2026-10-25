"use client";
import { Briefcase, Cake, CalendarDays, GraduationCap, Heart, Languages, MapPin, UserRound, type LucideIcon } from "lucide-react";
import type { ProfileDetails, Relationship } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { SectionCard } from "./SectionCard";

export const relationshipLabels: Record<Relationship, TranslationKey> = {
  single: "profile.relSingle", relationship: "profile.relRelationship", married: "profile.relMarried",
};

const azMonths = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"];

function formatDate(value: string, locale: string, withDay: boolean, withYear = true) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  if (locale === "az") return `${withDay ? `${date.getUTCDate()} ` : ""}${azMonths[date.getUTCMonth()]}${withYear ? ` ${date.getUTCFullYear()}` : ""}`;
  return new Intl.DateTimeFormat(locale, { day: withDay ? "numeric" : undefined, month: "long", year: withYear ? "numeric" : undefined, timeZone: "UTC" }).format(date);
}

export function ProfileAbout({ details, full = false }: { details: ProfileDetails; full?: boolean }) {
  const { t, locale } = useTranslation();
  const all: { icon: LucideIcon; label: TranslationKey; value: string }[] = [
    { icon: MapPin, label: "profile.city", value: details.city },
    { icon: UserRound, label: "auth.gender", value: details.gender ? t(details.gender === "male" ? "auth.male" : "auth.female") : "" },
    { icon: Cake, label: "profile.birthday", value: formatDate(details.birthday, locale, true, !details.hideAge) },
    { icon: Heart, label: "profile.relationship", value: t(relationshipLabels[details.relationship]) },
    { icon: Briefcase, label: "profile.work", value: details.work },
    { icon: GraduationCap, label: "profile.education", value: details.education },
    { icon: Languages, label: "profile.languages", value: details.languages.join(", ") },
    { icon: CalendarDays, label: "profile.joined", value: formatDate(details.joined, locale, false) },
  ];
  const rows = all.filter((row) => row.value);
  const visible = full ? rows : rows.slice(0, 5);
  return (
    <SectionCard title={t("profile.tabAbout")}>
      {details.bio ? <p className="mb-4 text-[13px] leading-6 text-text">{details.bio}</p> : null}
      <dl className={full ? "grid gap-x-6 gap-y-3 sm:grid-cols-2" : "space-y-3"}>
        {visible.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <Icon size={16} className="mt-0.5 shrink-0 text-muted" />
            <div className="min-w-0">
              <dt className="text-[11px] text-muted">{t(label)}</dt>
              <dd className="break-words text-[13px] text-text">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
      {full && details.interests.length ? (
        <div className="mt-5 border-t border-border pt-4">
          <h3 className="mb-2.5 text-[11px] text-muted">{t("profile.interests")}</h3>
          <ul className="flex flex-wrap gap-2">
            {details.interests.map((item) => <li key={item} className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-text">{item}</li>)}
          </ul>
        </div>
      ) : null}
    </SectionCard>
  );
}
