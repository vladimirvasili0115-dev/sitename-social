"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react";
import { acceptCall, callStore, declineCall, hangUp, toggleCamera, toggleMute } from "@/lib/callSync";
import { initialsAvatar } from "@/lib/avatar";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

// The call window for the whole site: an incoming call rings on any page; a call in progress stays on top.
function Stream({ stream, muted, className }: { stream: MediaStream | null; muted?: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (ref.current && ref.current.srcObject !== stream) ref.current.srcObject = stream; }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} className={className} />;
}
function Clock({ from }: { from: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const secs = Math.max(0, Math.floor((now - from) / 1000));
  return <span className="tabular-nums">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</span>;
}
const round = "flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition active:scale-95";

export function CallHost() {
  const { t } = useTranslation();
  const call = useSyncExternalStore(callStore.subscribe, callStore.get, callStore.getServer);
  if (call.phase === "idle" || !call.peer) return null;
  const peer = call.peer;
  const photo = peer.avatar || initialsAvatar(peer.name || "?");
  const remoteVideo = call.video && call.remote?.getVideoTracks().length;
  const status = call.phase === "incoming" ? t(call.video ? "call.incomingVideo" : "call.incomingVoice")
    : call.phase === "outgoing" ? t("call.calling")
    : call.phase === "connecting" ? t("call.connecting")
    : call.phase === "ended" ? t(`call.end_${call.reason ?? "ended"}` as "call.end_ended")
    : null;

  if (call.phase === "incoming") {
    return (
      <div role="alertdialog" aria-label={`${peer.name} ${status}`} className="fixed inset-x-3 top-3 z-[200] mx-auto max-w-sm rounded-3xl border border-border bg-surface p-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <img src={photo} alt="" className="h-14 w-14 animate-pulse rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{peer.name}</p>
            <p className="text-sm text-muted">{status}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-around">
          <button onClick={declineCall} aria-label={t("call.decline")} className={cn(round, "bg-[#E53935]")}><PhoneOff size={24} /></button>
          <button onClick={() => void acceptCall()} aria-label={t("call.accept")} className={cn(round, "bg-[#22C55E]")}>{call.video ? <Video size={24} /> : <Phone size={24} />}</button>
        </div>
      </div>
    );
  }
  return (
    <div role="dialog" aria-label={peer.name} className="fixed inset-0 z-[200] flex flex-col bg-[#0B1220] text-white">
      {remoteVideo ? <Stream stream={call.remote} className="absolute inset-0 h-full w-full bg-black object-cover" /> : (
        <>
          <Stream stream={call.remote} className="hidden" />
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <img src={photo} alt="" className={cn("h-32 w-32 rounded-full object-cover ring-4 ring-white/15", call.phase === "outgoing" && "animate-pulse")} />
          </div>
        </>
      )}
      <div className="relative z-10 p-6 text-center [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
        <p className="text-xl font-semibold">{peer.name}</p>
        <p className="mt-1 text-sm text-white/80">{call.phase === "active" ? <Clock from={call.startedAt} /> : status}</p>
      </div>
      {call.video && call.local ? <Stream stream={call.local} muted className={cn("absolute bottom-28 right-4 z-10 h-40 w-28 rounded-2xl bg-black object-cover shadow-xl ring-2 ring-white/30 [transform:scaleX(-1)]", call.camOff && "opacity-30")} /> : null}
      {remoteVideo ? <div className="flex-1" /> : null}
      {call.phase !== "ended" ? (
        <div className="relative z-10 flex items-center justify-center gap-5 pb-10 pt-4">
          <button onClick={toggleMute} aria-label={t(call.muted ? "call.unmute" : "call.mute")} className={cn(round, call.muted ? "bg-white text-[#0B1220]" : "bg-white/20")}>{call.muted ? <MicOff size={22} /> : <Mic size={22} />}</button>
          {call.video ? <button onClick={toggleCamera} aria-label={t(call.camOff ? "call.camOn" : "call.camOff")} className={cn(round, call.camOff ? "bg-white text-[#0B1220]" : "bg-white/20")}>{call.camOff ? <VideoOff size={22} /> : <Video size={22} />}</button> : null}
          <button onClick={hangUp} aria-label={t("call.hangup")} className={cn(round, "h-16 w-16 bg-[#E53935]")}><PhoneOff size={26} /></button>
        </div>
      ) : <div className="pb-16" />}
    </div>
  );
}
