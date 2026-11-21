"use client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { siteMusic } from "@/components/music/siteMusic";
import { supabase } from "./supabase";
import { callLogText } from "./callLog";
import { sendRemoteMessage } from "./messagesSync";

// Voice and video calls (WebRTC). The browsers talk directly; Supabase Realtime only carries the short
// "signalling" notes (offer, answer, network candidates, hang-up) on each user's own channel.
// Group calls are a mesh: every member has its own connection to every other member. Someone in the call
// invites a new person; when that person accepts, they connect to everyone else who is already in the call.
export type CallPeer = { id: string; name: string; avatar: string };
export type CallPhase = "idle" | "outgoing" | "incoming" | "connecting" | "active" | "ended";
export type CallEnd = "ended" | "declined" | "busy" | "missed" | "failed" | "nomic";
export type CallMember = { peer: CallPeer; remote: MediaStream | null; status: "ringing" | "connecting" | "active" };
export type CallState = {
  phase: CallPhase; peer: CallPeer | null; video: boolean; local: MediaStream | null; members: CallMember[];
  // Others already in the call that an incoming invitation comes from (shown as "Name +2").
  group: CallPeer[];
  // People who were talking in this call and left it (so the others can see it and invite them back).
  left: { peer: CallPeer; at: number }[];
  muted: boolean; camOff: boolean; startedAt: number; reason: CallEnd | null;
};
type Signal =
  | { type: "offer"; callId: string; from: CallPeer; video: boolean; sdp: RTCSessionDescriptionInit; group?: CallPeer[]; join?: boolean }
  | { type: "answer"; callId: string; from?: string; sdp: RTCSessionDescriptionInit }
  | { type: "ice"; callId: string; from?: string; candidate: RTCIceCandidateInit }
  | { type: "roster"; callId: string; from: string; members: CallPeer[] }
  // A camera switched on during the call: the connection is set up again with the picture added.
  | { type: "reoffer"; callId: string; from: string; video: boolean; sdp: RTCSessionDescriptionInit }
  | { type: "reanswer"; callId: string; from: string; sdp: RTCSessionDescriptionInit }
  | { type: "decline" | "busy" | "hangup"; callId: string; from?: string };

// Each member sends its sound (and picture) to every other member, so a phone can carry only a few people.
export const CALL_LIMIT = { voice: 6, video: 4 };
export const callLimit = (video: boolean) => (video ? CALL_LIMIT.video : CALL_LIMIT.voice);

const idle: CallState = { phase: "idle", peer: null, video: false, local: null, members: [], group: [], left: [], muted: false, camOff: false, startedAt: 0, reason: null };
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

type Link = { peer: CallPeer; pc: RTCPeerConnection; remote: MediaStream; status: CallMember["status"]; waitingIce: RTCIceCandidateInit[]; timer: number; invitedByMe: boolean; again: boolean };
type Box = { channel: RealtimeChannel; ready: boolean; queue: Signal[] };

let me: CallPeer | null = null;
let inbox: RealtimeChannel | null = null;
const outboxes = new Map<string, Box>();
const links = new Map<string, Link>();
const strayIce = new Map<string, RTCIceCandidateInit[]>();
// People whose site already knows the newer notes (they say who a note is from). Older versions would end the call
// on a note they do not know, so the camera is only added for these people.
const modern = new Set<string>();
let callId = "";
let offer: RTCSessionDescriptionInit | null = null;
let ringTimer = 0;
let endTimer = 0;
let musicWasOn = false;
let logPeer: CallPeer | null = null;

export const callSelf = () => me;

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
  let box = outboxes.get(peerId);
  if (!box) {
    const channel = supabase.channel(`call-${peerId}`, { config: { broadcast: { self: false, ack: false } } });
    const created: Box = { channel, ready: false, queue: [] };
    box = created;
    outboxes.set(peerId, created);
    channel.subscribe((status) => {
      if (status !== "SUBSCRIBED" || outboxes.get(peerId) !== created) return;
      created.ready = true;
      created.queue.splice(0).forEach((item) => void channel.send({ type: "broadcast", event: "signal", payload: item }));
    });
  }
  if (box.ready) void box.channel.send({ type: "broadcast", event: "signal", payload: signal });
  else box.queue.push(signal);
}
function closeOutboxes() {
  if (!supabase) return;
  for (const box of outboxes.values()) void supabase.removeChannel(box.channel);
  outboxes.clear();
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

// Read again after an await: another note may have changed the call meanwhile.
const phaseNow = (): CallPhase => state.phase;
const inCall = () => state.phase === "outgoing" || state.phase === "connecting" || state.phase === "active";
const publish = () => set({ members: [...links.values()].map((link) => ({ peer: link.peer, remote: link.remote, status: link.status })) });

async function handle(signal: Signal) {
  if (signal.type === "offer") {
    // Someone who just joined our call connects to us: answer at once, no ringing.
    if (signal.join && signal.callId === callId && inCall() && me) {
      modern.add(signal.from.id);
      if (links.has(signal.from.id) || links.size + 1 >= callLimit(state.video)) { send(signal.from.id, { type: "busy", callId: signal.callId, from: me.id }); return; }
      const link = makeLink(signal.from, false);
      link.status = "connecting";
      publish();
      await link.pc.setRemoteDescription(signal.sdp);
      for (const candidate of link.waitingIce.splice(0)) await link.pc.addIceCandidate(candidate).catch(() => {});
      const answer = await link.pc.createAnswer();
      await link.pc.setLocalDescription(answer);
      send(signal.from.id, { type: "answer", callId, from: me.id, sdp: { type: answer.type, sdp: answer.sdp } });
      return;
    }
    if (state.phase !== "idle" && state.phase !== "ended") { send(signal.from.id, { type: "busy", callId: signal.callId, from: me?.id }); return; }
    window.clearTimeout(endTimer);
    callId = signal.callId;
    offer = signal.sdp;
    strayIce.clear();
    modern.clear();
    if (signal.group) modern.add(signal.from.id);
    logPeer = null;
    set({ ...idle, phase: "incoming", peer: signal.from, video: signal.video, group: (signal.group ?? []).filter((peer) => peer.id !== me?.id && peer.id !== signal.from.id) });
    ring("in");
    window.clearTimeout(ringTimer);
    ringTimer = window.setTimeout(() => { if (state.phase === "incoming" && callId === signal.callId) finish("missed", false); }, 45000);
    return;
  }
  if (signal.callId !== callId) return;
  // A site version from before group calls does not say who a note is from: only trust it in a two-person call.
  if (!signal.from && links.size > 1) return;
  const fromId = signal.from ?? state.peer?.id ?? "";
  if (signal.from) modern.add(signal.from);
  // The caller gave up before I answered.
  if (state.phase === "incoming") {
    if (signal.type === "ice") { strayIce.set(fromId, [...(strayIce.get(fromId) ?? []), signal.candidate]); return; }
    if (signal.type === "hangup" && fromId === state.peer?.id) finish("missed", false);
    return;
  }
  const link = links.get(fromId);
  if (signal.type === "ice") {
    if (!link) { strayIce.set(fromId, [...(strayIce.get(fromId) ?? []), signal.candidate]); return; }
    if (link.pc.remoteDescription) await link.pc.addIceCandidate(signal.candidate).catch(() => {});
    else link.waitingIce.push(signal.candidate);
    return;
  }
  if (signal.type === "roster") {
    // Who else is in the call I just joined (people may have come in after I was invited).
    for (const peer of signal.members) if (peer.id !== me?.id && !links.has(peer.id) && links.size + 1 < callLimit(state.video)) void joinPeer(peer);
    return;
  }
  if (!link) return;
  if (signal.type === "answer") {
    await link.pc.setRemoteDescription(signal.sdp);
    for (const candidate of link.waitingIce.splice(0)) await link.pc.addIceCandidate(candidate).catch(() => {});
    window.clearTimeout(link.timer);
    link.status = "connecting";
    if (state.phase === "outgoing") { ring(null); set({ phase: "connecting" }); }
    publish();
    // The call turned into a video call while this person was still being rung: send them the picture too.
    if (addVideoTo(link)) void renegotiate(link);
    // I invited this person into a running call: tell them who else is here so they connect to everyone.
    if (link.invitedByMe && me) {
      const others = [...links.values()].filter((item) => item.peer.id !== fromId && item.status !== "ringing").map((item) => item.peer);
      if (others.length) send(fromId, { type: "roster", callId, from: me.id, members: others });
    }
    return;
  }
  if (signal.type === "reoffer") {
    const mine = link.pc.signalingState !== "stable";
    // Both switched the camera on at the same moment: the one with the smaller id keeps its own offer.
    if (mine && me && me.id < fromId) return;
    await link.pc.setRemoteDescription(signal.sdp);
    const answer = await link.pc.createAnswer();
    await link.pc.setLocalDescription(answer);
    send(fromId, { type: "reanswer", callId, from: me?.id ?? "", sdp: { type: answer.type, sdp: answer.sdp } });
    if (signal.video && !state.video) set({ video: true, camOff: !state.local?.getVideoTracks().length });
    if (mine) link.again = true;
    if (link.again) void renegotiate(link);
    return;
  }
  if (signal.type === "reanswer") {
    if (link.pc.signalingState === "have-local-offer") await link.pc.setRemoteDescription(signal.sdp).catch(() => {});
    if (link.again) void renegotiate(link);
    return;
  }
  drop(fromId, signal.type === "decline" ? "declined" : signal.type === "busy" ? "busy" : "ended");
}

async function media(video: boolean) {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: video ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } : false });
  } catch {
    return null;
  }
}
function makeLink(peer: CallPeer, invitedByMe: boolean) {
  const old = links.get(peer.id);
  if (old) { window.clearTimeout(old.timer); old.pc.close(); }
  const pc = new RTCPeerConnection({ iceServers: iceServers() });
  const remote = new MediaStream();
  const link: Link = { peer, pc, remote, status: "ringing", waitingIce: strayIce.get(peer.id) ?? [], timer: 0, invitedByMe, again: false };
  strayIce.delete(peer.id);
  links.set(peer.id, link);
  state.local?.getTracks().forEach((track) => pc.addTrack(track, state.local!));
  pc.ontrack = (event) => {
    event.streams[0]?.getTracks().forEach((track) => { if (!remote.getTracks().includes(track)) remote.addTrack(track); });
    if (!event.streams[0] && !remote.getTracks().includes(event.track)) remote.addTrack(event.track);
    publish();
  };
  pc.onicecandidate = (event) => { if (event.candidate) send(peer.id, { type: "ice", callId, from: me?.id, candidate: event.candidate.toJSON() }); };
  pc.onconnectionstatechange = () => {
    if (links.get(peer.id) !== link) return;
    if (pc.connectionState === "connected") {
      window.clearTimeout(link.timer);
      link.status = "active";
      ring(null);
      // Back in the call: no longer "left" (someone who left and is being rung again stays in that list until they answer).
      if (state.left.some((item) => item.peer.id === peer.id)) set({ left: state.left.filter((item) => item.peer.id !== peer.id) });
      if (state.phase !== "active") set({ phase: "active", startedAt: state.startedAt || Date.now() });
      publish();
    }
    if (pc.connectionState === "failed") drop(peer.id, "failed", true);
  };
  return link;
}
// One person leaves (or never came): the call goes on while someone else is still in it.
function drop(peerId: string, reason: CallEnd, tell = false) {
  const link = links.get(peerId);
  if (!link) return;
  if (tell) send(peerId, { type: "hangup", callId, from: me?.id });
  window.clearTimeout(link.timer);
  link.pc.close();
  links.delete(peerId);
  if (links.size === 0) { finish(reason, false); return; }
  if (link.status !== "ringing") set({ left: [...state.left.filter((item) => item.peer.id !== peerId), { peer: link.peer, at: Date.now() }] });
  if (state.peer?.id === peerId) set({ peer: links.values().next().value!.peer });
  publish();
}

// ---- turning a voice call into a video call ----
function addVideoTo(link: Link) {
  const local = state.local;
  const track = local?.getVideoTracks()[0];
  if (!local || !track || !modern.has(link.peer.id) || link.pc.getSenders().some((sender) => sender.track === track)) return false;
  link.pc.addTrack(track, local);
  return true;
}
async function renegotiate(link: Link) {
  if (!me || links.get(link.peer.id) !== link || link.status === "ringing" || !modern.has(link.peer.id)) return;
  if (link.pc.signalingState !== "stable") { link.again = true; return; }
  link.again = false;
  const description = await link.pc.createOffer();
  await link.pc.setLocalDescription(description);
  send(link.peer.id, { type: "reoffer", callId, from: me.id, video: true, sdp: { type: description.type, sdp: description.sdp } });
}
// The camera button: switches my camera on in a running call without hanging up. The others see me at once;
// their own camera stays off until they press the button too.
export async function enableVideo() {
  if (!me || !state.local || (state.phase !== "active" && state.phase !== "connecting")) return;
  if (state.local.getVideoTracks().length || links.size + 1 > CALL_LIMIT.video) return;
  const id = callId;
  let track: MediaStreamTrack | undefined;
  try {
    track = (await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } })).getVideoTracks()[0];
  } catch { return; }
  const local = state.local;
  if (!track || !local || callId !== id || (phaseNow() !== "active" && phaseNow() !== "connecting")) { track?.stop(); return; }
  local.addTrack(track);
  set({ video: true, camOff: false, local });
  for (const link of links.values()) if (addVideoTo(link)) void renegotiate(link);
}

export async function startCall(peer: CallPeer, video: boolean) {
  if (!me || !supabase || (state.phase !== "idle" && state.phase !== "ended")) return;
  window.clearTimeout(endTimer);
  closeOutboxes();
  links.clear();
  strayIce.clear();
  modern.clear();
  callId = `${me.id.slice(0, 8)}-${Date.now().toString(36)}`;
  logPeer = peer;
  set({ ...idle, phase: "outgoing", peer, video });
  quietMusic(true);
  const local = await media(video);
  if (!local) { finish("nomic", false); return; }
  if (phaseNow() !== "outgoing") { local.getTracks().forEach((track) => track.stop()); return; }
  set({ local });
  const link = makeLink(peer, false);
  publish();
  const description = await link.pc.createOffer();
  await link.pc.setLocalDescription(description);
  send(peer.id, { type: "offer", callId, from: me, video, sdp: { type: description.type, sdp: description.sdp } });
  ring("out");
  link.timer = window.setTimeout(() => { if (links.get(peer.id) === link && link.status === "ringing") drop(peer.id, "missed", true); }, 45000);
}

// "Add to call": ring one more person; the others already in the call are listed so the newcomer can reach them.
export async function inviteToCall(peer: CallPeer) {
  if (!me || !supabase || !state.local || (state.phase !== "active" && state.phase !== "connecting")) return;
  if (peer.id === me.id || links.has(peer.id) || links.size + 1 >= callLimit(state.video)) return;
  const group = [...links.values()].filter((item) => item.status !== "ringing").map((item) => item.peer);
  const link = makeLink(peer, true);
  publish();
  const description = await link.pc.createOffer();
  await link.pc.setLocalDescription(description);
  send(peer.id, { type: "offer", callId, from: me, video: state.video, sdp: { type: description.type, sdp: description.sdp }, group });
  link.timer = window.setTimeout(() => { if (links.get(peer.id) === link && link.status === "ringing") drop(peer.id, "missed", true); }, 45000);
}
// I joined a group call: connect to one of the people already in it.
async function joinPeer(peer: CallPeer) {
  if (!me || !state.local) return;
  const link = makeLink(peer, false);
  link.status = "connecting";
  publish();
  const description = await link.pc.createOffer();
  await link.pc.setLocalDescription(description);
  send(peer.id, { type: "offer", callId, from: me, video: state.video, sdp: { type: description.type, sdp: description.sdp }, join: true });
  link.timer = window.setTimeout(() => { if (links.get(peer.id) === link && link.status !== "active") drop(peer.id, "failed", true); }, 30000);
}

export async function acceptCall() {
  if (state.phase !== "incoming" || !state.peer || !offer || !me) return;
  window.clearTimeout(ringTimer);
  ring(null);
  const peer = state.peer;
  const group = state.group;
  const id = callId;
  set({ phase: "connecting" });
  quietMusic(true);
  const local = await media(state.video);
  if (!local) { send(peer.id, { type: "decline", callId, from: me.id }); finish("nomic", false); return; }
  if (callId !== id || phaseNow() !== "connecting") { local.getTracks().forEach((track) => track.stop()); return; }
  set({ local });
  const link = makeLink(peer, false);
  link.status = "connecting";
  publish();
  await link.pc.setRemoteDescription(offer);
  for (const candidate of link.waitingIce.splice(0)) await link.pc.addIceCandidate(candidate).catch(() => {});
  const answer = await link.pc.createAnswer();
  await link.pc.setLocalDescription(answer);
  send(peer.id, { type: "answer", callId, from: me.id, sdp: { type: answer.type, sdp: answer.sdp } });
  for (const other of group) if (!links.has(other.id) && links.size + 1 < callLimit(state.video)) void joinPeer(other);
}
export function declineCall() {
  if (state.phase !== "incoming" || !state.peer) return;
  send(state.peer.id, { type: "decline", callId, from: me?.id });
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
  if (!state.local?.getVideoTracks().length) { void enableVideo(); return; }
  const camOff = !state.camOff;
  state.local?.getVideoTracks().forEach((track) => { track.enabled = !camOff; });
  set({ camOff });
}

function finish(reason: CallEnd, tell: boolean) {
  window.clearTimeout(ringTimer);
  ring(null);
  if (tell) {
    for (const id of links.keys()) send(id, { type: "hangup", callId, from: me?.id });
    if (!links.size && state.peer) send(state.peer.id, { type: "hangup", callId, from: me?.id });
  }
  const hadMusic = state.phase !== "incoming";
  // The one who started the call writes one line about it into the private chat with the first person called.
  if (logPeer && reason !== "nomic") {
    const talked = state.startedAt ? (Date.now() - state.startedAt) / 1000 : 0;
    const kind = talked ? "done" : reason === "declined" ? "declined" : reason === "busy" ? "busy" : reason === "missed" ? "missed" : reason === "failed" ? "failed" : "cancelled";
    void sendRemoteMessage(logPeer.id, { text: callLogText(kind, talked) });
  }
  logPeer = null;
  for (const link of links.values()) { window.clearTimeout(link.timer); link.pc.close(); }
  links.clear();
  strayIce.clear();
  modern.clear();
  offer = null;
  state.local?.getTracks().forEach((track) => track.stop());
  set({ phase: "ended", reason, local: null, members: [] });
  if (hadMusic) quietMusic(false);
  window.clearTimeout(endTimer);
  endTimer = window.setTimeout(() => {
    if (state.phase === "ended") set(idle);
    closeOutboxes();
  }, 2500);
}
