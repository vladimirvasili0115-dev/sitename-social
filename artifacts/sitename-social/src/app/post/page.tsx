"use client";
import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { fetchPost, remotePosts } from "@/lib/postsSync";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { PostCard } from "@/components/feed/PostCard";
import { useAuth } from "@/components/auth/AuthProvider";

// One post on its own page (opened from a notification or a shared link).
function OnePost() {
  const { t } = useTranslation();
  const id = useSearchParams().get("id") ?? "";
  const accountId = useAuth().user?.id;
  const remote = useSyncExternalStore(remotePosts.subscribe, remotePosts.get, remotePosts.getServer);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  useEffect(() => {
    if (!accountId) return;
    let active = true;
    setState("loading");
    void fetchPost(id).then((result) => { if (active) setState(result ? "ok" : "missing"); });
    return () => { active = false; };
  }, [id, accountId]);
  const post = remote.singles[id];
  if (state === "missing" && !post) return <Card className="p-8 text-center text-sm text-muted">{t("post.notFound")}</Card>;
  return post ? <PostCard key={post.id} post={post} openComments /> : null;
}

export default function PostPage() {
  return <div className="mx-auto max-w-[620px]"><Suspense fallback={null}><OnePost /></Suspense></div>;
}
