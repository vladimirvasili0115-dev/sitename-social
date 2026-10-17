"use client";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { Tabs } from "@/components/ui/Tabs";
import { usePosts } from "@/components/feed/usePosts";
import { PostCard } from "@/components/feed/PostCard";
import { GroupCard } from "@/components/groups/GroupCard";
import { useGroups } from "@/components/groups/useGroups";
import { PersonRow } from "@/components/people/PersonRow";
import { useSettings } from "@/components/settings/useSettings";
import { useFriends } from "@/components/friends/useFriends";

type SearchTab = "people" | "groups" | "posts";

function SearchView() {
  const { t } = useTranslation();
  const router = useRouter();
  const query = useSearchParams().get("q") ?? "";
  const [draft, setDraft] = useState(query);
  const [tab, setTab] = useState<SearchTab>("people");
  const { all } = usePosts();
  const { groups, toggle, remove } = useGroups();
  const { blocked } = useSettings().settings;
  const { directory: people } = useFriends();
  useEffect(() => setDraft(query), [query]);

  const needle = query.trim().toLocaleLowerCase();
  const has = (text: string) => text.toLocaleLowerCase().includes(needle);
  const foundPeople = needle ? people.filter((item) => !blocked.includes(item.user.id) && has(`${item.user.name} ${item.user.handle} ${item.city}`)) : [];
  const foundGroups = needle ? groups.filter((group) => has(`${group.name} ${group.description}`)) : [];
  const foundPosts = needle ? all.filter((post) => has(`${post.text} ${post.author.name}`)) : [];
  const counts = { people: foundPeople.length, groups: foundGroups.length, posts: foundPosts.length };
  const empty = <Card className="p-8 text-center text-sm text-muted">{t("friends.noResults")}</Card>;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/search?q=${encodeURIComponent(draft.trim())}`);
  }

  return (
    <div>
      <h1 className="mb-4 px-1 text-[23px] font-semibold tracking-[-0.035em]">{t("common.search")}</h1>
      <form onSubmit={handleSubmit} className="mb-4"><SearchInput value={draft} onChange={setDraft} label={t("header.search")} /></form>
      {needle ? (
        <>
          <Tabs<SearchTab> active={tab} onChange={setTab} tabs={[{ id: "people", label: t("search.tabPeople"), count: counts.people }, { id: "groups", label: t("nav.groups"), count: counts.groups }, { id: "posts", label: t("saved.tabPosts"), count: counts.posts }]} />
          {tab === "people" ? (foundPeople.length ? <Card><ul className="grid divide-y divide-border md:grid-cols-2 md:divide-y-0">{foundPeople.map((person) => <li key={person.user.id}><PersonRow person={person} /></li>)}</ul></Card> : empty) : null}
          {tab === "groups" ? (foundGroups.length ? <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{foundGroups.map((group) => <li key={group.id}><GroupCard group={group} onToggle={() => toggle(group.id)} onRemove={() => remove(group.id)} /></li>)}</ul> : empty) : null}
          {tab === "posts" ? (foundPosts.length ? <div className="mx-auto max-w-[620px]">{foundPosts.map((post) => <PostCard key={post.id} post={post} />)}</div> : empty) : null}
        </>
      ) : <Card className="p-8 text-center text-sm text-muted">{t("search.hint")}</Card>}
    </div>
  );
}

export default function SearchPage() {
  return <Suspense fallback={null}><SearchView /></Suspense>;
}
