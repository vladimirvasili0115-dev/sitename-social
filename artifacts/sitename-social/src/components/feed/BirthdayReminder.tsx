"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Cake, Gift, MessageCircle, X } from "lucide-react";
import type { User } from "@/types";
import { supabase } from "@/lib/supabase";
import { userHref } from "@/lib/links";
import { useTranslation } from "@/i18n/useTranslation";
import { useFriends } from "@/components/friends/useFriends";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";

// Friends' birthdays (like VK): today's ones with "congratulate" buttons, and the next ones within a week.
type Upcoming = { user: User; days: number; age?: number };
const HIDE_KEY = "nudepart-bday-hidden";

function daysUntil(birthday: string, now: Date) {
  const [year, month, day] = birthday.split("-").map(Number);
  if (!month || !day) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), month - 1, day);
  if (next < today) next = new Date(now.getFullYear() + 1, month - 1, day);
  const days = Math.round((next.getTime() - today.getTime()) / 86400000);
  return { days, age: year > 1900 ? next.getFullYear() - year : undefined };
}

export function BirthdayReminder() {
  const { t } = useTranslation();
  const { friends } = useFriends();
  const [list, setList] = useState<Upcoming[]>([]);
  const [hidden, setHidden] = useState<string | null>("");
  const ids = friends.map((item) => item.user.id).sort().join(",");
  useEffect(() => {
    try { setHidden(window.localStorage.getItem(HIDE_KEY)); } catch { setHidden(null); }
  }, []);
  useEffect(() => {
    if (!supabase || !ids) { setList([]); return; }
    let active = true;
    void supabase.from("profiles").select("id,birthday").in("id", ids.split(",")).not("birthday", "is", null).then(({ data }) => {
      if (!active) return;
      const now = new Date();
      const found = ((data ?? []) as { id: string; birthday: string | null }[]).flatMap((row): Upcoming[] => {
        const when = row.birthday ? daysUntil(row.birthday, now) : null;
        const person = friends.find((item) => item.user.id === row.id);
        return when && person && when.days <= 7 ? [{ user: person.user, ...when }] : [];
      });
      setList(found.sort((a, b) => a.days - b.days));
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);
  const todayKey = new Date().toDateString();
  if (!list.length || hidden === "" || hidden === todayKey) return null;
  const today = list.filter((item) => item.days === 0);
  const soon = list.filter((item) => item.days > 0);
  const hide = () => { setHidden(todayKey); try { window.localStorage.setItem(HIDE_KEY, todayKey); } catch { /* private mode */ } };
  return (
    <Card className="mb-4 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F472B6]/15 text-[#F472B6]"><Cake size={17} /></span>
        <p className="flex-1 text-sm font-semibold">{t("bday.title")}</p>
        <button type="button" onClick={hide} aria-label={t("bday.hide")} title={t("bday.hide")} className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-text"><X size={14} /></button>
      </div>
      <ul className="space-y-2.5">
        {today.map(({ user, age }) => (
          <li key={user.id} className="flex items-center gap-3">
            <Link href={userHref(user.id)} className="shrink-0"><Avatar user={user} /></Link>
            <div className="min-w-0 flex-1">
              <Link href={userHref(user.id)} className="block truncate text-sm font-semibold hover:underline">{user.name}</Link>
              <p className="text-xs text-muted">🎂 {t("bday.today")}{age ? ` · ${t("bday.turns").replace("{n}", String(age))}` : ""}</p>
            </div>
            <Link href={`/messages?u=${user.id}`} aria-label={t("bday.congrats")} title={t("bday.congrats")} className="flex h-9 items-center gap-1.5 rounded-full bg-accent px-3 text-xs font-semibold text-bg hover:brightness-110"><MessageCircle size={14} /><span className="max-sm:hidden">{t("bday.congrats")}</span></Link>
            <Link href={`/gifts?to=${user.id}`} aria-label={t("bday.gift")} title={t("bday.gift")} className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-[#F472B6] hover:bg-surface-2"><Gift size={15} /></Link>
          </li>
        ))}
        {soon.map(({ user, days }) => (
          <li key={user.id} className="flex items-center gap-3">
            <Link href={userHref(user.id)} className="shrink-0"><Avatar user={user} size="sm" /></Link>
            <Link href={userHref(user.id)} className="min-w-0 flex-1 truncate text-[13px] font-medium hover:underline">{user.name}</Link>
            <span className="shrink-0 text-xs text-muted">{days === 1 ? t("bday.tomorrow") : t("bday.inDays").replace("{n}", String(days))}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
