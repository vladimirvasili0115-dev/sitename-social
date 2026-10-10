"use client";
import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Tabs } from "@/components/ui/Tabs";
import { AccountSection } from "@/components/settings/AccountSection";
import { PrivacySection } from "@/components/settings/PrivacySection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { AppearanceSection } from "@/components/settings/AppearanceSection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { BlockedSection } from "@/components/settings/BlockedSection";

type SettingsTab = "account" | "privacy" | "notifications" | "appearance" | "security" | "blocked";

export default function SettingsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<SettingsTab>("account");
  return (
    <div className="mx-auto max-w-[680px]">
      <h1 className="mb-1 px-1 text-[23px] font-semibold tracking-[-0.035em]">{t("nav.settings")}</h1>
      <p className="mb-4 px-1 text-xs text-muted">{t("settings.autoSave")}</p>
      <Tabs<SettingsTab> active={tab} onChange={setTab} tabs={[
        { id: "account", label: t("settings.tabAccount") }, { id: "privacy", label: t("settings.tabPrivacy") }, { id: "notifications", label: t("header.notifications") },
        { id: "appearance", label: t("settings.tabAppearance") }, { id: "security", label: t("settings.tabSecurity") }, { id: "blocked", label: t("settings.tabBlocked") },
      ]} />
      {tab === "account" ? <AccountSection /> : null}
      {tab === "privacy" ? <PrivacySection /> : null}
      {tab === "notifications" ? <NotificationsSection /> : null}
      {tab === "appearance" ? <AppearanceSection /> : null}
      {tab === "security" ? <SecuritySection /> : null}
      {tab === "blocked" ? <BlockedSection /> : null}
    </div>
  );
}
