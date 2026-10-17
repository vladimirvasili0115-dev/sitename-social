"use client";
import Link from "next/link";
import { ChevronRight, EyeOff, Gift, Mail, UserPlus, UserRound, Users, type LucideIcon } from "lucide-react";
import type { Audience, PrivacyKey } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Select } from "@/components/ui/Select";
import { SettingRow } from "./SettingRow";
import { SettingsSection } from "./SettingsSection";
import { useSettings } from "./useSettings";

const rows: { key: PrivacyKey; icon: LucideIcon; title: TranslationKey }[] = [
  { key: "profile", icon: UserRound, title: "settings.privProfile" },
  { key: "messages", icon: Mail, title: "settings.privMessages" },
  { key: "requests", icon: UserPlus, title: "settings.privRequests" },
  { key: "friendsList", icon: Users, title: "settings.privFriends" },
  { key: "gifts", icon: Gift, title: "settings.privGifts" },
];
const audiences: { value: Audience; label: TranslationKey }[] = [
  { value: "everyone", label: "settings.optEveryone" }, { value: "friends", label: "settings.optFriends" }, { value: "nobody", label: "settings.optNobody" },
];

export function PrivacySection() {
  const { t } = useTranslation();
  const { settings, update } = useSettings();
  const options = audiences.map((item) => ({ value: item.value, label: t(item.label) }));
  return (
    <>
      <SettingsSection>
        {rows.map(({ key, icon, title }) => (
          <SettingRow key={key} icon={icon} title={t(title)}>
            <Select<Audience> value={settings.privacy[key]} label={t(title)} options={key === "requests" ? options.map((item) => (item.value === "friends" ? { ...item, label: t("settings.optFriendsOfFriends") } : item)) : options} onChange={(value) => update((current) => ({ ...current, privacy: { ...current.privacy, [key]: value } }))} />
          </SettingRow>
        ))}
      </SettingsSection>
      <SettingsSection>
        <Link href="/invisible" className="block hover:bg-surface-2">
          <SettingRow icon={EyeOff} title={t("nav.invisible")} hint={t("settings.privInvisibleHint")}><ChevronRight size={18} className="text-muted" /></SettingRow>
        </Link>
      </SettingsSection>
    </>
  );
}
