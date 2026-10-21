"use client";
import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { Hash } from "lucide-react";
import type { Post } from "@/types";
import { remotePosts, searchTag } from "@/lib/postsSync";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { PostCard } from "@/components/feed/PostCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSettings } from "@/components/settings/useSettings";

// All posts with one #hashtag.
function TagPosts() {
  const { t } = useTranslation();
  const tag = (useSearchParams().get("t") ?? "").replace(/^#/, "");
  const accountId = useAuth().user?.id;
  const { blocked } = useSettings().settings;
  const remote = useSyncExternalStore(remotePosts.subscribe, remotePosts.get, remotePosts.getServer);
  const [ids, setIds] = useState<string[] | null>(null);
  const posts = ids ? ids.flatMap((id): Post[] => (remote.singles[id] ? [remote.singles[id]] : [])) : null;
  useEffect(() => {
    if (!accountId) return;
    let active = true;
    setIds(null);
    void searchTag(tag).then((list) => { if (active) setIds(list.map((post) => post.id)); });
    return () => { active = false; };
  }, [tag, accountId]);
  const visible = (posts ?? []).filter((post) => !blocked.includes(post.author.id));
  return (
    <>
      <h1 className="mb-4 flex items-center gap-2 px-1 text-[23px] font-semibold tracking-[-0.035em]"><Hash size={22} className="text-accent" />{tag}</h1>
      {posts === null ? null : visible.length ? visible.map((post) => <PostCard key={post.id} post={post} />) : <Card className="p-8 text-center text-sm text-muted">{t("tag.empty")}</Card>}
    </>
  );
}

export default function TagPage() {
  return <div className="mx-auto max-w-[620px]"><Suspense fallback={null}><TagPosts /></Suspense></div>;
}
