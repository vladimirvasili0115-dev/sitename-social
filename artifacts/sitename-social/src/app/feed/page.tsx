"use client";
import { useState } from "react";
import { usePosts } from "@/components/feed/usePosts";
import { useProfile } from "@/components/profile/useProfile";
import { useFriends } from "@/components/friends/useFriends";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";
import { StoriesBar } from "@/components/feed/StoriesBar";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard } from "@/components/feed/PostCard";
import { Card } from "@/components/ui/Card";
import { GamePromo } from "@/components/feed/GamePromo";
import { useSettings } from "@/components/settings/useSettings";
import { OnlineAside } from "@/components/feed/OnlineAside";
import { HomeTop, GameStrip } from "@/components/feed/HomeStyles";
import { BirthdayReminder } from "@/components/feed/BirthdayReminder";

export default function FeedPage() {
  const { t } = useTranslation();
  const { feed } = usePosts();
  const { user } = useProfile();
  const { settings } = useSettings();
  const style = settings.homeStyle ?? "neon";
  const { friends } = useFriends();
  const [tab, setTab] = useState<"forYou" | "following">("forYou");
  const posts = tab === "following" ? feed.filter((post) => post.mine || friends.some((item) => item.user.id === post.author.id)) : feed;
  const tabClass = (active: boolean) => cn("relative px-3 py-3 text-xs", active ? "font-semibold text-accent" : "font-medium text-muted hover:text-text");
  const body = <div className={style === "classic" ? "mx-auto max-w-[620px]" : "mx-auto min-w-0 max-w-[620px] flex-1 xl:mx-0"}>
    {style === "classic" && user.name ? <p className="mb-3 px-1 text-xs font-medium tracking-wide text-accent">{t("feed.hello")}, {user.name.split(" ")[0]}</p> : null}
    {style === "live" || style === "neon" ? <HomeTop style={style} name={user.name ? user.name.split(" ")[0] : ""} /> : null}
    {style === "social" ? <><PostComposer /><GameStrip /></> : null}
    <StoriesBar />
    <BirthdayReminder />
    {style === "classic" ? <GamePromo /> : null}
    {style !== "social" ? <PostComposer /> : null}
    <div className="mb-3 flex items-center gap-1 border-b border-border px-1">
      <button onClick={() => setTab("forYou")} aria-pressed={tab === "forYou"} className={tabClass(tab === "forYou")}>{t("feed.forYou")}{tab === "forYou" ? <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent" /> : null}</button>
      <button onClick={() => setTab("following")} aria-pressed={tab === "following"} className={tabClass(tab === "following")}>{t("feed.following")}{tab === "following" ? <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent" /> : null}</button>
    </div>
    {posts.length ? posts.map((post) => <PostCard key={post.id} post={post} />) : <Card className="p-8 text-center text-sm text-muted">{t("profile.noPosts")}</Card>}
  </div>;
  return style === "classic" ? body : <div className="flex items-start gap-5">{body}<OnlineAside /></div>;
}
