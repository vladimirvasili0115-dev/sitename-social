"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
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

export default function FeedPage() {
  const { t } = useTranslation();
  const { feed } = usePosts();
  const { user } = useProfile();
  const { friends } = useFriends();
  const [tab, setTab] = useState<"forYou" | "following">("forYou");
  const posts = tab === "following" ? feed.filter((post) => post.mine || friends.some((item) => item.user.id === post.author.id)) : feed;
  const tabClass = (active: boolean) => cn("relative px-3 py-3 text-xs", active ? "font-semibold text-accent" : "font-medium text-muted hover:text-text");
  return <div className="mx-auto max-w-[620px]">
    <div className="mb-5 flex items-end justify-between px-1">
      <div>
        <p className="mb-1 text-xs font-medium tracking-wide text-accent">{t("feed.hello")}, {user.name.split(" ")[0]}</p>
        <h1 className="text-[23px] font-semibold tracking-[-0.035em]">{t("feed.subtitle")}</h1>
      </div>
      <button aria-label={t("feed.latest")} className="mb-1 flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:bg-surface-2"><span>{t("feed.latest")}</span><ChevronDown size={14} /></button>
    </div>
    <StoriesBar />
    <GamePromo />
    <PostComposer />
    <div className="mb-3 flex items-center gap-1 border-b border-border px-1">
      <button onClick={() => setTab("forYou")} aria-pressed={tab === "forYou"} className={tabClass(tab === "forYou")}>{t("feed.forYou")}{tab === "forYou" ? <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent" /> : null}</button>
      <button onClick={() => setTab("following")} aria-pressed={tab === "following"} className={tabClass(tab === "following")}>{t("feed.following")}{tab === "following" ? <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent" /> : null}</button>
    </div>
    {posts.length ? posts.map((post) => <PostCard key={post.id} post={post} />) : <Card className="p-8 text-center text-sm text-muted">{t("profile.noPosts")}</Card>}
  </div>;
}
