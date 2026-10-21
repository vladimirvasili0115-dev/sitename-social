"use client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { siteMusic } from "@/components/music/siteMusic";
import { supabase } from "./supabase";

// Voice and video calls between two people (WebRTC). The two browsers talk directly; Supabase Realtime only
// carries the short "signalling" notes (offer, answer, network candidates, hang-up) on each user's own channel.
export type CallPeer = { id: string; name: string; avatar: string };
export type CallPhase = "idle" | "outgoing" | "incoming" | "connecting" | "active" | "ended";
export type CallEnd = "ended" | "declined" | "busy" | "missed" | "failed" | "nomic";
export type CallState = {
  phase: CallPhase; peer: CallPeer | null; video: boolean; local: MediaStream | null; remote: MediaStream | null;
  muted: boolean; camOff: boolean; startedAt: number; reason: CallEnd | null;
};
type Signal =
  | { type: "offer"; callId: string; from: CallPeer; video: boolean; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; callId: string; sdp: RTCSessionDescriptionInit }
  | { type: "ice"; callId: string; candidate: RTCIceCandidateInit }
  | { type: "decline" | "busy" | "hangup"; callId: string };

const idle: CallState = { phase: "idle", peer: null, video: false, local: null, remote: null, muted: false, camOff: false, startedAt: 0, reason: null };
let state: CallState = idle;
const listeners = new Set<() => void>();
const set = (patch: Partial<CallState>) => { state = { ...state, ...patch }; listeners.forEach((listener) => listener()); };
export const callStore = {
  get: () => state,
  getServer: () => idle,
  subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
};

// STUN finds the public address; a TURN server (our VPS) relays the sound when the two networks block each other.
function iceServers(): RTCIceServer[] {
  const list: RTCIceServer[] = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];
  const url = process.env.NEXT_PUBLIC_TURN_URL;
  if (url) list.push({ urls: url.split(",").map((item) => item.trim()), username: process.env.NEXT_PUBLIC_TURN_USER, credential: process.env.NEXT_PUBLIC_TURN_PASS });
  return list;
}

let me: CallPeer | null = null;
let inbox: RealtimeChannel | null = null;
let outbox: { peerId: string; channel: RealtimeChannel; ready: boolean; queue: Signal[] } | null = null;
let pc: RTCPeerConnection | null = null;
let callId = "";
let offer: RTCSessionDescriptionInit | null = null;
let waitingIce: RTCIceCandidateInit[] = [];
let ringTimer = 0;
let endTimer = 0;
let musicWasOn = false;

// ---- music: everything that plays stops during a call and comes back afterwards ----
function quietMusic(on: boolean) {
  if (on) {
    musicWasOn = siteMusic.isPlaying();
    siteMusic.pause();
  } else if (musicWasOn) {
    musicWasOn = false;
    siteMusic.toggle();
  }
  window.dispatchEvent(new CustomEvent("nudepart-call", { detail: { active: on } }));
}

// ---- ring tones (made with WebAudio, no files) ----
let tone: { ctx: AudioContext; timer: number } | null = null;
function ring(kind: "in" | "out" | null) {
  if (tone) { window.clearInterval(tone.timer); void tone.ctx.close().catch(() => {}); tone = null; }
  if (!kind) return;
  try {
    const ctx = new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const beep = () => {
      const notes = kind === "in" ? [880, 660, 880, 660] : [440];
      notes.forEach((freq, n) => {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.frequency.value = freq;
        osc.type = "sine";
        const at = ctx.currentTime + n * 0.18;
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(kind === "in" ? 0.25 : 0.12, at + 0.02);
        gain.gain.linearRampToValueAtTime(0, at + (kind === "in" ? 0.16 : 1.2));
        osc.connect(gain).connect(ctx.destination);
        osc.start(at);
        osc.stop(at + (kind === "in" ? 0.18 : 1.25));
      });
    };
    beep();
    tone = { ctx, timer: window.setInterval(beep, kind === "in" ? 1600 : 3000) };
  } catch { /* no audio */ }
}

// ---- signalling ----
function send(peerId: string, signal: Signal) {
  if (!supabase) return;
  if (!outbox || outbox.peerId !== peerId) {
    if (outbox) void supabase.removeChannel(outbox.channel);
    const channel = supabase.channel(`call-${peerId}`, { config: { broadcast: { self: false, ack: false } } });
    const box = { peerId, channel, ready: false, queue: [] as Signal[] };
    outbox = box;
    channel.subscribe((status) => {
      if (status !== "SUBSCRIBED" || outbox !== box) return;
      box.ready = true;
      box.queue.splice(0).forEach((item) => void channel.send({ type: "broadcast", event: "signal", payload: item }));
    });
  }
  if (outbox.ready) void outbox.channel.send({ type: "broadcast", event: "signal", payload: signal });
  else outbox.queue.push(signal);
}

export function startCallService(user: CallPeer) {
  if (!supabase) return () => undefined;
  me = user;
  const client = supabase;
  const channel = client.channel(`call-${user.id}`, { config: { broadcast: { self: false } } });
  channel.on("broadcast", { event: "signal" }, (message) => { const payload = (message as { payload?: Signal }).payload; if (payload) void handle(payload); }).subscribe();
  inbox = channel;
  return () => { if (inbox === channel) inbox = null; void client.removeChannel(channel); };
}
export function updateCallSelf(user: CallPeer) { if (me && me.id === user.id) me = user; }

async function handle(signal: Signal) {
  if (signal.type === "offer") {
    if (state.phase !== "idle" && state.phase !== "ended") { send(signal.from.id, { type: "busy", callId: signal.callId }); return; }
    window.clearTimeout(endTimer);
    callId = signal.callId;
    offer = signal.sdp;
    waitingIce = [];
    set({ ...idle, phase: "incoming", peer: signal.from, video: signal.video });
    ring("in");
    window.clearTimeout(ringTimer);
    ringTimer = window.setTimeout(() => { if (state.phase === "incoming" && callId === signal.callId) finish("missed", false); }, 45000);
    return;
  }
  if (signal.callId !== callId) return;
  if (signal.type === "answer") {
    if (!pc) return;
    await pc.setRemoteDescription(signal.sdp);
    for (const candidate of waitingIce.splice(0)) await pc.addIceCandidate(candidate).catch(() => {});
    ring(null);
    set({ phase: "connecting" });
    return;
  }
  if (signal.type === "ice") {
    if (pc && pc.remoteDescription) await pc.addIceCandidate(signal.candidate).catch(() => {});
    else waitingIce.push(signal.candidate);
    return;
  }
  finish(signal.type === "decline" ? "declined" : signal.type === "busy" ? "busy" : state.phase === "incoming" ? "missed" : "ended", false);
}

async function media(video: boolean) {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: video ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } : false });
  } catch {
    return null;
  }
}
function connection(peerId: string) {
  const conn = new RTCPeerConnection({ iceServers: iceServers() });
  const remote = new MediaStream();
  conn.ontrack = (event) => { event.streams[0]?.getTracks().forEach((track) => { if (!remote.getTracks().includes(track)) remote.addTrack(track); }); if (!event.streams[0]) remote.addTrack(event.track); set({ remote }); };
  conn.onicecandidate = (event) => { if (event.candidate) send(peerId, { type: "ice", callId, candidate: event.candidate.toJSON() }); };
  conn.onconnectionstatechange = () => {
    if (conn !== pc) return;
    if (conn.connectionState === "connected") { ring(null); set({ phase: "active", startedAt: Date.now() }); }
    if (conn.connectionState === "failed") finish("failed", true);
  };
  set({ remote });
  return conn;
}

export async function startCall(peer: CallPeer, video: boolean) {
  if (!me || !supabase || (state.phase !== "idle" && state.phase !== "ended")) return;
  window.clearTimeout(endTimer);
  callId = `${me.id.slice(0, 8)}-${Date.now().toString(36)}`;
  waitingIce = [];
  set({ ...idle, phase: "outgoing", peer, video });
  quietMusic(true);
  const local = await media(video);
  if (!local) { finish("nomic", false); return; }
  set({ local });
  pc = connection(peer.id);
  local.getTracks().forEach((track) => pc!.addTrack(track, local));
  const description = await pc.createOffer();
  await pc.setLocalDescription(description);
  send(peer.id, { type: "offer", callId, from: me, video, sdp: { type: description.type, sdp: description.sdp } });
  ring("out");
  window.clearTimeout(ringTimer);
  const id = callId;
  ringTimer = window.setTimeout(() => { if (callId === id && state.phase === "outgoing") finish("missed", true); }, 45000);
}

export async function acceptCall() {
  if (state.phase !== "incoming" || !state.peer || !offer) return;
  window.clearTimeout(ringTimer);
  ring(null);
  const peer = state.peer;
  set({ phase: "connecting" });
  quietMusic(true);
  const local = await media(state.video);
  if (!local) { send(peer.id, { type: "decline", callId }); finish("nomic", false); return; }
  set({ local });
  pc = connection(peer.id);
  local.getTracks().forEach((track) => pc!.addTrack(track, local));
  await pc.setRemoteDescription(offer);
  for (const candidate of waitingIce.splice(0)) await pc.addIceCandidate(candidate).catch(() => {});
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  send(peer.id, { type: "answer", callId, sdp: { type: answer.type, sdp: answer.sdp } });
}
export function declineCall() {
  if (state.phase !== "incoming" || !state.peer) return;
  send(state.peer.id, { type: "decline", callId });
  finish("declined", false);
}
export function hangUp() {
  if (state.phase === "idle" || state.phase === "ended") return;
  finish("ended", true);
}
export function toggleMute() {
  const muted = !state.muted;
  state.local?.getAudioTracks().forEach((track) => { track.enabled = !muted; });
  set({ muted });
}
export function toggleCamera() {
  const camOff = !state.camOff;
  state.local?.getVideoTracks().forEach((track) => { track.enabled = !camOff; });
  set({ camOff });
}

function finish(reason: CallEnd, tell: boolean) {
  window.clearTimeout(ringTimer);
  ring(null);
  if (tell && state.peer) send(state.peer.id, { type: "hangup", callId });
  const hadMusic = state.phase !== "incoming";
  pc?.close();
  pc = null;
  offer = null;
  state.local?.getTracks().forEach((track) => track.stop());
  set({ phase: "ended", reason, local: null, remote: null });
  if (hadMusic) quietMusic(false);
  window.clearTimeout(endTimer);
  endTimer = window.setTimeout(() => {
    if (state.phase === "ended") set(idle);
    if (outbox && supabase) { void supabase.removeChannel(outbox.channel); outbox = null; }
  }, 2500);
}
