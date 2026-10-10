"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { Person } from "@/types";
import { people } from "@/data/friends";
import { remoteFriends } from "@/lib/friendsSync";
import { isRemoteId } from "@/lib/remoteProfiles";
import { supabase } from "@/lib/supabase";
import { fetchUsers } from "@/lib/usersCache";
import { useTranslation } from "@/i18n/useTranslation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { SettingsSection } from "./SettingsSection";
import { useSettings } from "./useSettings";

const online = Boolean(supabase);

export function BlockedSection() {
  const { t } = useTranslation();
  const { settings, update } = useSettings();
  const remote = useSyncExternalStore(remoteFriends.subscribe, remoteFriends.get, remoteFriends.getServer);
  const [query, setQuery] = useState("");
  const [known, setKnown] = useState<Person[]>([]);
  const blockedKey = settings.blocked.join(",");
  // Blocked accounts are left out of the usual lists, so their names are loaded separately.
  useEffect(() => {
    const ids = blockedKey.split(",").filter(isRemoteId);
    if (!online || !ids.length) return;
    let active = true;
    void fetchUsers(ids).then((users) => { if (active) setKnown(ids.flatMap((id) => users.get(id) ?? [])); });
    return () => { active = false; };
  }, [blockedKey]);
  const pool = online ? [...remote.everyone, ...known.filter((item) => !remote.everyone.some((entry) => entry.user.id === item.user.id))] : people;
  const blocked = pool.filter((item) => settings.blocked.includes(item.user.id));
  const needle = query.trim().toLocaleLowerCase();
  const results = needle ? pool.filter((item) => !settings.blocked.includes(item.user.id) && `${item.user.name} ${item.user.handle}`.toLocaleLowerCase().includes(needle)).slice(0, 5) : [];
  const toggle = (id: string) => update((current) => ({ ...current, blocked: current.blocked.includes(id) ? current.blocked.filter((item) => item !== id) : [...current.blocked, id] }));
  const row = (person: Person, isBlocked: boolean) => (
    <div key={person.user.id} className="flex items-center gap-3 p-3.5">
      <Avatar user={person.user} />
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{person.user.name}</p><p className="truncate text-xs text-muted">{person.city || `@${person.user.handle}`}</p></div>
      {isBlocked
        ? <Button variant="outline" className="h-9 px-3 text-xs" onClick={() => toggle(person.user.id)}>{t("settings.blkUnblock")}</Button>
        : <button onClick={() => { toggle(person.user.id); setQuery(""); }} className="h-9 rounded-xl border border-danger px-3 text-xs font-semibold text-danger hover:bg-surface-2">{t("settings.blkBlock")}</button>}
    </div>
  );
  return (
    <>
      <SearchInput value={query} onChange={setQuery} label={t("settings.blkAdd")} className="mb-4" />
      {results.length ? <SettingsSection>{results.map((person) => row(person, false))}</SettingsSection> : null}
      <SettingsSection title={`${t("settings.tabBlocked")} · ${blocked.length}`}>
        {blocked.length ? blocked.map((person) => row(person, true)) : <p className="p-6 text-center text-sm text-muted">{t("settings.blkEmpty")}</p>}
      </SettingsSection>
    </>
  );
}
