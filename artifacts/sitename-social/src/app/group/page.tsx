"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Plus, Users } from "lucide-react";
import { people } from "@/data/friends";
import { currentUser } from "@/data/users";
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { usePosts } from "@/components/feed/usePosts";
import { PostCard } from "@/components/feed/PostCard";
import { PostComposer } from "@/components/feed/PostComposer";
import { categoryLabels } from "@/components/groups/GroupCard";
import { useGroups } from "@/components/groups/useGroups";
import { PersonRow } from "@/components/people/PersonRow";
import { SectionCard } from "@/components/profile/SectionCard";
import { useProfile } from "@/components/profile/useProfile";
import type { Person } from "@/types";
import { fetchGroupMembers } from "@/lib/groupsSync";
import { isRemoteId, loadGroupPosts } from "@/lib/postsSync";

type GroupTab = "wall" | "members" | "about";

function GroupView() {
  const { t } = useTranslation();
  const id = useSearchParams().get("id") ?? "";
  const { groups, toggle } = useGroups();
  const { inGroup } = usePosts();
  const { user } = useProfile();
  const [tab, setTab] = useState<GroupTab>("wall");
  const group = groups.find((item) => item.id === id);
  const remote = isRemoteId(id);
  const memberCount = group?.members;
  const [realMembers, setRealMembers] = useState<Person[]>([]);
  useEffect(() => {
    if (!remote) return;
    void loadGroupPosts(id);
    let active = true;
    void fetchGroupMembers(id).then((list) => { if (active) setRealMembers(list); });
    return () => { active = false; };
  }, [id, remote, memberCount]);
  if (!group) return <Card className="p-8 text-center text-sm text-muted">{t("group.notFound")}</Card>;
  const posts = inGroup(id);
  const seed = id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const sample = group.mine ? [] : Array.from({ length: 8 }, (_, index) => people[(seed + index * 3) % people.length]).filter((person, index, list) => list.indexOf(person) === index);
  const sampleMembers = group.joined ? [{ user: { ...user, id: currentUser.id }, city: t("common.you"), mutual: 0 }, ...sample] : sample;
  return (
    <div>
      <Card className="overflow-hidden">
        <div className="h-32 bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] sm:h-48">{group.cover ? <img src={group.cover} alt="" className="h-full w-full object-cover" /> : null}</div>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-accent">{t(categoryLabels[group.category])}</p>
            <h1 className="mt-0.5 truncate text-2xl font-semibold tracking-[-0.03em]">{group.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><Users size={13} />{group.members.toLocaleString("ru")} {t("groups.members")}</p>
          </div>
          {group.joined
            ? <Button variant="outline" onClick={() => toggle(id)}><Check size={15} className="text-accent" />{t("groups.joined")}</Button>
            : <Button onClick={() => toggle(id)}><Plus size={15} />{t("groups.join")}</Button>}
        </div>
      </Card>
      <div className="mt-4"><Tabs<GroupTab> active={tab} onChange={setTab} tabs={[{ id: "wall", label: t("profile.tabWall"), count: posts.length }, { id: "members", label: t("group.tabMembers") }, { id: "about", label: t("profile.tabAbout") }]} /></div>
      {tab === "wall" ? (
        <div className="mx-auto max-w-[620px]">
          {group.joined ? <PostComposer groupId={id} /> : <Card className="mb-4 p-4 text-center text-sm text-muted">{t("group.joinToPost")}</Card>}
          {posts.length ? posts.map((post) => <PostCard key={post.id} post={post} />) : <Card className="p-8 text-center text-sm text-muted">{t("profile.noPosts")}</Card>}
        </div>
      ) : null}
      {tab === "members" ? <Card><ul className="grid divide-y divide-border md:grid-cols-2 md:divide-y-0">{(remote ? realMembers : sampleMembers).map((person) => <li key={person.user.id}><PersonRow person={person} /></li>)}</ul></Card> : null}
      {tab === "about" ? <SectionCard title={t("profile.tabAbout")}><p className="text-sm leading-6 text-text">{group.description || t("group.noDescription")}</p></SectionCard> : null}
    </div>
  );
}

export default function GroupPage() {
  return <Suspense fallback={null}><GroupView /></Suspense>;
}
