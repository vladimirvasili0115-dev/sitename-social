"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteContent, fetchContent, type AdminContent as Item, type ContentKind } from "@/lib/adminSync";
import { formatClock, formatDay } from "@/lib/datetime";
import { userHref } from "@/lib/links";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const kinds: { id: ContentKind; label: TranslationKey }[] = [{ id: "post", label: "saved.tabPosts" }, { id: "video", label: "nav.videos" }, { id: "track", label: "nav.music" }];

export function AdminContent() {
  const { t } = useTranslation();
  const [kind, setKind] = useState<ContentKind>("post");
  const [items, setItems] = useState<Item[] | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback((which: ContentKind) => {
    setItems(null);
    void fetchContent(which).then((list) => {
      setItems(list ?? []);
      setFailed(!list);
    });
  }, []);
  useEffect(() => load(kind), [kind, load]);

  async function remove(item: Item) {
    if (confirm !== item.id) return setConfirm(item.id);
    setConfirm(null);
    setBusy(item.id);
    const done = await deleteContent(kind, item);
    setBusy(null);
    setFailed(!done);
    if (done) setItems((list) => (list ?? []).filter((entry) => entry.id !== item.id));
  }

  return (
    <>
      <div className="mb-4 flex gap-2">
        {kinds.map((item) => <button key={item.id} onClick={() => setKind(item.id)} aria-pressed={kind === item.id} className={cn("h-9 rounded-full border px-3.5 text-xs font-semibold capitalize", kind === item.id ? "border-accent bg-surface-2 text-accent" : "border-border text-muted hover:text-text")}>{t(item.label)}</button>)}
      </div>
      {failed ? <p role="alert" className="mb-3 rounded-xl border border-danger px-4 py-2.5 text-sm text-danger">{t("report.failed")}</p> : null}
      {items === null ? null : items.length ? (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card className="p-4">
                <div className="flex items-center gap-3 text-xs text-muted">
                  <Link href={userHref(item.ownerId)} className="truncate text-sm font-semibold text-text hover:underline">{item.ownerName || "—"}</Link>
                  <span className="ml-auto shrink-0 tabular-nums">{formatDay(item.at)} · {formatClock(item.at)}</span>
                </div>
                {item.body ? <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-text">{item.body}</p> : null}
                {item.mediaUrl ? (kind === "post"
                  ? <img src={item.mediaUrl} alt="" loading="lazy" className="mt-2 max-h-[240px] rounded-xl object-contain" />
                  : kind === "video"
                    ? <video src={item.mediaUrl} controls preload="metadata" className="mt-2 max-h-[240px] w-full rounded-xl bg-bg" />
                    : <audio src={item.mediaUrl} controls preload="none" className="mt-2 h-10 w-full max-w-[360px]" />) : null}
                <div className="mt-3">
                  <button disabled={busy === item.id} onClick={() => void remove(item)} className={cn("inline-flex h-9 items-center gap-1.5 rounded-xl border border-danger px-3 text-xs font-semibold disabled:opacity-50", confirm === item.id ? "bg-danger text-bg" : "text-danger hover:bg-surface-2")}><Trash2 size={14} />{t(confirm === item.id ? "admin.confirm" : "post.delete")}</button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : <Card className="p-8 text-center text-sm text-muted">{t("admin.emptyContent")}</Card>}
    </>
  );
}
