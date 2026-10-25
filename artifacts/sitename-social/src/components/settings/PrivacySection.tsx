"use client";
import Link from "next/link";
import { Cake, ChevronRight, EyeOff, Gift, Mail, MessageCircle, PenLine, UserPlus, UserRound, Users, type LucideIcon } from "lucide-react";
import type { Audience, PrivacyKey } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { useProfile } from "@/components/profile/useProfile";
import { SettingRow } from "./SettingRow";
import { SettingsSection } from "./SettingsSection";
import { useSettings } from "./useSettings";

const rows: { key: PrivacyKey; icon: LucideIcon; title: TranslationKey }[] = [
  { key: "profile", icon: UserRound, title: "settings.privProfile" },
  { key: "messages", icon: Mail, title: "settings.privMessages" },
  { key: "requests", icon: UserPlus, title: "settings.privRequests" },
  { key: "friendsList", icon: Users, title: "settings.privFriends" },
  { key: "gifts", icon: Gift, title: "settings.privGifts" },
  { key: "wall", icon: PenLine, title: "settings.privWall" },
  { key: "comments", icon: MessageCircle, title: "settings.privComments" },
];
const fallback: Partial<Record<PrivacyKey, Audience>> = { wall: "friends", comments: "everyone" };
const audiences: { value: Audience; label: TranslationKey }[] = [
  { value: "everyone", label: "settings.optEveryone" }, { value: "friends", label: "settings.optFriends" }, { value: "nobody", label: "settings.optNobody" },
];

export function PrivacySection() {
  const { t, locale } = useTranslation();
  const { settings, update } = useSettings();
  const { details, update: updateProfile } = useProfile();
  const birthdayWords = ({ az: ["Doğum tarixini gizlət", "Doğum tarixin və yaşın profildə, oyunda və doğum günü xatırlatmalarında göstərilməsin."], tr: ["Doğum tarihini gizle", "Doğum tarihin ve yaşın profilde, oyunda ve doğum günü hatırlatmalarında gösterilmesin."], ru: ["Скрыть дату рождения", "Дата рождения и возраст не показываются в профиле, в игре и в напоминаниях о днях рождения."], en: ["Hide my birth date", "Your birth date and age are not shown in the profile, in the game or in birthday reminders."] } as Record<string, string[]>)[locale] ?? ["Hide my birth date", "Your birth date and age are not shown."];
  const options = audiences.map((item) => ({ value: item.value, label: t(item.label) }));
  return (
    <>
      <SettingsSection>
        {rows.map(({ key, icon, title }) => (
          <SettingRow key={key} icon={icon} title={t(title)}>
            <Select<Audience> value={settings.privacy[key] ?? fallback[key] ?? "everyone"} label={t(title)} options={key === "requests" ? options.map((item) => (item.value === "friends" ? { ...item, label: t("settings.optFriendsOfFriends") } : item)) : options} onChange={(value) => update((current) => ({ ...current, privacy: { ...current.privacy, [key]: value } }))} />
          </SettingRow>
        ))}
      </SettingsSection>
      <SettingsSection>
        <SettingRow icon={Cake} title={birthdayWords[0]} hint={birthdayWords[1]}><Switch checked={Boolean(details.hideAge)} label={birthdayWords[0]} onChange={(hideAge) => updateProfile({ hideAge })} /></SettingRow>
      </SettingsSection>
      <SettingsSection>
        <Link href="/invisible" className="block hover:bg-surface-2">
          <SettingRow icon={EyeOff} title={t("nav.invisible")} hint={t("settings.privInvisibleHint")}><ChevronRight size={18} className="text-muted" /></SettingRow>
        </Link>
      </SettingsSection>
    </>
  );
}
