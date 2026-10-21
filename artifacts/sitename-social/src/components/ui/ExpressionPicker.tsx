"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { emojiSets } from "@/lib/emojiSets";
import { useCustomArt } from "@/lib/customArt";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { Dropdown } from "./Dropdown";

// Smileys, stickers and GIFs in one window (like VK): emojis by category, the site's animated stickers,
// and GIFs from Tenor (search or popular). A sticker or GIF is handed back as a picture address.
type Tab = "emoji" | "sticker" | "gif";
type Gif = { id: string; preview: string; url: string };
const TENOR_KEY = process.env.NEXT_PUBLIC_TENOR_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "";

function EmojiGrid({ onPick }: { onPick: (emoji: string) => void }) {
  const [cat, setCat] = useState(emojiSets[0].id);
  const list = emojiSets.find((item) => item.id === cat)?.list ?? [];
  return (
    <div>
      <div className="mb-1.5 flex gap-0.5 overflow-x-auto border-b border-border pb-1.5 [scrollbar-width:none]">
        {emojiSets.map((item) => <button key={item.id} type="button" onClick={() => setCat(item.id)} aria-pressed={cat === item.id} className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg", cat === item.id ? "bg-surface-2" : "opacity-60 hover:opacity-100")}>{item.icon}</button>)}
      </div>
      <div className="grid h-56 grid-cols-8 content-start gap-0.5 overflow-y-auto">
        {list.map((emoji) => <button key={emoji} type="button" onClick={() => onPick(emoji)} className="flex h-9 w-9 items-center justify-center rounded-lg text-[22px] hover:bg-surface-2">{emoji}</button>)}
      </div>
    </div>
  );
}

function StickerGrid({ onPick }: { onPick: (url: string) => void }) {
  const art = useCustomArt();
  const stickers = useMemo(() => [...art].filter((file) => /^anim\/ges_[\w-]+\.webp$/.test(file)).sort().map((file) => `/custom/${file}`), [art]);
  return (
    <div className="grid h-[262px] grid-cols-4 content-start gap-1 overflow-y-auto">
      {stickers.map((url) => <button key={url} type="button" onClick={() => onPick(url)} className="flex h-[68px] items-center justify-center rounded-lg hover:bg-surface-2"><img src={url} alt="" loading="lazy" className="h-14 w-14 object-contain" /></button>)}
    </div>
  );
}

function GifGrid({ onPick }: { onPick: (url: string) => void }) {
  const { t, locale } = useTranslation();
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<Gif[] | null>(null);
  const [failed, setFailed] = useState(false);
  const timer = useRef(0);
  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      if (!TENOR_KEY) { setFailed(true); return; }
      const base = "https://tenor.googleapis.com/v2";
      const params = `key=${TENOR_KEY}&client_key=nudepart&limit=30&media_filter=tinygif,gif&contentfilter=medium&locale=${locale === "az" ? "tr" : locale}`;
      try {
        const res = await fetch(query.trim() ? `${base}/search?q=${encodeURIComponent(query.trim())}&${params}` : `${base}/featured?${params}`);
        if (!res.ok) { setFailed(true); return; }
        const data = (await res.json()) as { results?: { id: string; media_formats?: Record<string, { url: string }> }[] };
        setFailed(false);
        setGifs((data.results ?? []).flatMap((item) => {
          const small = item.media_formats?.tinygif?.url, big = item.media_formats?.gif?.url ?? small;
          return small && big ? [{ id: item.id, preview: small, url: big }] : [];
        }));
      } catch { setFailed(true); }
    }, query ? 400 : 0);
    return () => window.clearTimeout(timer.current);
  }, [query, locale]);
  return (
    <div>
      <label className="mb-1.5 flex h-9 items-center gap-2 rounded-lg bg-surface-2 px-2.5 text-muted">
        <Search size={15} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("picker.gifSearch")} aria-label={t("picker.gifSearch")} className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted" />
      </label>
      <div className="grid h-56 grid-cols-3 content-start gap-1 overflow-y-auto">
        {failed ? <p className="col-span-3 p-4 text-center text-xs text-muted">{t("picker.gifOff")}</p>
          : gifs === null ? <p className="col-span-3 p-4 text-center text-xs text-muted">…</p>
          : gifs.map((gif) => <button key={gif.id} type="button" onClick={() => onPick(gif.url)} className="overflow-hidden rounded-lg bg-surface-2"><img src={gif.preview} alt="" loading="lazy" className="h-[72px] w-full object-cover" /></button>)}
      </div>
      <p className="mt-1 text-right text-[10px] text-muted">Powered by Tenor</p>
    </div>
  );
}

export function ExpressionPicker({ label, trigger, triggerClassName, onEmoji, onMedia, up = false }: {
  label: string; trigger: ReactNode; triggerClassName?: string; onEmoji: (emoji: string) => void; onMedia?: (url: string) => void; up?: boolean;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("emoji");
  const tabs: [Tab, string][] = onMedia ? [["emoji", t("picker.emoji")], ["sticker", t("picker.stickers")], ["gif", "GIF"]] : [["emoji", t("picker.emoji")]];
  return (
    <Dropdown label={label} trigger={trigger} triggerClassName={triggerClassName} align="left" up={up} className="w-[318px] max-w-[calc(100vw-32px)] p-2">
      {(close) => (
        <div>
          {tabs.length > 1 ? (
            <div className="mb-2 flex gap-1 rounded-lg bg-surface-2 p-0.5">
              {tabs.map(([id, name]) => <button key={id} type="button" onClick={() => setTab(id)} aria-pressed={tab === id} className={cn("h-8 flex-1 rounded-md text-xs font-semibold", tab === id ? "bg-surface text-text shadow" : "text-muted hover:text-text")}>{name}</button>)}
            </div>
          ) : null}
          {tab === "emoji" ? <EmojiGrid onPick={(emoji) => onEmoji(emoji)} />
            : tab === "sticker" ? <StickerGrid onPick={(url) => { onMedia?.(url); close(); }} />
            : <GifGrid onPick={(url) => { onMedia?.(url); close(); }} />}
        </div>
      )}
    </Dropdown>
  );
}
