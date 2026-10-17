"use client";
import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { Tabs } from "@/components/ui/Tabs";
import { useFriends } from "@/components/friends/useFriends";
import { useSettings } from "@/components/settings/useSettings";
import { OnlineCard, type OnlineRelation } from "@/components/online/OnlineCard";

type OnlineTab = "all" | "friends";

export default function OnlinePage() {
  const { t } = useTranslation();
  const { directory, friends, outgoingIds, actions } = useFriends();
  const { blocked } = useSettings().settings;
  const online = directory.filter((item) => item.user.online && !blocked.includes(item.user.id));
  const cities = Array.from(new Set(online.map((item) => item.city).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const [tab, setTab] = useState<OnlineTab>("all");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const isFriend = (id: string) => friends.some((item) => item.user.id === id);
  const onlineFriends = online.filter((item) => isFriend(item.user.id));
  const needle = query.trim().toLocaleLowerCase();
  const visible = (tab === "friends" ? onlineFriends : online)
    .filter((item) => !city || item.city === city)
    .filter((item) => !needle || `${item.user.name} ${item.user.handle}`.toLocaleLowerCase().includes(needle));
  const relation = (id: string): OnlineRelation => (isFriend(id) ? "friend" : outgoingIds.includes(id) ? "pending" : "none");

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h1 className="text-[23px] font-semibold tracking-[-0.035em]">{t("nav.online")}</h1>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 motion-safe:animate-ping" /><span className="relative h-2 w-2 rounded-full bg-accent" /></span>
            {online.length} {t("online.count")}
          </p>
        </div>
        <SearchInput value={query} onChange={setQuery} label={t("friends.search")} className="sm:w-[240px]" />
        <select value={city} onChange={(event) => setCity(event.target.value)} aria-label={t("profile.city")} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-accent">
          <option value="">{t("online.allCities")}</option>
          {cities.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <Tabs<OnlineTab> active={tab} onChange={setTab} tabs={[{ id: "all", label: t("common.all"), count: online.length }, { id: "friends", label: t("nav.friends"), count: onlineFriends.length }]} />
      {visible.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {visible.map((person) => <li key={person.user.id}><OnlineCard person={person} relation={relation(person.user.id)} onAdd={() => actions.add(person.user.id)} /></li>)}
        </ul>
      ) : <Card className="p-8 text-center text-sm text-muted">{t("friends.noResults")}</Card>}
    </div>
  );
}
