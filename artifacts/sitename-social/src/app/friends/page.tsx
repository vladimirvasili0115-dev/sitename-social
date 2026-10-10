"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import type { Person } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import { useFriends } from "@/components/friends/useFriends";
import { FriendsTabs, type FriendsTab } from "@/components/friends/FriendsTabs";
import { FriendsList } from "@/components/friends/FriendsList";

export default function FriendsPage() {
  const { t } = useTranslation();
  const { friends, incoming, outgoing, suggestions, outgoingIds, actions } = useFriends();
  const [tab, setTab] = useState<FriendsTab>("all");
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase();
  const match = (list: Person[]) => (needle ? list.filter(({ user, city }) => `${user.name} ${user.handle} ${city}`.toLocaleLowerCase().includes(needle)) : list);
  const online = friends.filter((item) => item.user.online);
  const counts = { all: friends.length, online: online.length, requests: incoming.length, suggestions: suggestions.length };
  const empty = (key: Parameters<typeof t>[0]) => (needle ? t("friends.noResults") : t(key));
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[23px] font-semibold tracking-[-0.035em]">{t("nav.friends")}</h1>
        <label className="flex h-11 items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 text-muted focus-within:border-accent sm:w-[300px]">
          <Search size={16} className="shrink-0" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label={t("friends.search")} placeholder={t("friends.search")} className="w-full min-w-0 bg-transparent text-sm text-text outline-none placeholder:text-muted" />
        </label>
      </div>
      <FriendsTabs active={tab} counts={counts} onChange={setTab} />
      {tab === "all" ? <FriendsList people={match(friends)} kind="friend" actions={actions} empty={empty("friends.emptyAll")} /> : null}
      {tab === "online" ? <FriendsList people={match(online)} kind="friend" actions={actions} empty={empty("friends.emptyOnline")} /> : null}
      {tab === "requests" ? (
        <>
          <FriendsList title={t("friends.incoming")} people={match(incoming)} kind="incoming" actions={actions} empty={empty("friends.emptyRequests")} />
          {outgoing.length ? <FriendsList title={t("friends.outgoing")} people={match(outgoing)} kind="outgoing" actions={actions} empty={t("friends.noResults")} /> : null}
        </>
      ) : null}
      {tab === "suggestions" ? <FriendsList people={match(suggestions)} kind={(person) => (outgoingIds.includes(person.user.id) ? "outgoing" : "suggestion")} actions={actions} empty={empty("friends.emptySuggestions")} /> : null}
    </div>
  );
}
