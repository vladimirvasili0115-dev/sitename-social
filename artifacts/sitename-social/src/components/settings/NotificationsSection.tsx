"use client";
import { AtSign, Footprints, Gift, Heart, Mail, UserPlus, Users, Volume2, type LucideIcon } from "lucide-react";
import type { NotificationKey } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Switch } from "@/components/ui/Switch";
import { SettingRow } from "./SettingRow";
import { SettingsSection } from "./SettingsSection";
import { useSettings } from "./useSettings";

type Row = { key: NotificationKey; icon: LucideIcon; title: TranslationKey };
const activity: Row[] = [
  { key: "messages", icon: Mail, title: "settings.notMessages" },
  { key: "requests", icon: UserPlus, title: "settings.notRequests" },
  { key: "likes", icon: Heart, title: "settings.notLikes" },
  { key: "gifts", icon: Gift, title: "settings.notGifts" },
  { key: "guests", icon: Footprints, title: "settings.notGuests" },
  { key: "groups", icon: Users, title: "settings.notGroups" },
];
const delivery: Row[] = [
  { key: "sound", icon: Volume2, title: "settings.notSound" },
  { key: "email", icon: AtSign, title: "settings.notEmail" },
];

export function NotificationsSection() {
  const { t } = useTranslation();
  const { settings, update } = useSettings();
  const renderRows = (rows: Row[]) => rows.map(({ key, icon, title }) => (
    <SettingRow key={key} icon={icon} title={t(title)}>
      <Switch checked={settings.notifications[key]} label={t(title)} onChange={(value) => update((current) => ({ ...current, notifications: { ...current.notifications, [key]: value } }))} />
    </SettingRow>
  ));
  return (
    <>
      <SettingsSection title={t("settings.notActivity")}>{renderRows(activity)}</SettingsSection>
      <SettingsSection title={t("settings.notDelivery")}>{renderRows(delivery)}</SettingsSection>
    </>
  );
}
