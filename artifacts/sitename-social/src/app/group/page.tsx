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
import { fetchGroupMembers, fetchPageEditors, setPageEditor } from "@/lib/groupsSync";
import { useAuth } from "@/components/auth/AuthProvider";
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
  // Pages: the helpers (editors) the owner chose; only the owner and the helpers post, everybody else follows, comments and likes.
  const me = useAuth().user?.id;
  const [editors, setEditors] = useState<string[]>([]);
  const isPage = Boolean(group?.isPage);
  useEffect(() => {
    if (!remote || !isPage) return;
    let active = true;
    void fetchPageEditors(id).then((list) => { if (active) setEditors(list); });
    return () => { active = false; };
  }, [id, remote, isPage]);
  async function toggleEditor(userId: string, on: boolean) {
    if (await setPageEditor(id, userId, on)) setEditors((list) => (on ? [...list, userId] : list.filter((item) => item !== userId)));
  }
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
            <p className="text-xs font-medium text-accent">{t(isPage ? "groups.pageBadge" : categoryLabels[group.category])}</p>
            <h1 className="mt-0.5 truncate text-2xl font-semibold tracking-[-0.03em]">{group.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><Users size={13} />{group.members.toLocaleString("ru")} {t(isPage ? "groups.followers" : "groups.members")}</p>
          </div>
          {group.joined
            ? <Button variant="outline" onClick={() => toggle(id)}><Check size={15} className="text-accent" />{t(isPage ? "groups.following" : "groups.joined")}</Button>
            : <Button onClick={() => toggle(id)}><Plus size={15} />{t(isPage ? "groups.follow" : "groups.join")}</Button>}
        </div>
      </Card>
      <div className="mt-4"><Tabs<GroupTab> active={tab} onChange={setTab} tabs={[{ id: "wall", label: t("profile.tabWall"), count: posts.length }, { id: "members", label: t(isPage ? "group.tabFollowers" : "group.tabMembers") }, { id: "about", label: t("profile.tabAbout") }]} /></div>
      {tab === "wall" ? (
        <div className="mx-auto max-w-[620px]">
          {isPage
            ? (group.mine || (me && editors.includes(me)) ? <PostComposer groupId={id} /> : <Card className="mb-4 p-4 text-center text-sm text-muted">{t("group.pageOnlyManagers")}</Card>)
            : group.joined ? <PostComposer groupId={id} /> : <Card className="mb-4 p-4 text-center text-sm text-muted">{t("group.joinToPost")}</Card>}
          {posts.length ? posts.map((post) => <PostCard key={post.id} post={post} />) : <Card className="p-8 text-center text-sm text-muted">{t("profile.noPosts")}</Card>}
        </div>
      ) : null}
      {tab === "members" ? <Card><ul className="grid divide-y divide-border md:grid-cols-2 md:divide-y-0">{(remote ? realMembers : sampleMembers).map((person) => <li key={person.user.id}><PersonRow person={person}>{isPage ? (() => {
            const helper = editors.includes(person.user.id);
            const owner = person.user.id === me && group.mine;
            if (owner) return <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted">{t("group.ownerBadge")}</span>;
            return <>
              {helper ? <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-accent">{t("group.editorBadge")}</span> : null}
              {group.mine && remote ? <Button variant="outline" className="h-8 px-3 text-xs" onClick={() => void toggleEditor(person.user.id, !helper)}>{t(helper ? "group.removeEditor" : "group.makeEditor")}</Button> : null}
            </>;
          })() : null}</PersonRow></li>)}</ul></Card> : null}
      {tab === "about" ? <SectionCard title={t("profile.tabAbout")}><p className="text-sm leading-6 text-text">{group.description || t("group.noDescription")}</p></SectionCard> : null}
    </div>
  );
}

export default function GroupPage() {
  return <Suspense fallback={null}><GroupView /></Suspense>;
}
