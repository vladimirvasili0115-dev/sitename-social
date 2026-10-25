"use client";
import { useState, type FormEvent } from "react";
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
import { supabase } from "@/lib/supabase";

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
  // Changing the e-mail: a confirmation link goes to the new address (and, by the project settings, the old one). The e-mail changes when it is confirmed.
  const [mailOpen, setMailOpen] = useState(false);
  const [mailNew, setMailNew] = useState("");
  const [mailBusy, setMailBusy] = useState(false);
  const [mailNote, setMailNote] = useState<{ ok: boolean; text: string } | null>(null);
  // A phone account signs in with a hidden address made from the phone number: that one must not be changed.
  const isPhoneEmail = Boolean(account?.email?.endsWith("@phone.nudepart.com"));
  const mailTexts: Record<string, { change: string; send: string; placeholder: string; bad: string; same: string; sent: string; fail: string; phone: string }> = {
    az: { change: "Dəyiş", send: "Təsdiq göndər", placeholder: "Yeni e-poçt ünvanı", bad: "E-poçt ünvanı düzgün deyil.", same: "Bu, hazırkı ünvandır.", sent: "Təsdiq linki göndərildi. Yeni (və köhnə) ünvandakı məktubdan linkə basın, e-poçt dəyişəcək.", fail: "E-poçt dəyişdirilmədi. Ünvan başqasındadır və ya sonra yenidən cəhd edin.", phone: "Telefonla açılmış hesabda e-poçt dəyişdirilmir, çünki giriş telefon nömrəsi ilədir." },
    tr: { change: "Değiştir", send: "Onay gönder", placeholder: "Yeni e-posta adresi", bad: "E-posta adresi geçersiz.", same: "Bu, mevcut adres.", sent: "Onay bağlantısı gönderildi. Yeni (ve eski) adrese gelen e-postadaki bağlantıya tıkla, e-posta değişecek.", fail: "E-posta değiştirilemedi. Adres başkasında olabilir veya sonra tekrar dene.", phone: "Telefonla açılan hesapta e-posta değiştirilemez, giriş telefon numarasıyla yapılır." },
    ru: { change: "Изменить", send: "Отправить подтверждение", placeholder: "Новый адрес e-mail", bad: "Неверный адрес e-mail.", same: "Это текущий адрес.", sent: "Ссылка для подтверждения отправлена. Перейди по ссылке из письма на новый (и старый) адрес, и e-mail изменится.", fail: "E-mail не изменён. Адрес может быть занят, попробуй позже.", phone: "В аккаунте, созданном по телефону, e-mail не меняется: вход выполняется по номеру телефона." },
    en: { change: "Change", send: "Send confirmation", placeholder: "New e-mail address", bad: "The e-mail address is not valid.", same: "That is the current address.", sent: "A confirmation link was sent. Open the link in the message sent to the new (and the old) address and the e-mail will change.", fail: "The e-mail was not changed. The address may be taken, or try again later.", phone: "An account made with a phone number cannot change its e-mail: it signs in with the phone number." },
    ka: { change: "შეცვლა", send: "დადასტურების გაგზავნა", placeholder: "ახალი ელფოსტა", bad: "ელფოსტა არასწორია.", same: "ეს მიმდინარე მისამართია.", sent: "დადასტურების ბმული გაიგზავნა. გახსენი ბმული წერილში ახალ (და ძველ) მისამართზე და ელფოსტა შეიცვლება.", fail: "ელფოსტა ვერ შეიცვალა. მისამართი შეიძლება დაკავებული იყოს, სცადე მოგვიანებით.", phone: "ტელეფონით შექმნილ ანგარიშზე ელფოსტა არ იცვლება: შესვლა ტელეფონის ნომრით ხდება." },
  };
  const mailText = mailTexts[locale] ?? mailTexts.en;
  async function changeEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = mailNew.trim().toLowerCase();
    if (!supabase) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(next)) return setMailNote({ ok: false, text: mailText.bad });
    if (next === (account?.email ?? "").toLowerCase()) return setMailNote({ ok: false, text: mailText.same });
    setMailBusy(true);
    setMailNote(null);
    const { error } = await supabase.auth.updateUser({ email: next }, { emailRedirectTo: `${window.location.origin}/settings/` });
    setMailBusy(false);
    if (error) return setMailNote({ ok: false, text: mailText.fail });
    setMailNew("");
    setMailNote({ ok: true, text: mailText.sent });
  }
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
        <SettingRow icon={Mail} title={t("auth.email")} hint={account?.email}>
          {!supabase || isPhoneEmail ? null : <Button variant="outline" className="h-10 px-3 text-xs" onClick={() => { setMailNote(null); setMailOpen((value) => !value); }}>{mailText.change}</Button>}
        </SettingRow>
        {mailOpen ? (
          <form onSubmit={(event) => void changeEmail(event)} className="flex flex-wrap items-center gap-2 px-4 pb-4">
            <input type="email" value={mailNew} onChange={(event) => setMailNew(event.target.value)} placeholder={mailText.placeholder} autoComplete="email" maxLength={120} className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none focus:border-accent" />
            <Button type="submit" className="h-10 px-4 text-xs" disabled={mailBusy}>{mailBusy ? "…" : mailText.send}</Button>
            {mailNote ? <p role="status" className={mailNote.ok ? "w-full text-xs text-[#4E6B33]" : "w-full text-xs text-danger"}>{mailNote.text}</p> : null}
          </form>
        ) : null}
        {isPhoneEmail ? <p className="px-4 pb-3 text-xs text-muted">{mailText.phone}</p> : null}
        <SettingRow icon={Languages} title={t("header.language")}>
          <Select<Locale> value={locale} onChange={setLocale} label={t("header.language")} options={locales.map((item) => ({ value: item.code, label: `${item.flag} ${item.nativeName}` }))} />
        </SettingRow>
      </SettingsSection>
      <SettingsSection>
        <SettingRow icon={LogOut} title={t("auth.logout")} hint={t("settings.accLogoutHint")}><Button variant="outline" className="h-10 px-3 text-xs" onClick={() => void signOut()}>{t("auth.logout")}</Button></SettingRow>
        {supabase ? null : <SettingRow icon={RotateCcw} title={t("settings.accReset")} hint={t("settings.accResetHint")}>
          <Button variant="outline" className="h-10 px-3 text-xs" onClick={() => { clearData(true); window.location.reload(); }}>{t("settings.accReset")}</Button>
        </SettingRow>}
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
