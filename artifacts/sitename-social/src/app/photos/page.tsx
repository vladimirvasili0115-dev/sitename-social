"use client";
import { useState, type ChangeEvent } from "react";
import { ArrowLeft, Upload } from "lucide-react";
import type { AlbumId } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { usePhotos } from "@/components/photos/usePhotos";
import { PhotoGrid } from "@/components/photos/PhotoGrid";
import { AlbumCard } from "@/components/photos/AlbumCard";
import { Lightbox } from "@/components/photos/Lightbox";

type PhotosTab = "all" | "albums";
const albumLabels: Record<AlbumId, TranslationKey> = { profile: "photos.albumProfile", wall: "photos.albumWall", travel: "photos.albumTravel", friends: "photos.albumFriends", uploads: "photos.albumUploads" };

export default function PhotosPage() {
  const { t } = useTranslation();
  const { photos, albums: albumIds, upload, remove } = usePhotos();
  const [tab, setTab] = useState<PhotosTab>("all");
  const [album, setAlbum] = useState<AlbumId | null>(null);
  const [viewing, setViewing] = useState<number | null>(null);
  const inAlbum = tab === "albums" && album;
  const visible = inAlbum ? photos.filter((photo) => photo.album === album) : photos;

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length && (await upload(files))) {
      setTab("albums");
      setAlbum("uploads");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 px-1">
        <h1 className="text-[23px] font-semibold tracking-[-0.035em]">{t("nav.photos")}</h1>
        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-bg hover:brightness-110">
          <Upload size={16} />{t("photos.upload")}
          <input type="file" accept="image/*" multiple className="sr-only" onChange={handleUpload} />
        </label>
      </div>
      <Tabs<PhotosTab> active={tab} onChange={(next) => { setTab(next); setAlbum(null); }} tabs={[{ id: "all", label: t("photos.tabAll"), count: photos.length }, { id: "albums", label: t("photos.tabAlbums"), count: albumIds.length }]} />
      {tab === "albums" && !album ? (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {albumIds.map((id) => {
            const items = photos.filter((photo) => photo.album === id);
            return <li key={id}><AlbumCard title={t(albumLabels[id])} cover={items[0]?.src} count={items.length} onOpen={() => setAlbum(id)} /></li>;
          })}
        </ul>
      ) : (
        <>
          {inAlbum ? (
            <button onClick={() => setAlbum(null)} className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold text-text hover:text-accent">
              <ArrowLeft size={16} />{t(albumLabels[album])}<span className="font-normal text-muted">{visible.length}</span>
            </button>
          ) : null}
          {visible.length ? <PhotoGrid photos={visible} onOpen={setViewing} /> : <Card className="p-8 text-center text-sm text-muted">{t("photos.empty")}</Card>}
        </>
      )}
      {viewing !== null && visible.length ? (
        <Lightbox photos={visible} index={Math.min(viewing, visible.length - 1)} onChange={setViewing} onClose={() => setViewing(null)} onDelete={(photo) => { remove(photo.id); if (visible.length <= 1) setViewing(null); }} />
      ) : null}
    </div>
  );
}
