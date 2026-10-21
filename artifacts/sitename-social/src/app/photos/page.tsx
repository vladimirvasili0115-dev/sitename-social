"use client";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowLeft, FolderPlus, Pencil, Trash2, Upload } from "lucide-react";
import type { AlbumId } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { usePhotos } from "@/components/photos/usePhotos";
import { PhotoGrid } from "@/components/photos/PhotoGrid";
import { AlbumCard } from "@/components/photos/AlbumCard";
import { Lightbox } from "@/components/photos/Lightbox";

type PhotosTab = "all" | "albums";
// An open album: one of the built-in ones, or one of your own (by id).
type Open = { kind: "builtin"; id: AlbumId } | { kind: "custom"; id: string } | null;
const albumLabels: Record<AlbumId, TranslationKey> = { profile: "photos.albumProfile", wall: "photos.albumWall", travel: "photos.albumTravel", friends: "photos.albumFriends", uploads: "photos.albumUploads" };
const field = "h-10 min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-3.5 text-sm text-text outline-none focus:border-accent";

export default function PhotosPage() {
  const { t } = useTranslation();
  const { photos, albums: albumIds, upload, remove, custom, canAlbums, createAlbum, renameAlbum, deleteAlbum, move } = usePhotos();
  const [tab, setTab] = useState<PhotosTab>("all");
  const [album, setAlbum] = useState<Open>(null);
  const [viewing, setViewing] = useState<number | null>(null);
  const [naming, setNaming] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const customAlbum = album?.kind === "custom" ? custom.find((item) => item.id === album.id) : undefined;
  const inAlbum = tab === "albums" && album;
  const visible = !inAlbum ? photos
    : album.kind === "custom" ? photos.filter((photo) => photo.albumId === album.id)
    : photos.filter((photo) => photo.album === album.id && !(album.id === "uploads" && photo.albumId));

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setBusy(true);
    const into = customAlbum?.id;
    const added = await upload(files, into);
    setBusy(false);
    if (added && !into) {
      setTab("albums");
      setAlbum({ kind: "builtin", id: "uploads" });
    }
  }
  async function submitAlbum(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = naming?.trim();
    if (!title) return;
    setNaming(null);
    const id = await createAlbum(title);
    if (id) { setTab("albums"); setAlbum({ kind: "custom", id }); }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
        <h1 className="text-[23px] font-semibold tracking-[-0.035em]">{t("nav.photos")}</h1>
        <div className="flex gap-2">
          {canAlbums ? <Button variant="outline" className="h-11 px-3" onClick={() => setNaming((value) => (value === null ? "" : null))}><FolderPlus size={16} /><span className="max-sm:hidden">{t("photos.newAlbum")}</span></Button> : null}
          <label className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-bg hover:brightness-110 ${busy ? "pointer-events-none opacity-60" : ""}`}>
            <Upload size={16} />{busy ? t("story.uploading") : customAlbum ? t("photos.uploadHere") : t("photos.upload")}
            <input type="file" accept="image/*" multiple className="sr-only" onChange={handleUpload} />
          </label>
        </div>
      </div>
      {naming !== null ? (
        <Card className="mb-4 p-3">
          <form onSubmit={submitAlbum} className="flex gap-2">
            <input autoFocus value={naming} onChange={(event) => setNaming(event.target.value)} maxLength={80} placeholder={t("photos.albumName")} aria-label={t("photos.albumName")} className={field} />
            <Button type="submit" className="h-10 px-4 text-xs" disabled={!naming.trim()}>{t("photos.create")}</Button>
          </form>
        </Card>
      ) : null}
      <Tabs<PhotosTab> active={tab} onChange={(next) => { setTab(next); setAlbum(null); }} tabs={[{ id: "all", label: t("photos.tabAll"), count: photos.length }, { id: "albums", label: t("photos.tabAlbums"), count: albumIds.length + custom.length }]} />
      {tab === "albums" && !album ? (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {custom.map((item) => {
            const items = photos.filter((photo) => photo.albumId === item.id);
            return <li key={item.id}><AlbumCard title={item.title} cover={items[0]?.src} count={items.length} onOpen={() => setAlbum({ kind: "custom", id: item.id })} /></li>;
          })}
          {albumIds.map((id) => {
            const items = photos.filter((photo) => photo.album === id && !(id === "uploads" && photo.albumId));
            return <li key={id}><AlbumCard title={t(albumLabels[id])} cover={items[0]?.src} count={items.length} onOpen={() => setAlbum({ kind: "builtin", id })} /></li>;
          })}
        </ul>
      ) : (
        <>
          {inAlbum ? (
            <div className="mb-3 flex items-center gap-2 px-1">
              <button onClick={() => { setAlbum(null); setRenaming(null); }} className="flex min-w-0 items-center gap-2 text-sm font-semibold text-text hover:text-accent">
                <ArrowLeft size={16} className="shrink-0" /><span className="truncate">{album.kind === "custom" ? customAlbum?.title ?? "" : t(albumLabels[album.id])}</span><span className="font-normal text-muted">{visible.length}</span>
              </button>
              {customAlbum ? (
                <span className="ml-auto flex gap-1">
                  <button onClick={() => setRenaming(customAlbum.title)} aria-label={t("photos.rename")} title={t("photos.rename")} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-text"><Pencil size={15} /></button>
                  <button onClick={() => { if (window.confirm(t("photos.deleteAlbumConfirm"))) { deleteAlbum(customAlbum.id); setAlbum(null); } }} aria-label={t("photos.deleteAlbum")} title={t("photos.deleteAlbum")} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-danger"><Trash2 size={15} /></button>
                </span>
              ) : null}
            </div>
          ) : null}
          {renaming !== null && customAlbum ? (
            <form onSubmit={(event) => { event.preventDefault(); renameAlbum(customAlbum.id, renaming); setRenaming(null); }} className="mb-3 flex gap-2 px-1">
              <input autoFocus value={renaming} onChange={(event) => setRenaming(event.target.value)} maxLength={80} aria-label={t("photos.rename")} className={field} />
              <Button type="submit" className="h-10 px-4 text-xs" disabled={!renaming.trim()}>{t("profile.save")}</Button>
            </form>
          ) : null}
          {visible.length ? <PhotoGrid photos={visible} onOpen={setViewing} /> : <Card className="p-8 text-center text-sm text-muted">{t(customAlbum ? "photos.albumEmpty" : "photos.empty")}</Card>}
        </>
      )}
      {viewing !== null && visible.length ? (
        <Lightbox photos={visible} index={Math.min(viewing, visible.length - 1)} onChange={setViewing} onClose={() => setViewing(null)} onDelete={(photo) => { remove(photo.id); if (visible.length <= 1) setViewing(null); }}
          albums={custom} onMove={(photo, albumId) => { move(photo.id, albumId); if (customAlbum && albumId !== customAlbum.id && visible.length <= 1) setViewing(null); }} />
      ) : null}
    </div>
  );
}
