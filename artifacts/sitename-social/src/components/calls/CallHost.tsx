"use client";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Ear, Mic, MicOff, Phone, PhoneOff, Search, UserPlus, Users, Video, VideoOff, Volume2, X } from "lucide-react";
import { acceptCall, CALL_LIMIT, callLimit, callSelf, callStore, declineCall, enableVideo, hangUp, inviteToCall, toggleCamera, toggleMute, type CallMember, type CallPeer } from "@/lib/callSync";
import { ensureFriendsLoaded, remoteFriends } from "@/lib/friendsSync";
import { ensureMessagesLoaded, remoteChats } from "@/lib/messagesSync";
import { initialsAvatar } from "@/lib/avatar";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

// The call window for the whole site: an incoming call rings on any page; a call in progress stays on top.
// Pictures play silently in <video>; every member's sound plays in its own <audio>, so the output (loudspeaker or
// earpiece) can be chosen where the browser allows it.
function Stream({ stream, className }: { stream: MediaStream | null; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (ref.current && ref.current.srcObject !== stream) ref.current.srcObject = stream; }, [stream]);
  return <video ref={ref} autoPlay playsInline muted className={className} />;
}
type SinkAudio = HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> };
function Sound({ stream, sinkId }: { stream: MediaStream | null; sinkId: string | null }) {
  const ref = useRef<SinkAudio>(null);
  useEffect(() => { if (ref.current && ref.current.srcObject !== stream) { ref.current.srcObject = stream; void ref.current.play().catch(() => {}); } }, [stream]);
  useEffect(() => { if (ref.current?.setSinkId && sinkId !== null) void ref.current.setSinkId(sinkId).catch(() => {}); }, [sinkId, stream]);
  return <audio ref={ref} autoPlay playsInline className="hidden" />;
}
function Clock({ from }: { from: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const secs = Math.max(0, Math.floor((now - from) / 1000));
  return <span className="tabular-nums">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</span>;
}
const round = "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition active:scale-95";
const photoOf = (peer: CallPeer) => peer.avatar || initialsAvatar(peer.name || "?");

// Loudspeaker or earpiece. A web page cannot read the proximity sensor, and most phone browsers do not list the
// earpiece as an output; where one is listed (setSinkId), the sound really moves to it. Otherwise "ear" mode only
// blacks out the screen so the cheek does not press buttons.
// Inside the Ravetill Android app (android/ folder) the app itself switches the sound to the earpiece and turns the
// screen off at the ear (proximity sensor).
type NativeCall = { callStart: () => void; callEnd: () => void; setSpeaker: (on: boolean) => void; hasProximity?: () => boolean; stopRinging?: () => void };
const nativeCall = () => (typeof window === "undefined" ? undefined : (window as unknown as { RavetillNative?: NativeCall }).RavetillNative);
type Outputs = { ear: string | null; speaker: string | null };
function useOutputs(active: boolean): Outputs {
  const [outputs, setOutputs] = useState<Outputs>({ ear: null, speaker: null });
  useEffect(() => {
    if (!active || typeof HTMLMediaElement === "undefined" || !("setSinkId" in HTMLMediaElement.prototype) || !navigator.mediaDevices?.enumerateDevices) return;
    let alive = true;
    const read = () => void navigator.mediaDevices.enumerateDevices().then((devices) => {
      if (!alive) return;
      const out = devices.filter((device) => device.kind === "audiooutput");
      const ear = out.find((device) => /earpiece|receiver|handset/i.test(device.label));
      const speaker = out.find((device) => device !== ear && /speaker|loud/i.test(device.label));
      setOutputs({ ear: ear?.deviceId ?? null, speaker: speaker?.deviceId ?? (ear ? "" : null) });
    }).catch(() => {});
    read();
    navigator.mediaDevices.addEventListener?.("devicechange", read);
    return () => { alive = false; navigator.mediaDevices.removeEventListener?.("devicechange", read); };
  }, [active]);
  return outputs;
}

// Black screen while the phone is held to the ear: touches do nothing; a double tap brings the screen back.
function Pocket({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const last = useRef(0);
  return (
    <div
      className="fixed inset-0 z-[300] flex touch-none select-none items-end justify-center bg-black pb-10"
      onPointerDown={(event) => { event.preventDefault(); const now = Date.now(); if (now - last.current < 450) onClose(); last.current = now; }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <p className="text-xs text-white/25">{t("call.pocketHint")}</p>
    </div>
  );
}

// "Add to call": friends and people from my chats, online ones first.
function AddPeople({ members, left, onClose }: { members: CallMember[]; left: CallPeer[]; onClose: () => void }) {
  const { t } = useTranslation();
  const friends = useSyncExternalStore(remoteFriends.subscribe, remoteFriends.get, remoteFriends.getServer);
  const chats = useSyncExternalStore(remoteChats.subscribe, remoteChats.get, remoteChats.getServer);
  const [query, setQuery] = useState("");
  useEffect(() => { const self = callSelf(); ensureFriendsLoaded(self?.id); ensureMessagesLoaded(self?.id); }, []);
  const people = useMemo(() => {
    const taken = new Set([callSelf()?.id, ...members.map((member) => member.peer.id)]);
    const seen = new Map<string, { id: string; name: string; avatar: string; online: boolean }>();
    for (const peer of left) if (!taken.has(peer.id)) seen.set(peer.id, { ...peer, online: true });
    for (const person of [...chats.map((chat) => chat.person), ...friends.friends]) {
      const user = person.user;
      if (!user?.id || taken.has(user.id) || seen.has(user.id)) continue;
      seen.set(user.id, { id: user.id, name: user.name, avatar: user.avatar, online: Boolean(user.online) });
    }
    const needle = query.trim().toLocaleLowerCase();
    return [...seen.values()].filter((person) => !needle || person.name.toLocaleLowerCase().includes(needle)).sort((a, b) => Number(left.some((peer) => peer.id === b.id)) - Number(left.some((peer) => peer.id === a.id)) || Number(b.online) - Number(a.online));
  }, [friends, chats, members, left, query]);
  return (
    <div className="fixed inset-0 z-[250] flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-label={t("call.add")} className="flex max-h-[80vh] w-full max-w-md flex-col rounded-t-3xl bg-surface text-foreground shadow-2xl sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-2 p-4 pb-2">
          <p className="flex-1 font-semibold">{t("call.add")}</p>
          <button onClick={onClose} aria-label={t("call.close")} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"><X size={18} /></button>
        </div>
        <label className="mx-4 mb-2 flex items-center gap-2 rounded-xl border border-border px-3 py-2">
          <Search size={16} className="text-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("call.addSearch")} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </label>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {people.length ? people.map((person) => (
            <button key={person.id} onClick={() => { void inviteToCall({ id: person.id, name: person.name, avatar: person.avatar }); onClose(); }} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-black/5">
              <span className="relative shrink-0">
                <img src={photoOf(person)} alt="" className="h-11 w-11 rounded-full object-cover" />
                {person.online ? <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#22C55E] ring-2 ring-surface" /> : null}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{person.name}</span>
              <UserPlus size={18} className="text-muted" />
            </button>
          )) : <p className="p-6 text-center text-sm text-muted">{t("call.addEmpty")}</p>}
        </div>
      </div>
    </div>
  );
}

// Group call: who is talking, who is still being rung, who left (anyone still in the call can ring them again).
function Roster({ members, left, canAdd, onClose }: { members: CallMember[]; left: CallPeer[]; canAdd: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const self = callSelf();
  const row = (peer: CallPeer, note: string, dim: boolean, action?: React.ReactNode) => (
    <div key={peer.id} className="flex items-center gap-3 rounded-2xl px-2 py-2">
      <img src={photoOf(peer)} alt="" className={cn("h-11 w-11 shrink-0 rounded-full object-cover", dim && "opacity-50 grayscale")} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{peer.name}</span>
        <span className="block truncate text-xs text-muted">{note}</span>
      </span>
      {action}
    </div>
  );
  const talking = members.filter((member) => member.status !== "ringing");
  const ringing = members.filter((member) => member.status === "ringing");
  return (
    <div className="fixed inset-0 z-[250] flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-label={t("call.people")} className="flex max-h-[80vh] w-full max-w-md flex-col rounded-t-3xl bg-surface text-foreground shadow-2xl sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-2 p-4 pb-2">
          <p className="flex-1 font-semibold">{t("call.people")}</p>
          <button onClick={onClose} aria-label={t("call.close")} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {self ? row(self, `${t("call.you")} · ${t("call.inCall")}`, false) : null}
          {talking.map((member) => row(member.peer, t("call.inCall"), false, <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#22C55E]" />))}
          {ringing.map((member) => row(member.peer, t("call.calling"), true, <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-[#F59E0B]" />))}
          {left.filter((peer) => !members.some((member) => member.peer.id === peer.id)).map((peer) => row(peer, t("call.left"), true, canAdd ? (
            <button onClick={() => { void inviteToCall(peer); onClose(); }} className="flex shrink-0 items-center gap-1 rounded-full bg-[#22C55E] px-3 py-1.5 text-xs font-semibold text-white"><UserPlus size={14} />{t("call.reinvite")}</button>
          ) : null))}
        </div>
      </div>
    </div>
  );
}

export function CallHost() {
  const { t } = useTranslation();
  const call = useSyncExternalStore(callStore.subscribe, callStore.get, callStore.getServer);
  const live = call.phase === "active" || call.phase === "connecting" || call.phase === "outgoing";
  const outputs = useOutputs(live);
  const [route, setRoute] = useState<"speaker" | "ear">("speaker");
  const [pocket, setPocket] = useState(false);
  const [adding, setAdding] = useState(false);
  const [touch, setTouch] = useState(false);
  // The voice bar folds into a round bubble (one tap) that can be dragged to the left or right edge; one tap opens it again.
  const [mini, setMini] = useState(false);
  const [dock, setDock] = useState<{ side: "left" | "right"; y: number }>({ side: "right", y: 96 });
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const grab = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [roster, setRoster] = useState(false);
  // "Name left the call" for a few seconds, for whoever is still in it.
  const [gone, setGone] = useState<string | null>(null);
  const lastLeft = useRef(0);
  useEffect(() => {
    const latest = call.left[call.left.length - 1];
    if (!latest || latest.at <= lastLeft.current) return;
    lastLeft.current = latest.at;
    setGone(latest.peer.name);
    const timer = window.setTimeout(() => setGone(null), 4000);
    return () => window.clearTimeout(timer);
  }, [call.left]);
  useEffect(() => { setTouch(typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches); }, []);
  useEffect(() => { if (!live) { setRoute("speaker"); setPocket(false); setAdding(false); setMini(false); setDrag(null); setRoster(false); setGone(null); } }, [live]);
  useEffect(() => {
    const native = nativeCall();
    if (!native || !live) return;
    try { native.callStart(); } catch { /* old app */ }
    return () => { try { native.callEnd(); } catch { /* old app */ } };
  }, [live]);
  // The app (1.4+) rang this call as a notification while it was closed: the site shows the call now, so that ringing stops.
  // Only once the page is on screen: an app left open in the background keeps ringing as a notification.
  useEffect(() => {
    if (call.phase === "idle") return;
    const stop = () => { if (document.visibilityState === "visible") { try { nativeCall()?.stopRinging?.(); } catch { /* old app */ } } };
    stop();
    document.addEventListener("visibilitychange", stop);
    return () => document.removeEventListener("visibilitychange", stop);
  }, [call.phase]);
  if (call.phase === "idle" || !call.peer) return null;
  const peer = call.peer;
  const members = call.members;
  const joined = members.filter((member) => member.status !== "ringing");
  const shown = members.length ? members : [{ peer, remote: null, status: "ringing" as const }];
  const title = (joined.length ? joined : shown).map((member) => member.peer.name).join(", ");
  // A voice call can become a video call without hanging up (only while there are few enough people for video).
  const canVideo = call.phase === "active" && !call.video && members.length + 1 <= CALL_LIMIT.video;
  const hasCam = Boolean(call.local?.getVideoTracks().length);
  const sinkId = route === "ear" ? outputs.ear : outputs.speaker;
  const canAdd = (call.phase === "active" || call.phase === "connecting") && members.length + 1 < callLimit(call.video);
  const status = call.phase === "incoming" ? t(call.video ? "call.incomingVideo" : "call.incomingVoice")
    : call.phase === "outgoing" ? t("call.calling")
    : call.phase === "connecting" ? t("call.connecting")
    : call.phase === "ended" ? t(`call.end_${call.reason ?? "ended"}` as "call.end_ended")
    : null;
  const native = nativeCall();
  const switchRoute = () => {
    const next = route === "ear" ? "speaker" : "ear";
    setRoute(next);
    if (native) {
      try { native.setSpeaker(next === "speaker"); } catch { /* old app */ }
      // The app turns the screen off at the ear by itself; the black screen is only for phones without that sensor.
      let sensor = false;
      try { sensor = Boolean(native.hasProximity?.()); } catch { /* old app */ }
      setPocket(next === "ear" && !sensor);
      return;
    }
    setPocket(next === "ear");
  };
  const sounds = members.map((member) => <Sound key={member.peer.id} stream={member.remote} sinkId={sinkId} />);
  // A group call: more than one other person, or someone already left.
  const group = members.length > 1 || call.left.length > 0;
  const extras = (
    <>
      {sounds}
      {pocket && live ? <Pocket onClose={() => setPocket(false)} /> : null}
      {adding && canAdd ? <AddPeople members={members} left={call.left.map((item) => item.peer)} onClose={() => setAdding(false)} /> : null}
      {roster && group && call.phase !== "ended" ? <Roster members={members} left={call.left.map((item) => item.peer)} canAdd={canAdd} onClose={() => setRoster(false)} /> : null}
      {gone && live ? <div role="status" className="pointer-events-none fixed inset-x-0 top-24 z-[210] mx-auto w-fit max-w-[90vw] truncate rounded-full bg-black/80 px-4 py-2 text-sm text-white shadow-xl">{t("call.leftToast").replace("{name}", gone)}</div> : null}
    </>
  );
  const peopleButton = (size: "sm" | "lg") => group ? (
    <button onClick={() => setRoster(true)} aria-label={t("call.people")} title={t("call.people")} className={size === "sm" ? "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15" : cn(round, "relative bg-white/20 text-white")}>
      <Users size={size === "sm" ? 18 : 22} />
      <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-[#22C55E] px-1 text-center text-[10px] font-bold leading-[18px] text-white">{members.filter((member) => member.status !== "ringing").length + 1}</span>
    </button>
  ) : null;
  const routeButton = (size: "sm" | "lg") => (touch || outputs.ear || native) ? (
    <button onClick={switchRoute} aria-label={t(route === "ear" ? "call.speaker" : "call.ear")} title={t(route === "ear" ? "call.speaker" : "call.ear")}
      className={size === "sm" ? cn("flex h-10 w-10 items-center justify-center rounded-full", route === "ear" ? "bg-white text-[#0B1220]" : "bg-white/15") : cn(round, route === "ear" ? "bg-white text-[#0B1220]" : "bg-white/20 text-white")}>
      {route === "ear" ? <Ear size={size === "sm" ? 18 : 22} /> : <Volume2 size={size === "sm" ? 18 : 22} />}
    </button>
  ) : null;
  const addButton = (size: "sm" | "lg") => canAdd ? (
    <button onClick={() => setAdding(true)} aria-label={t("call.add")} title={t("call.add")} className={size === "sm" ? "flex h-10 w-10 items-center justify-center rounded-full bg-white/15" : cn(round, "bg-white/20 text-white")}>
      <UserPlus size={size === "sm" ? 18 : 22} />
    </button>
  ) : null;

  if (call.phase === "incoming") {
    const photo = photoOf(peer);
    const name = call.group.length ? `${peer.name} +${call.group.length}` : peer.name;
    return (
      <div role="alertdialog" aria-label={`${name} ${status}`} className="fixed inset-x-3 top-3 z-[200] mx-auto max-w-sm rounded-3xl border border-border bg-surface p-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <img src={photo} alt="" className="h-14 w-14 animate-pulse rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{name}</p>
            <p className="text-sm text-muted">{status}</p>
            {call.group.length ? <p className="truncate text-xs text-muted">{t("call.groupWith")}: {call.group.map((item) => item.name).join(", ")}</p> : null}
          </div>
        </div>
        <div className="mt-4 flex justify-around">
          <button onClick={declineCall} aria-label={t("call.decline")} className={cn(round, "bg-[#E53935] text-white")}><PhoneOff size={24} /></button>
          <button onClick={() => void acceptCall()} aria-label={t("call.accept")} className={cn(round, "bg-[#22C55E] text-white")}>{call.video ? <Video size={24} /> : <Phone size={24} />}</button>
        </div>
      </div>
    );
  }
  // A voice call is a compact bar at the top of the screen; the site stays usable underneath (like WhatsApp Web).
  if (!call.video && mini && call.phase !== "ended") {
    const size = 56;
    const fitY = (y: number) => Math.min(window.innerHeight - size - 8, Math.max(8, y));
    const place = drag ? { left: drag.x - size / 2, top: fitY(drag.y - size / 2) } : { [dock.side]: 8, top: fitY(dock.y) };
    return (
      <>
        {extras}
        <button
          type="button"
          aria-label={title}
          title={title}
          style={place}
          onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); grab.current = { x: event.clientX, y: event.clientY, moved: false }; }}
          onPointerMove={(event) => {
            const start = grab.current;
            if (!start) return;
            if (!start.moved && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 6) return;
            start.moved = true;
            setDrag({ x: event.clientX, y: event.clientY });
          }}
          onPointerUp={(event) => {
            const start = grab.current;
            grab.current = null;
            if (!start) return;
            if (start.moved) { setDock({ side: event.clientX < window.innerWidth / 2 ? "left" : "right", y: fitY(event.clientY - size / 2) }); setDrag(null); }
            else setMini(false);
          }}
          onPointerCancel={() => { grab.current = null; setDrag(null); }}
          className="fixed z-[200] h-14 w-14 touch-none select-none rounded-full bg-[#0B1220] p-0.5 shadow-2xl ring-2 ring-white/20"
        >
          <img src={photoOf(shown[0].peer)} alt="" draggable={false} className={cn("pointer-events-none h-full w-full rounded-full object-cover", call.phase !== "active" && "animate-pulse opacity-70")} />
          {call.phase === "active" ? <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-[#22C55E] ring-2 ring-[#0B1220]" /> : null}
          {call.muted ? <span className="absolute -left-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#0B1220]"><MicOff size={12} /></span> : null}
          {shown.length > 1 ? <span className="absolute -right-1 -top-1 rounded-full bg-white/90 px-1 text-[10px] font-bold text-[#0B1220]">+{shown.length - 1}</span> : null}
        </button>
      </>
    );
  }
  if (!call.video) {
    return (
      <>
        {extras}
        <div role="dialog" aria-label={title} className="fixed inset-x-3 top-3 z-[200] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-[#0B1220] px-3 py-2.5 text-white shadow-2xl ring-1 ring-white/10">
          <button type="button" onClick={() => { if (call.phase !== "ended") setMini(true); }} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <div className="flex shrink-0 -space-x-3">
            {shown.slice(0, 3).map((member) => (
              <img key={member.peer.id} src={photoOf(member.peer)} alt="" title={member.peer.name} className={cn("h-11 w-11 rounded-full object-cover ring-2 ring-[#0B1220]", member.status === "ringing" && "animate-pulse opacity-60")} />
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{title}{shown.length > 3 ? ` +${shown.length - 3}` : ""}</p>
            <p className="truncate text-xs text-white/70">{call.phase === "active" ? <><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#22C55E] align-middle" /><Clock from={call.startedAt} />{members.some((member) => member.status === "ringing") && joined.length ? ` · ${t("call.calling")}` : ""}</> : status}</p>
          </div>
          </button>
          {call.phase !== "ended" ? (
            <>
              {peopleButton("sm")}
              {addButton("sm")}
              {canVideo ? <button onClick={() => void enableVideo()} aria-label={t("call.camOn")} title={t("call.camOn")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15"><Video size={18} /></button> : null}
              {routeButton("sm")}
              <button onClick={toggleMute} aria-label={t(call.muted ? "call.unmute" : "call.mute")} className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", call.muted ? "bg-white text-[#0B1220]" : "bg-white/15")}>{call.muted ? <MicOff size={18} /> : <Mic size={18} />}</button>
              <button onClick={hangUp} aria-label={t("call.hangup")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E53935]"><PhoneOff size={18} /></button>
            </>
          ) : null}
        </div>
      </>
    );
  }
  // Video: one person fills the screen; with more people the screen is split into tiles.
  const tile = (member: CallMember, full: boolean) => {
    const hasVideo = Boolean(member.remote?.getVideoTracks().length);
    return (
      <div key={member.peer.id} className={cn("overflow-hidden bg-[#0B1220]", full ? "absolute inset-0" : "relative min-h-0 rounded-2xl")}>
        {hasVideo ? <Stream stream={member.remote} className="absolute inset-0 h-full w-full bg-black object-cover" /> : (
          <div className="flex h-full w-full items-center justify-center">
            <img src={photoOf(member.peer)} alt="" className={cn("rounded-full object-cover ring-4 ring-white/15", full ? "h-32 w-32" : "h-20 w-20", member.status === "ringing" && "animate-pulse opacity-60")} />
          </div>
        )}
        {!full ? <p className="absolute bottom-2 left-2 max-w-[90%] truncate rounded-full bg-black/50 px-2 py-0.5 text-xs">{member.peer.name}</p> : null}
      </div>
    );
  };
  const single = shown.length === 1;
  return (
    <>
      {extras}
      <div role="dialog" aria-label={title} className="fixed inset-0 z-[200] flex flex-col bg-[#0B1220] text-white">
        {single ? tile(shown[0], true) : null}
        <div className="relative z-10 p-6 text-center [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
          <p className="truncate text-xl font-semibold">{title}</p>
          <p className="mt-1 text-sm text-white/80">{call.phase === "active" ? <Clock from={call.startedAt} /> : status}</p>
        </div>
        {single ? <div className="flex-1" /> : (
          <div className={cn("relative z-10 grid min-h-0 flex-1 gap-2 px-2", shown.length > 2 ? "grid-cols-2 grid-rows-2" : "grid-cols-1 grid-rows-2")}>
            {shown.map((member) => tile(member, false))}
          </div>
        )}
        {call.local && hasCam ? <Stream stream={call.local} className={cn("absolute bottom-28 right-4 z-20 h-40 w-28 rounded-2xl bg-black object-cover shadow-xl ring-2 ring-white/30 [transform:scaleX(-1)]", call.camOff && "opacity-30")} /> : null}
        {call.phase !== "ended" ? (
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 pb-10 pt-4">
            {peopleButton("lg")}
            {addButton("lg")}
            {routeButton("lg")}
            <button onClick={toggleMute} aria-label={t(call.muted ? "call.unmute" : "call.mute")} className={cn(round, call.muted ? "bg-white text-[#0B1220]" : "bg-white/20 text-white")}>{call.muted ? <MicOff size={22} /> : <Mic size={22} />}</button>
            <button onClick={toggleCamera} aria-label={t(call.camOff || !hasCam ? "call.camOn" : "call.camOff")} className={cn(round, call.camOff || !hasCam ? "bg-white text-[#0B1220]" : "bg-white/20 text-white")}>{call.camOff || !hasCam ? <VideoOff size={22} /> : <Video size={22} />}</button>
            <button onClick={hangUp} aria-label={t("call.hangup")} className={cn(round, "!h-16 !w-16 bg-[#E53935] text-white")}><PhoneOff size={26} /></button>
          </div>
        ) : <div className="pb-16" />}
      </div>
    </>
  );
}
