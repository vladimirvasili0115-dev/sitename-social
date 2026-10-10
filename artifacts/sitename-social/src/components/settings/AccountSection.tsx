"use client";
import { useState } from "react";
import Link from "next/link";
import { Languages, LogOut, Mail, RotateCcw, Trash2, UserRound } from "lucide-react";
import type { Locale } from "@/types";
import { locales } from "@/i18n/config";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProfile } from "@/components/profile/useProfile";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { SettingRow } from "./SettingRow";
import { SettingsSection } from "./SettingsSection";
import { deleteAccount } from "@/lib/account";

const KEEP = ["sitename-auth", "sitename-locale", "sitename-profile", "sitename-uid", "sitename-ephemeral"];
function clearData(keepSession: boolean) {
  Object.keys(window.localStorage).filter((key) => key.startsWith("sitename-") && !(keepSession && KEEP.includes(key))).forEach((key) => window.localStorage.removeItem(key));
  window.sessionStorage.removeItem("sitename-auth");
}

export function AccountSection() {
  const { t, locale, setLocale } = useTranslation();
  const { user: account, signOut } = useAuth();
  const { user } = useProfile();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);
  async function handleDelete() {
    setDeleting(true);
    setFailed(false);
    if (!(await deleteAccount())) {
      setDeleting(false);
      return setFailed(true);
    }
    clearData(false);
    await signOut();
  }
  return (
    <>
      <SettingsSection>
        <SettingRow icon={UserRound} title={t("auth.name")} hint={user.name}><Link href="/profile" className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text hover:bg-surface-2">{t("profile.edit")}</Link></SettingRow>
        <SettingRow icon={Mail} title={t("auth.email")} hint={account?.email} />
        <SettingRow icon={Languages} title={t("header.language")}>
          <Select<Locale> value={locale} onChange={setLocale} label={t("header.language")} options={locales.map((item) => ({ value: item.code, label: `${item.flag} ${item.nativeName}` }))} />
        </SettingRow>
      </SettingsSection>
      <SettingsSection>
        <SettingRow icon={LogOut} title={t("auth.logout")} hint={t("settings.accLogoutHint")}><Button variant="outline" className="h-10 px-3 text-xs" onClick={() => void signOut()}>{t("auth.logout")}</Button></SettingRow>
        <SettingRow icon={RotateCcw} title={t("settings.accReset")} hint={t("settings.accResetHint")}>
          <Button variant="outline" className="h-10 px-3 text-xs" onClick={() => { clearData(true); window.location.reload(); }}>{t("settings.accReset")}</Button>
        </SettingRow>
        <SettingRow icon={Trash2} title={t("settings.accDelete")} hint={t(failed ? "settings.accDeleteFailed" : confirming ? "settings.accDeleteConfirm" : "settings.accDeleteHint")}>
          {confirming ? (
            <>
              <Button variant="subtle" className="h-10 px-3 text-xs" disabled={deleting} onClick={() => setConfirming(false)}>{t("common.cancel")}</Button>
              <button onClick={() => void handleDelete()} disabled={deleting} className="h-10 rounded-xl bg-danger px-3 text-xs font-semibold text-bg disabled:opacity-60">{t(deleting ? "settings.accDeleting" : "settings.confirmDelete")}</button>
            </>
          ) : <button onClick={() => setConfirming(true)} className="h-10 rounded-xl border border-danger px-3 text-xs font-semibold text-danger hover:bg-surface-2">{t("settings.accDelete")}</button>}
        </SettingRow>
      </SettingsSection>
    </>
  );
}
