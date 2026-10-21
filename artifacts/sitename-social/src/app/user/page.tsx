"use client";
import { VerifiedMark, useVerified } from "@/components/ui/VerifiedMark";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AtSign, MapPin, Users } from "lucide-react";
import { guestsStore, invisibleStore } from "@/lib/stores";
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { usePosts } from "@/components/feed/usePosts";
import { PostCard } from "@/components/feed/PostCard";
import { ProfilePhotos } from "@/components/profile/ProfilePhotos";
import { ProfileVideos } from "@/components/profile/ProfileVideos";
import { SectionCard } from "@/components/profile/SectionCard";
import { useSettings } from "@/components/settings/useSettings";
import { UserActions } from "@/components/user/UserActions";
import { usePerson } from "@/components/user/usePerson";
import { fetchUserPhotos } from "@/lib/photosSync";
import { recordVisit } from "@/lib/guestsSync";
import { fetchAccess, fullAccess, type Access } from "@/lib/access";

type UserTab = "wall" | "photos" | "videos" | "about";

function UserProfile() {
  const { t } = useTranslation();
  const id = useSearchParams().get("id") ?? "";
  const { person, loading, remote } = usePerson(id);
  const { byAuthor } = usePosts();
  const { settings, update } = useSettings();
  const [tab, setTab] = useState<UserTab>("wall");
  const [remotePhotos, setRemotePhotos] = useState<string[]>([]);
  const [access, setAccess] = useState<Access>(fullAccess);
  useEffect(() => {
    if (!remote) return;
    void recordVisit(id);
    let active = true;
    void fetchAccess(id).then((result) => { if (active) setAccess(result); });
    void fetchUserPhotos(id).then((list) => { if (active) setRemotePhotos(list.map((photo) => photo.src)); });
    return () => { active = false; };
  }, [id, remote]);
  const blocked = settings.blocked.includes(id);
  const official = useVerified(id) === "official";
  const known = Boolean(person) && !remote;

  // Record the visit unless invisible mode hides it.
  useEffect(() => {
    const invisible = invisibleStore.read();
    if (!known || (invisible.enabled && invisible.hideVisits)) return;
    const current = guestsStore.read();
    guestsStore.write({ ...current, visited: [{ userId: id, at: Date.now() }, ...current.visited.filter((visit) => visit.userId !== id)] });
  }, [id, known]);

  if (loading) return null;
  if (!person) return <Card className="p-8 text-center text-sm text-muted">{t("user.notFound")}</Card>;
  const { user, city, mutual, status, cover } = person;
  const toggleBlock = () => update((current) => ({ ...current, blocked: blocked ? current.blocked.filter((item) => item !== id) : [...current.blocked, id] }));
  const posts = byAuthor(id);
  const photos = remote ? remotePhotos : Array.from({ length: 9 }, (_, index) => `https://picsum.photos/seed/user-${id}-${index}/600/600`);
  const stats = remote
    ? [{ label: t("saved.tabPosts"), value: posts.length }, { label: t("nav.photos"), value: photos.length }]
    : [{ label: t("nav.friends"), value: 40 + mutual * 7 }, { label: t("friends.mutual"), value: mutual }, { label: t("nav.photos"), value: photos.length }];
  return (
    <div className="mx-auto max-w-[780px]">
      <Card className="overflow-hidden">
        <div className="h-36 bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] sm:h-52">{cover || !remote ? <img src={cover ?? `https://picsum.photos/seed/cover-${id}/1400/420`} alt="" className="h-full w-full object-cover" /> : null}</div>
        <div className="px-5 pb-6 sm:px-9">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <span className={`-mt-14 block h-28 w-28 shrink-0 rounded-full p-[3px] sm:-mt-16 sm:h-32 sm:w-32 ${official ? "bg-[linear-gradient(135deg,#F6D365,#E7B93C,#B8860B)] p-[4px]" : "bg-[linear-gradient(135deg,var(--accent),var(--accent-2))]"}`}>
              <img src={user.avatar} alt={user.name} className="h-full w-full rounded-full border-4 border-surface object-cover" />
            </span>
            <div className="min-w-0 flex-1 sm:pb-1 sm:pt-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="truncate text-2xl font-semibold tracking-[-0.03em]">{user.name}<VerifiedMark userId={user.id} size={21} /></h1>
                {official ? <span className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold" style={{ borderColor: "#E7B93C", color: "#E7B93C" }}>{t("verified.official")}</span> : null}
                <span className={`flex items-center gap-1.5 text-xs font-medium ${user.online ? "text-accent" : "text-muted"}`}><span className={`h-2 w-2 rounded-full ${user.online ? "bg-accent" : "bg-border"}`} />{t(user.online ? "common.onlineNow" : "messages.offline")}</span>
              </div>
              <p className="mt-0.5 text-sm text-muted">@{user.handle}</p>
              {status ? <p className="mt-2 text-sm leading-6 text-text">{status}</p> : null}
              {city ? <p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><MapPin size={13} />{city}</p> : null}
            </div>
            {blocked ? <Button variant="outline" onClick={toggleBlock}>{t("settings.blkUnblock")}</Button> : <UserActions userId={id} onBlock={toggleBlock} access={access} />}
          </div>
          <dl className={`mt-5 grid gap-2 border-t border-border pt-4 ${remote ? "grid-cols-2" : "grid-cols-3"}`}>
            {stats.map((stat) => <div key={stat.label} className="text-center"><dd className="text-lg font-semibold tabular-nums">{stat.value}</dd><dt className="truncate text-[11px] text-muted">{stat.label}</dt></div>)}
          </dl>
        </div>
      </Card>
      {blocked || !access.profile ? <Card className="mt-4 p-8 text-center text-sm text-muted">{t(blocked ? "user.blocked" : "user.private")}</Card> : (
        <>
          <div className="mt-4"><Tabs<UserTab> active={tab} onChange={setTab} tabs={[{ id: "wall", label: t("profile.tabWall"), count: posts.length }, { id: "photos", label: t("nav.photos"), count: photos.length }, { id: "videos", label: t("nav.videos"), count: posts.filter((post) => post.video).length }, { id: "about", label: t("profile.tabAbout") }]} /></div>
          {tab === "wall" ? <div className="mx-auto max-w-[620px]">{posts.length ? posts.map((post) => <PostCard key={post.id} post={post} />) : <Card className="p-8 text-center text-sm text-muted">{t("profile.noPosts")}</Card>}</div> : null}
          {tab === "photos" ? <ProfilePhotos photos={photos} full /> : null}
          {tab === "videos" ? <ProfileVideos videos={posts.filter((post) => post.video)} full /> : null}
          {tab === "about" ? (
            <SectionCard title={t("profile.tabAbout")}>
              <dl className="grid gap-3 sm:grid-cols-2">
                {[{ icon: AtSign, label: t("user.username"), value: user.handle }, { icon: MapPin, label: t("profile.city"), value: city }, { icon: Users, label: t("friends.mutual"), value: remote ? "" : String(mutual) }].filter((row) => row.value).map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3"><Icon size={16} className="mt-0.5 shrink-0 text-muted" /><div><dt className="text-[11px] capitalize text-muted">{label}</dt><dd className="text-[13px] text-text">{value}</dd></div></div>
                ))}
              </dl>
            </SectionCard>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function UserPage() {
  return <Suspense fallback={null}><UserProfile /></Suspense>;
}
