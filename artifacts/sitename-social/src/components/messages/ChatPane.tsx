"use client";
import { VerifiedMark } from "@/components/ui/VerifiedMark";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CheckCheck, ImagePlus, Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, SendHorizontal, Smile, Trash2, Video, X } from "lucide-react";
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
import { lastSeenText } from "@/lib/lastSeen";
import type { Chat, MessageInput } from "./useMessages";
import { VoiceRecorder } from "./VoiceRecorder";
import { ImageViewer } from "@/components/ui/ImageViewer";
import { ChatBackdrop, ChatThemeButton, useChatTheme } from "./ChatTheme";

type Props = { chat: Chat; onBack: () => void; onSend: (input: MessageInput) => void; onDelete: (id: string) => void; onClear?: () => void; className?: string };
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

export function ChatPane({ chat, onBack, onSend, onDelete, onClear, className }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready) return;
    onSend({ text: text.trim(), image: image ?? undefined });
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
      <div className="relative min-h-0 flex-1 overflow-hidden">
      <ChatBackdrop look={theme.look} />
      <div ref={listRef} className="absolute inset-0 space-y-2 overflow-y-auto px-3 py-4 sm:px-5">
        {count ? chat.messages.map((message, index) => {
          const previous = chat.messages[index - 1];
          const newDay = !previous || dayDiff(previous.at, message.at) !== 0;
          const mine = message.from === "me";
          const active = selected === message.id;
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
            <div key={message.id}>
              {newDay ? <div className={cn("my-3 text-center text-[11px]", themed ? "text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,.55)]" : "text-muted")}>{dayLabel(message.at)}</div> : null}
              <div className={cn("flex items-center gap-2", mine ? "justify-end" : "justify-start")}>
                {mine && active ? <button onClick={() => { onDelete(message.id); setSelected(null); }} className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-danger hover:bg-surface-2"><Trash2 size={13} />{t("post.delete")}</button> : null}
                <div onClick={mine ? () => setSelected(active ? null : message.id) : undefined} className={cn("max-w-[78%] overflow-hidden rounded-2xl", themed && "shadow-md", mine ? "cursor-pointer rounded-br-md bg-accent text-bg" : cn("rounded-bl-md", themed ? "bg-white/90 text-slate-800" : "bg-surface-2 text-text"), active && "opacity-80")}>
                  {message.image ? <button type="button" onClick={(event) => { event.stopPropagation(); setViewing(message.image ?? null); }} aria-label={t("photos.view")} className="block w-full cursor-zoom-in"><img src={message.image} alt="" className="max-h-[260px] w-full object-cover" /></button> : null}
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
      {image ? (
        <div className="flex items-center gap-3 border-t border-border px-3 pt-3">
          <img src={image} alt="" className="h-16 w-16 rounded-lg object-cover" />
          <button onClick={() => setImage(null)} aria-label={t("feed.removeImage")} title={t("feed.removeImage")} className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted hover:text-text"><X size={14} /></button>
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className={cn("flex items-center gap-1 p-3", image ? "" : "border-t border-border")}>
        {recording ? null : <><label className={tool} title={t("messages.attach")}><ImagePlus size={19} /><input type="file" accept="image/*" className="sr-only" aria-label={t("messages.attach")} onChange={handleImage} /></label>
        <EmojiPicker up label={t("messages.emoji")} trigger={<Smile size={19} />} triggerClassName={tool} onPick={(emoji) => setText((value) => value + emoji)} onMedia={(url) => onSend({ text: "", image: url })} /></>}
        <VoiceRecorder onActiveChange={setRecording} onRecorded={(audio) => onSend({ text: "", audio })} />
        {recording ? null : <><input value={text} onChange={(event) => { setText(event.target.value); if (event.target.value) noteTyping(); }} aria-label={t("messages.placeholder")} placeholder={t("messages.placeholder")} autoComplete="off" className="ml-1 h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-4 text-sm text-text outline-none placeholder:text-muted focus:border-accent" />
        <button type="submit" disabled={!ready} aria-label={t("messages.send")} className="ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-bg disabled:opacity-40"><SendHorizontal size={18} /></button></>}
      </form>
      {viewing ? <ImageViewer src={viewing} onClose={() => setViewing(null)} /> : null}
    </div>
  );
}
