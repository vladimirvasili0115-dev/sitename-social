"use client";
import { useState, type ChangeEvent } from "react";
import { LoaderCircle, Upload } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { Tabs } from "@/components/ui/Tabs";
import { VideoCard } from "@/components/videos/VideoCard";
import { VideoModal } from "@/components/videos/VideoModal";
import { ReelsFeed } from "@/components/videos/ReelsFeed";
import { useVideos } from "@/components/videos/useVideos";
import type { TranslationKey } from "@/i18n/LanguageProvider";

type VideosTab = "all" | "reels" | "saved" | "mine";

export default function VideosPage() {
  const { t } = useTranslation();
  const { videos: all, reels: allReels, mine, liked, saved, savedList, toggleLike, toggleSave, commentsFor, addComment, removeComment, remove, upload } = useVideos();
  const [tab, setTab] = useState<VideosTab>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  const needle = query.trim().toLocaleLowerCase();
  const source = tab === "saved" ? savedList : tab === "mine" ? mine : all;
  const visible = source.filter((video) => !needle || `${video.title} ${video.author}`.toLocaleLowerCase().includes(needle));
  const open = [...all, ...allReels].find((video) => video.id === openId);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length || busy) return;
    const kind = tab === "reels" ? "reel" : "video";
    setBusy(true);
    setFailure(null);
    const result = await upload(files, kind);
    setBusy(false);
    if (result) return setFailure(result === "tooBig" ? "videos.tooBig" : "videos.uploadFailed");
    if (kind === "video") setTab("mine");
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center">
        <h1 className="flex-1 text-[23px] font-semibold tracking-[-0.035em]">{t("nav.videos")}</h1>
        <SearchInput value={query} onChange={setQuery} label={t("videos.search")} className="sm:w-[260px]" />
        <label aria-busy={busy} className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-bg hover:brightness-110 ${busy ? "cursor-wait opacity-70" : "cursor-pointer"}`}>
          {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}{t(busy ? "videos.uploading" : tab === "reels" ? "videos.uploadReel" : "videos.upload")}
          <input type="file" accept="video/*" multiple disabled={busy} className="sr-only" onChange={handleUpload} />
        </label>
      </div>
      {failure ? <p role="alert" className="mb-3 rounded-xl border border-danger px-4 py-2.5 text-sm text-danger">{t(failure)}</p> : null}
      <Tabs<VideosTab> active={tab} onChange={setTab} tabs={[{ id: "all", label: t("common.all"), count: all.length }, { id: "reels", label: t("videos.tabReels"), count: allReels.length }, { id: "saved", label: t("nav.saved"), count: savedList.length }, { id: "mine", label: t("videos.tabMine"), count: mine.length }]} />
      {tab === "reels" ? !allReels.length ? <Card className="p-8 text-center text-sm text-muted">{t("videos.emptyReels")}</Card> : <ReelsFeed reels={allReels} liked={liked} saved={saved} onLike={toggleLike} onSave={toggleSave} commentsFor={commentsFor} onComment={addComment} onRemoveComment={removeComment} onDelete={remove} /> : visible.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((video) => <li key={video.id}><VideoCard video={video} onOpen={() => setOpenId(video.id)} /></li>)}
        </ul>
      ) : <Card className="p-8 text-center text-sm text-muted">{needle ? t("friends.noResults") : t(tab === "mine" ? "videos.emptyMine" : "videos.empty")}</Card>}
      {open ? <VideoModal video={open} liked={liked.includes(open.id)} saved={saved.includes(open.id)} onLike={() => toggleLike(open.id)} onSave={() => toggleSave(open.id)} comments={commentsFor(open.id)} onComment={(text) => addComment(open.id, text)} onRemoveComment={(id) => removeComment(open.id, id)} onDelete={open.mine ? () => { remove(open.id); setOpenId(null); } : undefined} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}
