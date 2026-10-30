"use client";
import { VerifiedMark } from "@/components/ui/VerifiedMark";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CheckCheck, Copy, ImagePlus, Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Reply, SendHorizontal, Smile, Trash2, Video, X } from "lucide-react";
import { startCall } from "@/lib/callSync";
import { clock, parseCallLog } from "@/lib/callLog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { userHref } from "@/lib/links";
import { dayDiff, formatClock, formatDay } from "@/lib/datetime";
import { resizeImage } from "@/lib/profile";
import { useTranslation } from "@/i18n/useTranslation";
import { Avatar } from "@/components/ui/Avatar";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { lastSeenText } from "@/lib/lastSeen";
import type { Chat, MessageInput } from "./useMessages";
import { VoiceRecorder } from "./VoiceRecorder";
import { ImageViewer } from "@/components/ui/ImageViewer";
import { ChatBackdrop, ChatThemeButton, useChatTheme } from "./ChatTheme";

type Props = { chat: Chat; onBack: () => void; onSend: (input: MessageInput) => void; onHide: (ids: string[]) => void; onDeleteAll: (ids: string[]) => void; onClear?: () => void; className?: string };
const tool = "flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-text";

// A link in a message opens in a new tab (only http/https; the text is never run as HTML).
const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s<>"']+)/gi;
function linkParts(text: string) {
  return text.split(URL_PATTERN).map((part, index) => {
    if (index % 2 === 0) return part;
    const tail = /[.,;:!?)\]]+$/.exec(part)?.[0] ?? "";
    const url = tail ? part.slice(0, -tail.length) : part;
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return <span key={index}><a href={href} target="_blank" rel="noopener noreferrer nofollow" onClick={(event) => event.stopPropagation()} className="underline underline-offset-2 hover:opacity-80">{url}</a>{tail}</span>;
  });
}

// Texts of the long-press menu, reply bar and delete choices (the site languages without their own entry use English).
const chatWords = {
  az: { reply: "Cavabla", copy: "Kopyala", del: "Sil", select: "Seç", cancel: "Ləğv", all: "Hamısını seç", selected: "seçildi", you: "Sən", photo: "📷 Şəkil", voice: "🎤 Səs", gone: "Mesaj silinib", forMe: "Məndən sil", forAll: "Hamıdan sil", askOne: "Mesaj silinsin?", askMany: "mesaj silinsin?", replying: "Cavab" },
  en: { reply: "Reply", copy: "Copy", del: "Delete", select: "Select", cancel: "Cancel", all: "Select all", selected: "selected", you: "You", photo: "📷 Photo", voice: "🎤 Voice", gone: "Message deleted", forMe: "Delete for me", forAll: "Delete for everyone", askOne: "Delete message?", askMany: "messages will be deleted", replying: "Reply" },
  tr: { reply: "Yanıtla", copy: "Kopyala", del: "Sil", select: "Seç", cancel: "İptal", all: "Tümünü seç", selected: "seçildi", you: "Sen", photo: "📷 Fotoğraf", voice: "🎤 Ses", gone: "Mesaj silindi", forMe: "Benden sil", forAll: "Herkesten sil", askOne: "Mesaj silinsin mi?", askMany: "mesaj silinecek", replying: "Yanıt" },
  ru: { reply: "Ответить", copy: "Копировать", del: "Удалить", select: "Выбрать", cancel: "Отмена", all: "Выбрать все", selected: "выбрано", you: "Вы", photo: "📷 Фото", voice: "🎤 Голос", gone: "Сообщение удалено", forMe: "Удалить у меня", forAll: "Удалить у всех", askOne: "Удалить сообщение?", askMany: "сообщений будет удалено", replying: "Ответ" },
} as const;

export function ChatPane({ chat, onBack, onSend, onHide, onDeleteAll, onClear, className }: Props) {
  const { t, locale } = useTranslation();
  const w = chatWords[locale === "az" || locale === "tr" || locale === "ru" ? locale : "en"];
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  // Long press on a message opens its menu (reply / copy / delete / select); "select" turns on multi-select.
  const [menu, setMenu] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const press = useRef({ timer: 0, x: 0, y: 0, fired: false });
  const [recording, setRecording] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const theme = useChatTheme();
  const themed = theme.look !== "plain";
  const { user } = chat.person;
  const count = chat.messages.length;
  const ready = Boolean(text.trim() || image);
  // "typing…": both sides of this chat share a small live channel; a note goes out at most every 2 seconds while typing.
  const myId = useAuth().user?.id;
  const [typing, setTyping] = useState(false);
  const typingChannel = useRef<RealtimeChannel | null>(null);
  const lastTyped = useRef(0);
  useEffect(() => {
    if (!supabase || !myId || !user.id) return;
    const client = supabase;
    const channel = client.channel(`dm-${[myId, user.id].sort().join("-")}`, { config: { broadcast: { self: false } } });
    let timer = 0;
    channel.on("broadcast", { event: "typing" }, (message: { payload?: { from?: string } }) => {
      if (message.payload?.from !== user.id) return;
      setTyping(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setTyping(false), 3500);
    }).subscribe();
    typingChannel.current = channel;
    return () => { window.clearTimeout(timer); typingChannel.current = null; setTyping(false); void client.removeChannel(channel); };
  }, [myId, user.id]);
  useEffect(() => { setTyping(false); }, [count]);
  const noteTyping = () => {
    const now = Date.now();
    if (!typingChannel.current || now - lastTyped.current < 2000) return;
    lastTyped.current = now;
    void typingChannel.current.send({ type: "broadcast", event: "typing", payload: { from: myId } });
  };

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [count, chat.userId]);

  useEffect(() => { setMenu(null); setSelecting(false); setPicked([]); setReplyTo(null); setConfirm(null); }, [chat.userId]);
  // A message that was deleted can no longer be replied to or stay ticked.
  useEffect(() => {
    if (replyTo && !chat.messages.some((item) => item.id === replyTo)) setReplyTo(null);
    setPicked((list) => { const next = list.filter((id) => chat.messages.some((item) => item.id === id)); return next.length === list.length ? list : next; });
  }, [chat.messages, replyTo]);
  useEffect(() => { if (selecting && !picked.length) setSelecting(false); }, [selecting, picked.length]);

  const selectable = chat.messages.filter((item) => !parseCallLog(item.text)).map((item) => item.id);
  const toggle = (id: string) => setPicked((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]));
  const startPress = (id: string, event: ReactPointerEvent) => {
    if (selecting || (event.pointerType === "mouse" && event.button !== 0)) return;
    if ((event.target as HTMLElement).closest("audio,a")) return;
    window.clearTimeout(press.current.timer);
    press.current.x = event.clientX;
    press.current.y = event.clientY;
    press.current.fired = false;
    press.current.timer = window.setTimeout(() => { press.current.fired = true; setMenu(id); }, 450);
  };
  const movePress = (event: ReactPointerEvent) => {
    if (Math.abs(event.clientX - press.current.x) > 8 || Math.abs(event.clientY - press.current.y) > 8) window.clearTimeout(press.current.timer);
  };
  const endPress = () => window.clearTimeout(press.current.timer);
  const snippet = (item?: Message) => (item ? item.text || (item.image ? w.photo : item.audio ? w.voice : "") : "");
  const jump = (id: string) => {
    const node = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-mid]") ?? []).find((item) => item.dataset.mid === id);
    if (!node) return;
    node.scrollIntoView({ block: "center", behavior: "smooth" });
    setFlash(id);
    window.setTimeout(() => setFlash(null), 1400);
  };
  const startReply = (id: string) => { setMenu(null); setReplyTo(id); window.setTimeout(() => inputRef.current?.focus(), 0); };
  const copyText = (value: string) => { setMenu(null); try { void navigator.clipboard?.writeText(value); } catch { /* clipboard blocked */ } };
  const doDelete = (ids: string[], everyone: boolean) => {
    setConfirm(null);
    setMenu(null);
    setSelecting(false);
    setPicked([]);
    if (everyone) onDeleteAll(ids); else onHide(ids);
  };
  const send = (input: MessageInput) => { onSend(replyTo ? { ...input, replyTo } : input); setReplyTo(null); };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready) return;
    send({ text: text.trim(), image: image ?? undefined });
    setText("");
    setImage(null);
  }
  async function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setImage(await resizeImage(file, 800));
    } catch {
      // Unreadable image: nothing is attached.
    }
  }
  const dayLabel = (at: number) => {
    const diff = dayDiff(at);
    return diff === 0 ? t("messages.today") : diff === 1 ? t("messages.yesterday") : formatDay(at);
  };

  return (
    <div className={cn("min-h-0 min-w-0 flex-1 flex-col", className)}>
      {selecting ? (
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <IconButton aria-label={w.cancel} title={w.cancel} onClick={() => { setSelecting(false); setPicked([]); }}><X size={18} /></IconButton>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{picked.length} {w.selected}</span>
          <button type="button" onClick={() => setPicked(selectable)} className="h-9 rounded-lg px-3 text-xs font-semibold text-accent hover:bg-surface-2">{w.all}</button>
          <button type="button" disabled={!picked.length} onClick={() => setConfirm(picked)} className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-danger hover:bg-surface-2 disabled:opacity-40"><Trash2 size={15} />{w.del}</button>
        </div>
      ) : (
      <div className="flex items-center gap-3 border-b border-border px-3 py-2.5">
        <IconButton aria-label={t("messages.back")} onClick={onBack} className="md:hidden"><ArrowLeft size={18} /></IconButton>
        <Link href={userHref(user.id)} className="shrink-0"><Avatar user={user} /></Link>
        <div className="min-w-0">
          <Link href={userHref(user.id)} className="block truncate text-sm font-semibold hover:underline">{user.name}<VerifiedMark userId={user.id} size={14} /></Link>
          <div className={cn("text-xs", typing || user.online ? "text-accent" : "text-muted")}>{typing ? t("messages.typing") : user.online ? t("common.onlineNow") : lastSeenText(user.lastSeen, t)}</div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <ChatThemeButton theme={theme} />
          {onClear && count > 0 ? <IconButton aria-label={t("messages.clear")} title={t("messages.clear")} onClick={() => { if (window.confirm(t("messages.clearConfirm"))) onClear(); }}><Trash2 size={17} /></IconButton> : null}
          {supabase ? <>
            <IconButton aria-label={t("call.voice")} title={t("call.voice")} onClick={() => void startCall({ id: user.id, name: user.name, avatar: user.avatar }, false)}><Phone size={18} /></IconButton>
            <IconButton aria-label={t("call.video")} title={t("call.video")} onClick={() => void startCall({ id: user.id, name: user.name, avatar: user.avatar }, true)}><Video size={19} /></IconButton>
          </> : null}
        </div>
      </div>
      )}
      <div className="relative min-h-0 flex-1 overflow-hidden">
      <ChatBackdrop look={theme.look} />
      <div ref={listRef} className="absolute inset-0 space-y-2 overflow-y-auto px-3 py-4 sm:px-5">
        {count ? chat.messages.map((message, index) => {
          const previous = chat.messages[index - 1];
          const newDay = !previous || dayDiff(previous.at, message.at) !== 0;
          const mine = message.from === "me";
          const on = picked.includes(message.id);
          const quoted = message.replyTo ? chat.messages.find((item) => item.id === message.replyTo) : undefined;
          const call = parseCallLog(message.text);
          if (call) {
            const missed = call.kind !== "done";
            const Icon = call.kind === "missed" && !mine ? PhoneMissed : mine ? PhoneOutgoing : PhoneIncoming;
            return (
              <div key={message.id}>
                {newDay ? <div className={cn("my-3 text-center text-[11px]", themed ? "text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,.55)]" : "text-muted")}>{dayLabel(message.at)}</div> : null}
                <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cn("flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm", themed ? "bg-white/90 shadow-sm" : "bg-surface-2", mine ? "rounded-br-md" : "rounded-bl-md")}>
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", missed ? "bg-[#E53935]/15 text-[#E53935]" : "bg-[#22C55E]/15 text-[#22C55E]")}><Icon size={16} /></span>
                    <span className="flex flex-col">
                      <span className={cn("font-semibold", themed ? "text-slate-800" : "text-text")}>{t(`call.log_${call.kind === "missed" && mine ? "noanswer" : call.kind}` as "call.log_done")}</span>
                      <span className={cn("text-[11px]", themed ? "text-slate-500" : "text-muted")}>{formatClock(message.at)}{call.kind === "done" ? ` · ${clock(call.secs)}` : ""}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div key={message.id} data-mid={message.id}>
              {newDay ? <div className={cn("my-3 text-center text-[11px]", themed ? "text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,.55)]" : "text-muted")}>{dayLabel(message.at)}</div> : null}
              {menu === message.id && !selecting ? (
                <>
                  <button type="button" aria-label={w.cancel} onClick={() => setMenu(null)} className="fixed inset-0 z-10 cursor-default bg-transparent" />
                  <div className={cn("relative z-20 mb-1.5 flex", mine ? "justify-end" : "justify-start")}>
                    <div className="flex overflow-hidden rounded-xl border border-border bg-surface text-text shadow-lg">
                      <button type="button" onClick={() => startReply(message.id)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium hover:bg-surface-2"><Reply size={14} />{w.reply}</button>
                      {message.text ? <button type="button" onClick={() => copyText(message.text)} className="flex items-center gap-1.5 border-l border-border px-3 py-2 text-xs font-medium hover:bg-surface-2"><Copy size={14} />{w.copy}</button> : null}
                      <button type="button" onClick={() => { setMenu(null); setConfirm([message.id]); }} className="flex items-center gap-1.5 border-l border-border px-3 py-2 text-xs font-medium text-danger hover:bg-surface-2"><Trash2 size={14} />{w.del}</button>
                      <button type="button" onClick={() => { setMenu(null); setSelecting(true); setPicked([message.id]); }} className="flex items-center gap-1.5 border-l border-border px-3 py-2 text-xs font-medium hover:bg-surface-2"><Check size={14} />{w.select}</button>
                    </div>
                  </div>
                </>
              ) : null}
              <div onClick={selecting ? () => toggle(message.id) : undefined} className={cn("flex items-center gap-2 rounded-xl", mine ? "justify-end" : "justify-start", selecting && "cursor-pointer", on && "bg-accent/15")}>
                {selecting ? <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", mine && "mr-auto", on ? "border-accent bg-accent text-bg" : themed ? "border-white/80 bg-white/20" : "border-muted")}>{on ? <Check size={12} strokeWidth={3} /> : null}</span> : null}
                <div onPointerDown={(event) => startPress(message.id, event)} onPointerMove={movePress} onPointerUp={endPress} onPointerCancel={endPress} onPointerLeave={endPress} onContextMenu={(event) => { event.preventDefault(); if (!selecting) setMenu(message.id); }} className={cn("max-w-[78%] overflow-hidden rounded-2xl [-webkit-touch-callout:none] [@media(pointer:coarse)]:select-none", themed && "shadow-md", mine ? "rounded-br-md bg-accent text-bg" : cn("rounded-bl-md", themed ? "bg-white/90 text-slate-800" : "bg-surface-2 text-text"), (flash === message.id || replyTo === message.id) && "ring-2 ring-accent/70 ring-offset-1")}>
                  {message.replyTo ? (
                    <button type="button" onClick={(event) => { event.stopPropagation(); if (selecting) toggle(message.id); else if (quoted) jump(quoted.id); }} className={cn("mx-2 mt-2 block w-[calc(100%-1rem)] cursor-pointer rounded-lg border-l-4 px-2.5 py-1.5 text-left text-xs", mine ? "border-bg/70 bg-black/15" : "border-accent bg-black/5")}>
                      <span className={cn("block truncate font-semibold", mine ? "text-bg" : "text-accent")}>{quoted ? (quoted.from === "me" ? w.you : user.name) : ""}</span>
                      <span className={cn("line-clamp-2 break-words", quoted ? "" : "italic opacity-80")}>{quoted ? snippet(quoted) : w.gone}</span>
                    </button>
                  ) : null}
                  {message.image ? <button type="button" onClick={(event) => { event.stopPropagation(); if (selecting) { toggle(message.id); return; } if (press.current.fired) { press.current.fired = false; return; } setViewing(message.image ?? null); }} aria-label={t("photos.view")} className="block w-full cursor-zoom-in"><img src={message.image} alt="" className="max-h-[260px] w-full object-cover" /></button> : null}
                  {message.audio ? <audio src={message.audio} controls preload="metadata" onClick={(event) => event.stopPropagation()} className="mx-2 mt-2 h-10 w-[230px] max-w-full" /> : null}
                  <div className="px-3.5 py-2">
                    {message.text ? <p className="whitespace-pre-wrap break-words text-sm leading-5">{linkParts(message.text)}</p> : null}
                    <p className={cn("mt-0.5 flex items-center justify-end gap-1 text-[10px]", mine ? "text-bg" : themed ? "text-slate-500" : "text-muted")}>{formatClock(message.at)}{mine && message.read !== undefined ? (message.read ? <CheckCheck size={15} strokeWidth={2.4} aria-label={t("messages.read")} className="text-[#34B7F1]" /> : message.delivered ? <CheckCheck size={15} strokeWidth={2.4} aria-label={t("messages.delivered")} className="opacity-80" /> : <Check size={15} strokeWidth={2.4} aria-label={t("messages.sent")} className="opacity-80" />) : null}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        }) : <p className={cn("flex h-full items-center justify-center text-sm", themed ? "text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,.5)]" : "text-muted")}>{t("messages.noMessages")}</p>}
      </div>
      </div>
      {replyTo && !selecting ? (() => {
        const target = chat.messages.find((item) => item.id === replyTo);
        return target ? (
          <div className="flex items-center gap-3 border-t border-border px-3 py-2">
            <div className="min-w-0 flex-1 rounded-lg border-l-4 border-accent bg-surface-2 px-3 py-1.5 text-xs">
              <span className="block truncate font-semibold text-accent">{w.replying}: {target.from === "me" ? w.you : user.name}</span>
              <span className="block truncate text-muted">{snippet(target)}</span>
            </div>
            <button type="button" onClick={() => setReplyTo(null)} aria-label={w.cancel} title={w.cancel} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted hover:text-text"><X size={14} /></button>
          </div>
        ) : null;
      })() : null}
      {image ? (
        <div className="flex items-center gap-3 border-t border-border px-3 pt-3">
          <img src={image} alt="" className="h-16 w-16 rounded-lg object-cover" />
          <button onClick={() => setImage(null)} aria-label={t("feed.removeImage")} title={t("feed.removeImage")} className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted hover:text-text"><X size={14} /></button>
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className={cn("flex items-center gap-1 p-3", image ? "" : "border-t border-border")}>
        {recording ? null : <><label className={tool} title={t("messages.attach")}><ImagePlus size={19} /><input type="file" accept="image/*" className="sr-only" aria-label={t("messages.attach")} onChange={handleImage} /></label>
        <EmojiPicker up label={t("messages.emoji")} trigger={<Smile size={19} />} triggerClassName={tool} onPick={(emoji) => setText((value) => value + emoji)} onMedia={(url) => send({ text: "", image: url })} /></>}
        <VoiceRecorder onActiveChange={setRecording} onRecorded={(audio) => send({ text: "", audio })} />
        {recording ? null : <><input ref={inputRef} value={text} onChange={(event) => { setText(event.target.value); if (event.target.value) noteTyping(); }} aria-label={t("messages.placeholder")} placeholder={t("messages.placeholder")} autoComplete="off" className="ml-1 h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-4 text-sm text-text outline-none placeholder:text-muted focus:border-accent" />
        <button type="submit" disabled={!ready} aria-label={t("messages.send")} className="ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-bg disabled:opacity-40"><SendHorizontal size={18} /></button></>}
      </form>
      {viewing ? <ImageViewer src={viewing} onClose={() => setViewing(null)} /> : null}
      {confirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setConfirm(null)}>
          <div role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()} className="w-full max-w-xs rounded-2xl border border-border bg-surface p-4 text-text shadow-xl">
            <p className="text-center text-sm font-semibold">{confirm.length === 1 ? w.askOne : `${confirm.length} ${w.askMany}`}</p>
            <div className="mt-4 flex flex-col gap-2">
              {confirm.every((id) => chat.messages.find((item) => item.id === id)?.from === "me") ? <button type="button" onClick={() => doDelete(confirm, true)} className="h-10 rounded-xl bg-danger text-sm font-semibold text-white">{w.forAll}</button> : null}
              <button type="button" onClick={() => doDelete(confirm, false)} className="h-10 rounded-xl border border-border text-sm font-semibold text-danger hover:bg-surface-2">{w.forMe}</button>
              <button type="button" onClick={() => setConfirm(null)} className="h-10 rounded-xl text-sm font-medium text-muted hover:bg-surface-2">{w.cancel}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
