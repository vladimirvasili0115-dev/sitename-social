"use client";
import { useEffect, useState } from "react";
import { Ban, Coins, FileText, Flag, Gift, Images, Mail, MessageSquare, Music2, UserPlus, Users, UsersRound, Video, Wifi, type LucideIcon } from "lucide-react";
import { fetchStats, type AdminStats } from "@/lib/adminSync";
import { formatCount } from "@/lib/format";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";

type Tile = { key: keyof AdminStats; label: TranslationKey; icon: LucideIcon };
const people: Tile[] = [
  { key: "profiles", label: "admin.statUsers", icon: Users }, { key: "online", label: "common.onlineNow", icon: Wifi },
  { key: "newDay", label: "admin.statNewDay", icon: UserPlus }, { key: "newWeek", label: "admin.statNewWeek", icon: UserPlus },
  { key: "banned", label: "admin.statBanned", icon: Ban }, { key: "openReports", label: "admin.tabReports", icon: Flag },
];
const content: Tile[] = [
  { key: "posts", label: "saved.tabPosts", icon: FileText }, { key: "comments", label: "post.comments", icon: MessageSquare },
  { key: "messages", label: "nav.messages", icon: Mail }, { key: "photos", label: "nav.photos", icon: Images },
  { key: "videos", label: "nav.videos", icon: Video }, { key: "tracks", label: "nav.music", icon: Music2 },
  { key: "groups", label: "nav.groups", icon: UsersRound }, { key: "gifts", label: "nav.gifts", icon: Gift },
  { key: "coins", label: "admin.statCoins", icon: Coins },
];

export function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void fetchStats().then((result) => {
      if (!active) return;
      setStats(result);
      setFailed(!result);
    });
    return () => { active = false; };
  }, []);
  if (failed) return <Card className="p-8 text-center text-sm text-muted">{t("admin.loadFailed")}</Card>;
  const grid = (tiles: Tile[]) => (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {tiles.map(({ key, label, icon: Icon }) => (
        <li key={key}>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted"><Icon size={15} className="shrink-0 text-accent" /><span className="truncate capitalize">{t(label)}</span></div>
            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-[-0.03em]">{stats ? formatCount(stats[key] ?? 0) : "—"}</p>
          </Card>
        </li>
      ))}
    </ul>
  );
  return (
    <>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">{t("admin.groupPeople")}</h2>
      {grid(people)}
      <h2 className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide text-muted">{t("admin.groupContent")}</h2>
      {grid(content)}
    </>
  );
}
