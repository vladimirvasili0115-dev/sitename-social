"use client";
import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { useGroups } from "@/components/groups/useGroups";
import { GroupCard } from "@/components/groups/GroupCard";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import { CreatePageModal } from "@/components/groups/CreatePageModal";
import { myCanCreatePage } from "@/lib/groupsSync";

type GroupsTab = "mine" | "discover" | "pages";

export default function GroupsPage() {
  const { t } = useTranslation();
  const { groups, toggle, create, createPage, remove } = useGroups();
  const [canPage, setCanPage] = useState(false);
  const [makingPage, setMakingPage] = useState(false);
  useEffect(() => { void myCanCreatePage().then(setCanPage); }, []);
  const [tab, setTab] = useState<GroupsTab>("mine");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const pages = groups.filter((group) => group.isPage);
  const mine = groups.filter((group) => group.joined && !group.isPage);
  const discover = groups.filter((group) => !group.joined && !group.isPage);
  const needle = query.trim().toLocaleLowerCase();
  const visible = (tab === "mine" ? mine : tab === "pages" ? pages : discover).filter((group) => !needle || `${group.name} ${group.description}`.toLocaleLowerCase().includes(needle));
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center">
        <h1 className="flex-1 text-[23px] font-semibold tracking-[-0.035em]">{t("nav.groups")}</h1>
        <label className="flex h-11 items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 text-muted focus-within:border-accent sm:w-[260px]">
          <Search size={16} className="shrink-0" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label={t("groups.search")} placeholder={t("groups.search")} className="w-full min-w-0 bg-transparent text-sm text-text outline-none placeholder:text-muted" />
        </label>
        {canPage ? <Button variant="outline" className="h-11" onClick={() => setMakingPage(true)}><Plus size={16} />{t("groups.createPage")}</Button> : null}
        <Button className="h-11" onClick={() => setCreating(true)}><Plus size={16} />{t("groups.create")}</Button>
      </div>
      <Tabs<GroupsTab> active={tab} onChange={setTab} tabs={[{ id: "mine", label: t("groups.tabMine"), count: mine.length }, { id: "discover", label: t("groups.tabDiscover"), count: discover.length }, { id: "pages", label: t("groups.tabPages"), count: pages.length }]} />
      {visible.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((group) => <li key={group.id}><GroupCard group={group} onToggle={() => toggle(group.id)} onRemove={() => remove(group.id)} /></li>)}
        </ul>
      ) : <Card className="p-8 text-center text-sm text-muted">{needle ? t("friends.noResults") : t(tab === "mine" ? "groups.emptyMine" : tab === "pages" ? "groups.emptyPages" : "groups.emptyDiscover")}</Card>}
      {makingPage ? <CreatePageModal onCreate={(input) => { createPage(input); setTab("pages"); }} onClose={() => setMakingPage(false)} /> : null}
      {creating ? <CreateGroupModal onCreate={(input) => { create(input); setTab("mine"); }} onClose={() => setCreating(false)} /> : null}
    </div>
  );
}
