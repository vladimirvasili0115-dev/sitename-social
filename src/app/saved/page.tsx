"use client";
import { useState } from "react";
import { savedPostsStore } from "@/lib/stores";
import { useToggleList } from "@/lib/useToggleList";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { usePosts } from "@/components/feed/usePosts";
import { PostCard } from "@/components/feed/PostCard";
import { VideoCard } from "@/components/videos/VideoCard";
import { VideoModal } from "@/components/videos/VideoModal";
import { useVideos } from "@/components/videos/useVideos";

type SavedTab = "posts" | "videos";

export default function SavedPage() {
  const { t } = useTranslation();
  const [savedPosts] = useToggleList(savedPostsStore);
  const { all: allPosts } = usePosts();
  const { savedList: videoList, liked: likedVideos, toggleLike: toggleLikedVideo, toggleSave: toggleSavedVideo, commentsFor, addComment, removeComment } = useVideos();
  const [tab, setTab] = useState<SavedTab>("posts");
  const [openId, setOpenId] = useState<string | null>(null);
  const postList = allPosts.filter((post) => savedPosts.includes(post.id));
  const open = videoList.find((video) => video.id === openId);
  const empty = <Card className="p-8 text-center text-sm text-muted">{t("saved.empty")}</Card>;
  return (
    <div>
      <h1 className="mb-4 px-1 text-[23px] font-semibold tracking-[-0.035em]">{t("nav.saved")}</h1>
      <Tabs<SavedTab> active={tab} onChange={setTab} tabs={[{ id: "posts", label: t("saved.tabPosts"), count: postList.length }, { id: "videos", label: t("nav.videos"), count: videoList.length }]} />
      {tab === "posts" ? (postList.length ? <div className="mx-auto max-w-[620px]">{postList.map((post) => <PostCard key={post.id} post={post} />)}</div> : empty) : null}
      {tab === "videos" ? (videoList.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {videoList.map((video) => <li key={video.id}><VideoCard video={video} onOpen={() => setOpenId(video.id)} /></li>)}
        </ul>
      ) : empty) : null}
      {open ? <VideoModal video={open} liked={likedVideos.includes(open.id)} saved onLike={() => toggleLikedVideo(open.id)} onSave={() => { toggleSavedVideo(open.id); setOpenId(null); }} comments={commentsFor(open.id)} onComment={(text) => addComment(open.id, text)} onRemoveComment={(id) => removeComment(open.id, id)} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}
