"use client";
import { useEffect, useRef, useState } from "react";
import { AtSign } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { useProfile } from "./useProfile";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthField } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/Button";
import { readProfileEdits, writeProfileEdits } from "@/lib/profile";
import { loadProfile } from "@/lib/profileSync";
import { supabase } from "@/lib/supabase";

type Words = { label: string; hint: string; save: string; ok: string; invalid: string; taken: string; wait: string; error: string };
const words: Record<string, Words> = {
  az: { label: "İstifadəçi adı (@)", hint: "3–30 simvol: kiçik hərflər, rəqəmlər, nöqtə və alt xətt. Eyni adı iki nəfər seçə bilməz. 30 gündən bir dəyişmək olar.", save: "Adı dəyiş", ok: "İstifadəçi adı dəyişdirildi", invalid: "Yalnız a–z, 0–9, nöqtə və alt xətt (3–30 simvol)", taken: "Bu ad artıq tutulub", wait: "Adı 30 gündən bir dəyişmək olar", error: "Xəta oldu, bir az sonra yenidən yoxla" },
  tr: { label: "Kullanıcı adı (@)", hint: "3–30 karakter: küçük harf, rakam, nokta ve alt çizgi. Aynı adı iki kişi seçemez. 30 günde bir değiştirilebilir.", save: "Adı değiştir", ok: "Kullanıcı adı değiştirildi", invalid: "Yalnızca a–z, 0–9, nokta ve alt çizgi (3–30 karakter)", taken: "Bu ad zaten alınmış", wait: "Ad 30 günde bir değiştirilebilir", error: "Bir hata oldu, biraz sonra tekrar dene" },
  ru: { label: "Имя пользователя (@)", hint: "3–30 символов: строчные буквы, цифры, точка и подчёркивание. Одно имя на двоих нельзя. Менять можно раз в 30 дней.", save: "Сменить имя", ok: "Имя пользователя изменено", invalid: "Только a–z, 0–9, точка и подчёркивание (3–30 символов)", taken: "Это имя уже занято", wait: "Имя можно менять раз в 30 дней", error: "Ошибка, попробуйте чуть позже" },
  en: { label: "Username (@)", hint: "3–30 characters: lowercase letters, digits, dot and underscore. Two people cannot have the same name. You can change it once every 30 days.", save: "Change username", ok: "Username changed", invalid: "Only a–z, 0–9, dot and underscore (3–30 characters)", taken: "This username is already taken", wait: "You can change the username once every 30 days", error: "Something went wrong, try again in a moment" },
  ka: { label: "მომხმარებლის სახელი (@)", hint: "3–30 სიმბოლო: პატარა ასოები, ციფრები, წერტილი და ქვედა ტირე. ერთი სახელი ორს არ შეიძლება. შეცვლა შეიძლება 30 დღეში ერთხელ.", save: "სახელის შეცვლა", ok: "მომხმარებლის სახელი შეიცვალა", invalid: "მხოლოდ a–z, 0–9, წერტილი და ქვედა ტირე (3–30 სიმბოლო)", taken: "ეს სახელი უკვე დაკავებულია", wait: "სახელის შეცვლა შეიძლება 30 დღეში ერთხელ", error: "მოხდა შეცდომა, სცადე მოგვიანებით" },
};

// "@username" of the profile: changed through the server (it checks the format, that nobody else has it, and the 30 days between changes).
export function HandleField() {
  const { locale } = useTranslation();
  const { user } = useProfile();
  const accountId = useAuth().user?.id;
  const w = words[locale] ?? words.en;
  const [value, setValue] = useState(user.handle);
  const touched = useRef(false);
  useEffect(() => { if (!touched.current) setValue(user.handle); }, [user.handle]);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const clean = value.trim().toLowerCase().replace(/^@/, "");
  const same = clean === user.handle.toLowerCase();

  async function save() {
    if (!supabase || busy || !clean || same) return;
    setBusy(true);
    setNote(null);
    const { data, error } = await supabase.rpc("profile_set_handle", { p_handle: clean });
    setBusy(false);
    const code = error ? "error" : String(data);
    if (code === "ok") {
      writeProfileEdits({ ...readProfileEdits(), handle: clean });
      touched.current = false;
      setValue(clean);
      if (accountId) void loadProfile(accountId);
      setNote({ ok: true, text: w.ok });
      return;
    }
    const text = code === "invalid" ? w.invalid : code === "taken" ? w.taken : code === "wait" ? w.wait : w.error;
    setNote({ ok: false, text });
  }

  return (
    <div>
      <AuthField label={w.label} icon={AtSign} value={value} maxLength={31} autoCapitalize="none" autoCorrect="off" spellCheck={false} onChange={(event) => { touched.current = true; setNote(null); setValue(event.target.value); }} />
      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={() => void save()} disabled={busy || !clean || same}>{w.save}</Button>
        {note ? <span role="status" className={note.ok ? "text-sm font-medium text-accent" : "text-sm font-medium text-[var(--danger)]"}>{note.text}</span> : null}
      </div>
      <p className="mt-1 text-[11px] text-muted">{w.hint}</p>
    </div>
  );
}
