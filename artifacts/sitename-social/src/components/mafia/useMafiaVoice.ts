"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

// Live voice for a "voice" Mafia table. Players connect to each other directly (WebRTC, audio only).
// The Supabase realtime channel is used only to pass the connection messages. Nothing is recorded or stored.
// Who may be heard (day: everyone alive, night: only the mafia, vote: nobody) is applied here in the player's own browser,
// so it works for normal players but a modified browser could ignore it.
type Sig =
  | { t: "hello"; from: string; re?: boolean }
  | { t: "offer" | "answer"; from: string; to: string; sdp: string }
  | { t: "ice"; from: string; to: string; c: RTCIceCandidateInit }
  | { t: "bye"; from: string };

type Peer = {
  pc: RTCPeerConnection;
  audio: HTMLAudioElement;
  sender: RTCRtpSender | null;
  analyser: AnalyserNode | null;
  pending: RTCIceCandidateInit[];
};

type Options = { active: boolean; roomKey: string | null; myId: string; canSend: boolean; hear: (id: string) => boolean };

const ICE = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];

function level(analyser: AnalyserNode): number {
  const data = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(data);
  let peak = 0;
  for (let i = 0; i < data.length; i += 1) peak = Math.max(peak, Math.abs(data[i] - 128));
  return peak / 128;
}

export function useMafiaVoice({ active, roomKey, myId, canSend, hear }: Options) {
  const [micOn, setMicOn] = useState(false);
  const [speaking, setSpeaking] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);

  const live = useRef({ canSend, hear, micOn });
  live.current = { canSend, hear, micOn };
  const peers = useRef(new Map<string, Peer>());
  const early = useRef(new Map<string, RTCIceCandidateInit[]>());
  const mic = useRef<MediaStreamTrack | null>(null);
  const micStream = useRef<MediaStream | null>(null);
  const micAnalyser = useRef<AnalyserNode | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const sendSig = useRef<(payload: Sig) => void>(() => undefined);

  useEffect(() => {
    setSupported(typeof RTCPeerConnection !== "undefined" && typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia));
  }, []);

  const audioCtx = useCallback((): AudioContext | null => {
    try {
      if (!ctx.current) ctx.current = new AudioContext();
      if (ctx.current.state === "suspended") void ctx.current.resume();
      return ctx.current;
    } catch { return null; }
  }, []);

  const toggle = useCallback(async () => {
    if (live.current.micOn) { setMicOn(false); return; }
    try {
      if (!mic.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        micStream.current = stream;
        mic.current = stream.getAudioTracks()[0] ?? null;
        const context = audioCtx();
        if (context) {
          const analyser = context.createAnalyser();
          analyser.fftSize = 512;
          context.createMediaStreamSource(stream).connect(analyser);
          micAnalyser.current = analyser;
        }
        for (const peer of peers.current.values()) if (peer.sender && mic.current) void peer.sender.replaceTrack(mic.current);
      }
      audioCtx();
      setError(null);
      setMicOn(true);
    } catch {
      setError("mic");
    }
  }, [audioCtx]);

  useEffect(() => {
    if (!active || !roomKey || !myId || !supabase) return undefined;
    const channel = supabase.channel(`mafia-voice-${roomKey}`, { config: { broadcast: { self: false } } });
    const send = (payload: Sig) => { void channel.send({ type: "broadcast", event: "sig", payload }); };
    sendSig.current = send;

    const drop = (id: string) => {
      const peer = peers.current.get(id);
      if (!peer) return;
      peers.current.delete(id);
      try { peer.pc.close(); } catch { /* already closed */ }
      peer.audio.srcObject = null;
    };

    const flush = async (peer: Peer) => {
      for (const candidate of peer.pending.splice(0)) {
        try { await peer.pc.addIceCandidate(candidate); } catch { /* stale candidate */ }
      }
    };

    const create = (id: string, offerer: boolean): Peer => {
      const pc = new RTCPeerConnection({ iceServers: ICE });
      const audio = new Audio();
      audio.autoplay = true;
      const peer: Peer = { pc, audio, sender: null, analyser: null, pending: early.current.get(id) ?? [] };
      early.current.delete(id);
      if (offerer) {
        const tr = pc.addTransceiver("audio", { direction: "sendrecv" });
        peer.sender = tr.sender;
        if (mic.current) void tr.sender.replaceTrack(mic.current);
      }
      pc.ontrack = (event) => {
        const stream = event.streams[0] ?? new MediaStream([event.track]);
        audio.srcObject = stream;
        void audio.play().catch(() => undefined);
        const context = audioCtx();
        if (context) {
          try {
            const analyser = context.createAnalyser();
            analyser.fftSize = 512;
            context.createMediaStreamSource(stream).connect(analyser);
            peer.analyser = analyser;
          } catch { /* the speaking indicator is optional */ }
        }
      };
      pc.onicecandidate = (event) => { if (event.candidate) send({ t: "ice", from: myId, to: id, c: event.candidate.toJSON() }); };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") { if (peers.current.get(id) === peer) drop(id); }
      };
      peers.current.set(id, peer);
      return peer;
    };

    const startOffer = async (id: string) => {
      const peer = create(id, true);
      const offer = await peer.pc.createOffer();
      await peer.pc.setLocalDescription(offer);
      send({ t: "offer", from: myId, to: id, sdp: offer.sdp ?? "" });
    };

    const onSig = async (m: Sig) => {
      if (m.from === myId) return;
      try {
        if (m.t === "hello") {
          if (!m.re) send({ t: "hello", from: myId, re: true });
          if (myId < m.from && !peers.current.has(m.from)) await startOffer(m.from);
          return;
        }
        if (m.t === "bye") { drop(m.from); return; }
        if (m.to !== myId) return;
        if (m.t === "offer") {
          drop(m.from);
          const peer = create(m.from, false);
          await peer.pc.setRemoteDescription({ type: "offer", sdp: m.sdp });
          const tr = peer.pc.getTransceivers().find((item) => item.receiver.track.kind === "audio");
          if (tr) {
            tr.direction = "sendrecv";
            peer.sender = tr.sender;
            if (mic.current) void tr.sender.replaceTrack(mic.current);
          }
          const answer = await peer.pc.createAnswer();
          await peer.pc.setLocalDescription(answer);
          send({ t: "answer", from: myId, to: m.from, sdp: answer.sdp ?? "" });
          await flush(peer);
          return;
        }
        if (m.t === "answer") {
          const peer = peers.current.get(m.from);
          if (!peer || peer.pc.signalingState !== "have-local-offer") return;
          await peer.pc.setRemoteDescription({ type: "answer", sdp: m.sdp });
          await flush(peer);
          return;
        }
        if (m.t === "ice") {
          const peer = peers.current.get(m.from);
          if (peer && peer.pc.remoteDescription) {
            try { await peer.pc.addIceCandidate(m.c); } catch { /* stale candidate */ }
          } else if (peer) peer.pending.push(m.c);
          else early.current.set(m.from, [...(early.current.get(m.from) ?? []), m.c]);
        }
      } catch { /* one failed connection must not break the others */ }
    };

    channel.on("broadcast", { event: "sig" }, (message: { payload?: unknown }) => { void onSig(message.payload as Sig); });
    channel.subscribe((status: string) => { if (status === "SUBSCRIBED") send({ t: "hello", from: myId }); });
    // Say hello again from time to time so a player whose connection dropped is picked up again.
    const hello = setInterval(() => send({ t: "hello", from: myId }), 8000);

    // Apply "who may be heard" and the speaking indicator four times a second.
    const loop = setInterval(() => {
      const now = live.current;
      if (mic.current) mic.current.enabled = now.micOn && now.canSend;
      const talking: string[] = [];
      if (micAnalyser.current && now.micOn && now.canSend && level(micAnalyser.current) > 0.05) talking.push(myId);
      for (const [id, peer] of peers.current) {
        const ok = now.hear(id);
        peer.audio.muted = !ok;
        if (ok && peer.analyser && level(peer.analyser) > 0.05) talking.push(id);
      }
      setSpeaking((prev) => (prev.join(",") === talking.join(",") ? prev : talking));
    }, 250);

    return () => {
      clearInterval(hello);
      clearInterval(loop);
      send({ t: "bye", from: myId });
      for (const id of Array.from(peers.current.keys())) drop(id);
      early.current.clear();
      sendSig.current = () => undefined;
      void supabase?.removeChannel(channel);
    };
  }, [active, roomKey, myId, audioCtx]);

  // Release the microphone and the audio engine when the table is closed.
  useEffect(() => () => {
    try { micStream.current?.getTracks().forEach((track) => track.stop()); } catch { /* already stopped */ }
    mic.current = null;
    micStream.current = null;
    micAnalyser.current = null;
    try { void ctx.current?.close(); } catch { /* already closed */ }
    ctx.current = null;
  }, []);

  return { micOn, toggle, speaking, error, supported };
}
