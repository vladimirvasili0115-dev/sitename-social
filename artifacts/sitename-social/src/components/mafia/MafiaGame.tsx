"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import {
  mafiaAct, mafiaCreate, mafiaJoin, mafiaLeave, mafiaQuick, mafiaReport, mafiaRoomsList, mafiaSay, mafiaState,
  type MafiaChat, type MafiaJoin, type MafiaList, type MafiaPlayer, type MafiaRole, type MafiaState,
} from "@/lib/mafiaSync";
import { isNarratorOff, narrate, setNarratorOff } from "./narrator";
import { useMafiaVoice } from "./useMafiaVoice";

type Dict = Record<string, string>;
const TX: Record<"az" | "en", Dict> = {
  az: {
    title: "MAFİYA", sub: "Gecə başlayır. Mafiya kimdir?", back: "Geri", hearts: "ürək", rules: "Qaydalar", rulesTitle: "Mafiya necə oynanır?",
    rulesText: "Hər oyunçuya gizli rol verilir. Gecə mafiya bir nəfəri seçib aradan götürür, Komissar bir nəfərin mafiya olub-olmadığını yoxlayır, Doktor bir nəfəri xilas edir. Gündüz hamı müzakirə edir və səsvermə ilə birini asır. Mafiya bütün mülkilərdən çox və ya bərabər olanda mafiya, bütün mafiya çıxarılanda şəhər qalib gəlir. Qalib komanda masanın ürəklərini bölüşür (10% oyun haqqıdır).",
    practice: "Məşq (botlarla)", classic: "Klassik", fast: "Sürətli", vip: "VIP", private: "Şəxsi masa", free: "Pulsuz", entry: "Giriş",
    openTables: "Açıq masalar", noTables: "Hələ açıq masa yoxdur. Yuxarıdakı düymələrdən birini bas.", join: "Qoşul", players: "oyunçu",
    createPrivate: "Şəxsi masa yarat", password: "Şifrə", create: "Yarat", myStats: "Oyunlarım", wins: "qələbə",
    needHearts: "Ürək çatmır. Lazımdır:", closed: "Masa artıq bağlanıb.", full: "Masa doludur.", badPass: "Şifrə səhvdir.", busy: "Sən artıq başqa masadasan.", failed: "Alınmadı, yenidən cəhd et.",
    lobby: "Gözləyirik", lobbyHint: "Oyunçular toplaşır. Minimum:", startIn: "Başlayır:", waitMore: "Daha oyunçu gözlənilir", leave: "Çıx", leaveConfirm: "Oyundan çıxsan, giriş haqqın geri qaytarılmayacaq. Çıxırsan?",
    night: "GECƏ", talk: "MÜZAKİRƏ", vote: "SƏSVERMƏ", end: "OYUN BİTDİ",
    role: "Sənin rolun", r_mafia: "Mafiya", r_sheriff: "Komissar", r_doctor: "Doktor", r_civil: "Mülki",
    h_mafia_night: "Kimi aradan götürək? Oyunçuya toxun.", h_sheriff_night: "Kimi yoxlayırsan? Oyunçuya toxun.", h_doctor_night: "Kimi xilas edirsən? Oyunçuya toxun.", h_civil_night: "Şəhər yatır. Sabaha gözlə.",
    h_talk: "Müzakirə et: kim mafiyadır?", h_vote: "Kimi asırıq? Oyunçuya toxun.", h_dead: "Sən oyundan çıxdın, izləyirsən.",
    checkedMafia: "MAFİYADIR", checkedClean: "mafiya deyil", repeatSave: "Eyni adamı ardıcıl iki gecə xilas etmək olmaz.",
    chatPlaceholder: "Mesaj yaz…", chatNight: "Gecə yalnız mafiya yazır", chatDead: "Ölənlər yaza bilmir", mafiaChat: "Mafiya söhbəti", send: "Göndər",
    winMafia: "Mafiya qalib gəldi!", winCivil: "Şəhər qalib gəldi!", youWon: "TƏBRİKLƏR, QAZANDINIZ!", youLost: "Bu dəfə alınmadı.", prize: "Mükafat", again: "Yenidən oyna", roles: "Rollar",
    textTable: "Yazışmalı", voiceTable: "Səsli", tableType: "Masa növü", micOn: "Mikrafon açıqdır", micOff: "Mikrafon bağlıdır", micDenied: "Mikrafon icazəsi verilmədi. Telefon və ya brauzer ayarlarından icazə ver.", micMuted: "İndi sənin səsin eşidilmir.", voiceNo: "Bu cihazda səs dəstəklənmir.", voiceNote: "Səsli masa: gündüz hamı danışır, gecə yalnız mafiya, səsvermədə susulur.",
    votes: "səs", report: "Şikayət", reported: "Şikayət göndərildi.", voiceOn: "Səsli aparıcı: açıq", voiceOff: "Səsli aparıcı: bağlı", youTag: "sən", noOnline: "Oyun üçün hesaba daxil ol.",
  },
  en: {
    title: "MAFIA", sub: "Night is coming. Who is the mafia?", back: "Back", hearts: "hearts", rules: "Rules", rulesTitle: "How to play Mafia",
    rulesText: "Every player gets a secret role. At night the mafia picks someone to remove, the Sheriff checks whether someone is mafia, the Doctor saves one person. By day everyone talks and votes to hang one player. The mafia wins when it equals or outnumbers the town; the town wins when all the mafia is gone. The winning team splits the table's hearts (10% is the house fee).",
    practice: "Practice (with bots)", classic: "Classic", fast: "Fast", vip: "VIP", private: "Private table", free: "Free", entry: "Entry",
    openTables: "Open tables", noTables: "No open tables yet. Press one of the buttons above.", join: "Join", players: "players",
    createPrivate: "Create private table", password: "Password", create: "Create", myStats: "My games", wins: "wins",
    needHearts: "Not enough hearts. Needed:", closed: "The table is closed.", full: "The table is full.", badPass: "Wrong password.", busy: "You are already at another table.", failed: "Failed, try again.",
    lobby: "Waiting", lobbyHint: "Players are gathering. Minimum:", startIn: "Starts in:", waitMore: "Waiting for more players", leave: "Leave", leaveConfirm: "If you leave now, your entry fee is not refunded. Leave?",
    night: "NIGHT", talk: "DISCUSSION", vote: "VOTING", end: "GAME OVER",
    role: "Your role", r_mafia: "Mafia", r_sheriff: "Sheriff", r_doctor: "Doctor", r_civil: "Civilian",
    h_mafia_night: "Who do we take out? Tap a player.", h_sheriff_night: "Who do you check? Tap a player.", h_doctor_night: "Who do you save? Tap a player.", h_civil_night: "The town sleeps. Wait for morning.",
    h_talk: "Discuss: who is the mafia?", h_vote: "Who do we hang? Tap a player.", h_dead: "You are out of the game, you are watching.",
    checkedMafia: "IS MAFIA", checkedClean: "is not mafia", repeatSave: "You cannot save the same person two nights in a row.",
    chatPlaceholder: "Write a message…", chatNight: "Only the mafia can write at night", chatDead: "The dead cannot write", mafiaChat: "Mafia chat", send: "Send",
    winMafia: "The mafia wins!", winCivil: "The town wins!", youWon: "CONGRATULATIONS, YOU WON!", youLost: "Not this time.", prize: "Prize", again: "Play again", roles: "Roles",
    textTable: "Text", voiceTable: "Voice", tableType: "Table type", micOn: "Microphone is on", micOff: "Microphone is off", micDenied: "Microphone permission was denied. Allow it in your phone or browser settings.", micMuted: "You cannot be heard right now.", voiceNo: "Voice is not supported on this device.", voiceNote: "Voice table: everyone talks by day, only the mafia at night, silence while voting.",
    votes: "votes", report: "Report", reported: "Report sent.", voiceOn: "Voice host: on", voiceOff: "Voice host: off", youTag: "you", noOnline: "Sign in to play.",
  },
};

const KIND_ORDER = ["practice", "classic", "fast", "vip"] as const;
const KIND_FEE: Record<string, number> = { practice: 0, classic: 200, fast: 500, vip: 5000, private: 0 };
const KIND_ICON: Record<string, string> = { practice: "🤖", classic: "🎭", fast: "⚡", vip: "👑", private: "🔒" };
const ROLE_ICON: Record<MafiaRole, string> = { mafia: "🕴️", sheriff: "🕵️", doctor: "🩺", civil: "👤" };
const FACES = ["😎", "🧔", "👩", "🧑", "👱", "👨", "👩‍🦰", "🧓", "👦", "👧"];
const SPOKEN = new Set(["game_start", "night_start", "day_start", "vote_start", "kill", "nokill", "saved", "hang", "nohang", "win_mafia", "win_civil"]);

const fmtSecs = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
const team = (role: MafiaRole | null) => (role === "mafia" ? "mafia" : "civil");

export function MafiaGame() {
  const { locale } = useTranslation();
  const lang: "az" | "en" = locale === "az" ? "az" : "en";
  const tx = useCallback((key: string) => TX[lang][key] ?? TX.az[key] ?? key, [lang]);

  const [list, setList] = useState<MafiaList | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [joinPw, setJoinPw] = useState<{ room: number; value: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [voiceOff, setVoiceOff] = useState(false);
  const [voiceTable, setVoiceTable] = useState(false);

  useEffect(() => { setVoiceOff(isNarratorOff()); }, []);

  // Lobby list, refreshed every 3 seconds while no room is open.
  useEffect(() => {
    if (roomId !== null) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const pull = async () => {
      const data = await mafiaRoomsList();
      if (!alive) return;
      if (data) {
        setList(data);
        if (data.me && roomId === null) { setRoomId(data.me); return; }
      }
      timer = setTimeout(() => { void pull(); }, 3000);
    };
    void pull();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [roomId]);

  const explain = useCallback((res: MafiaJoin | null) => {
    if (!res) return tx("failed");
    if (res.error === "hearts") return `${tx("needHearts")} ${res.need ?? ""}`;
    if (res.error === "closed") return tx("closed");
    if (res.error === "full") return tx("full");
    if (res.error === "password") return tx("badPass");
    if (res.error === "busy") return tx("busy");
    return tx("failed");
  }, [tx]);

  const enter = useCallback((res: MafiaJoin | null) => {
    if (res && res.room) { setNote(null); setRoomId(res.room); return; }
    if (res && res.error === "busy" && res.room) { setRoomId(res.room); return; }
    setNote(explain(res));
  }, [explain]);

  const quick = async (kind: string) => {
    if (busy) return;
    setBusy(true);
    enter(await mafiaQuick(kind, voiceTable && kind !== "practice"));
    setBusy(false);
  };
  const create = async () => {
    if (busy || !pw.trim()) return;
    setBusy(true);
    enter(await mafiaCreate("private", pw.trim(), voiceTable));
    setBusy(false);
  };
  const join = async (room: number, password: string | null) => {
    if (busy) return;
    setBusy(true);
    const res = await mafiaJoin(room, password);
    if (res && res.error === "password") setNote(tx("badPass")); else enter(res);
    setBusy(false);
  };

  const toggleVoice = () => { const next = !voiceOff; setVoiceOff(next); setNarratorOff(next); };

  const shell = "fixed inset-0 z-[60] overflow-y-auto bg-[radial-gradient(120%_70%_at_50%_0,#4a0e2a_0,#170a1f_55%,#0b0710_100%)] text-white";

  if (roomId !== null) {
    return (
      <div className={shell}>
        <MafiaRoom roomId={roomId} tx={tx} lang={lang} voiceOff={voiceOff} onToggleVoice={toggleVoice} onExit={() => { setRoomId(null); setList(null); }} />
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="mx-auto w-full max-w-[460px] px-4 pb-10 pt-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="rounded-full bg-white/10 px-3 py-1.5 text-sm">← {tx("back")}</Link>
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleVoice} className="rounded-full bg-white/10 px-3 py-1.5 text-sm" aria-label={voiceOff ? tx("voiceOff") : tx("voiceOn")} title={voiceOff ? tx("voiceOff") : tx("voiceOn")}>{voiceOff ? "🔇" : "🔊"}</button>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold tabular-nums">❤ {(list?.hearts ?? 0).toLocaleString("ru-RU")}</span>
          </div>
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-wider">{tx("title")}</h1>
        <p className="text-sm text-[#c9b8dd]">{tx("sub")}</p>
        {list ? <p className="mt-1 text-xs text-[#c9b8dd]">{tx("myStats")}: {list.stats.games} · {tx("wins")}: {list.stats.wins}</p> : null}

        <div className="mt-4">
          <div className="mb-1 text-xs text-[#c9b8dd]">{tx("tableType")}</div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setVoiceTable(false)} className={`rounded-xl px-3 py-2 text-sm font-bold ${!voiceTable ? "bg-[#e11d48]" : "bg-white/10"}`}>💬 {tx("textTable")}</button>
            <button type="button" onClick={() => setVoiceTable(true)} className={`rounded-xl px-3 py-2 text-sm font-bold ${voiceTable ? "bg-[#e11d48]" : "bg-white/10"}`}>🎤 {tx("voiceTable")}</button>
          </div>
          {voiceTable ? <p className="mt-1 text-[11px] text-[#c9b8dd]">{tx("voiceNote")}</p> : null}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {KIND_ORDER.map((kind) => (
            <button key={kind} type="button" disabled={busy} onClick={() => { void quick(kind); }} className="rounded-2xl border border-white/15 bg-white/10 p-3 text-left disabled:opacity-60">
              <div className="text-2xl">{KIND_ICON[kind]}</div>
              <div className="mt-1 text-sm font-bold">{tx(kind)}{voiceTable && kind !== "practice" ? " 🎤" : ""}</div>
              <div className="text-xs text-[#d8cbe8]">{KIND_FEE[kind] ? `${tx("entry")}: ${KIND_FEE[kind].toLocaleString("ru-RU")} ❤` : tx("free")}</div>
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => setPwOpen(!pwOpen)} className="flex-1 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 text-left text-sm font-bold">🔒 {tx("createPrivate")}</button>
          <button type="button" onClick={() => setShowRules(true)} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold">? {tx("rules")}</button>
        </div>
        {pwOpen ? (
          <div className="mt-2 flex gap-2">
            <input value={pw} onChange={(event) => setPw(event.target.value.slice(0, 20))} placeholder={tx("password")} className="min-w-0 flex-1 rounded-xl bg-white/15 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/50" />
            <button type="button" disabled={busy || !pw.trim()} onClick={() => { void create(); }} className="rounded-xl bg-[#e11d48] px-4 py-2.5 text-sm font-bold disabled:opacity-50">{tx("create")}</button>
          </div>
        ) : null}
        {note ? <p role="status" className="mt-3 rounded-xl bg-[#e11d48]/25 px-3 py-2 text-sm">{note}</p> : null}

        <h2 className="mb-2 mt-5 text-sm font-bold text-[#ffd86b]">{tx("openTables")}</h2>
        {list && list.rooms.length === 0 ? <p className="text-sm text-[#c9b8dd]">{tx("noTables")}</p> : null}
        <div className="space-y-2">
          {(list?.rooms ?? []).map((room) => (
            <div key={room.id} className="rounded-2xl border border-white/15 bg-white/10 p-3">
              <div className="flex items-center justify-between">
                <b className="text-[15px]">{KIND_ICON[room.kind] ?? "🎭"} {String(room.id).padStart(3, "0")} · {tx(room.kind)} {room.voice ? "🎤" : "💬"} {room.locked ? "🔒" : ""}</b>
                <span className="text-xs text-[#d8cbe8]">{room.players} / {room.max} {tx("players")}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-[#d8cbe8]">
                <span>{room.fee ? `${tx("entry")}: ${room.fee.toLocaleString("ru-RU")} ❤` : tx("free")}</span>
                <span>{room.start_in !== null ? `${tx("startIn")} ${room.start_in}s` : `${tx("lobbyHint")} ${room.min}`}</span>
              </div>
              {joinPw && joinPw.room === room.id ? (
                <div className="mt-2 flex gap-2">
                  <input value={joinPw.value} onChange={(event) => setJoinPw({ room: room.id, value: event.target.value.slice(0, 20) })} placeholder={tx("password")} className="min-w-0 flex-1 rounded-xl bg-white/15 px-3 py-2 text-sm text-white outline-none placeholder:text-white/50" />
                  <button type="button" disabled={busy} onClick={() => { void join(room.id, joinPw.value); }} className="rounded-xl bg-[#e11d48] px-4 py-2 text-sm font-bold">{tx("join")}</button>
                </div>
              ) : (
                <button type="button" disabled={busy} onClick={() => { if (room.locked) setJoinPw({ room: room.id, value: "" }); else void join(room.id, null); }} className="mt-2 block w-full rounded-xl bg-[linear-gradient(90deg,#e11d48,#be123c)] py-2 text-center text-sm font-bold disabled:opacity-60">{tx("join")}</button>
              )}
            </div>
          ))}
        </div>
      </div>
      {showRules ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={() => setShowRules(false)}>
          <div role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()} className="max-h-[80vh] w-full max-w-[420px] overflow-y-auto rounded-2xl bg-[#1d0f3a] p-5">
            <h2 className="mb-2 text-lg font-bold text-[#ffd86b]">{tx("rulesTitle")}</h2>
            <p className="text-sm leading-relaxed text-[#e6dcff]">{tx("rulesText")}</p>
            <button type="button" onClick={() => setShowRules(false)} className="mt-4 w-full rounded-full bg-[#8CC63F] py-2.5 font-bold">OK</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MafiaRoom({ roomId, tx, lang, voiceOff, onToggleVoice, onExit }: { roomId: number; tx: (key: string) => string; lang: "az" | "en"; voiceOff: boolean; onToggleVoice: () => void; onExit: () => void }) {
  const [state, setState] = useState<MafiaState | null>(null);
  const [chat, setChat] = useState<MafiaChat[]>([]);
  const [text, setText] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [, setClock] = useState(0);
  const [mineLocal, setMineLocal] = useState<{ phase: string; round: number; target: string | null } | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const offsetRef = useRef(0);
  const lastChat = useRef(0);
  const firstLoad = useRef(true);
  const exited = useRef(false);
  const chatEnd = useRef<HTMLDivElement | null>(null);

  // Poll the room state every 1.5 seconds; the server advances the game on each poll.
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const pull = async () => {
      const data = await mafiaState(roomId, lastChat.current);
      if (!alive) return;
      if (!data || data.gone || !data.room) {
        if (!exited.current) { exited.current = true; onExit(); }
        return;
      }
      offsetRef.current = data.now - Date.now();
      if (data.chat.length) {
        const maxId = data.chat[data.chat.length - 1].id;
        const speakFrom = firstLoad.current ? maxId : lastChat.current;
        // The voice host reads only fresh system lines (never the history that loads when the page opens).
        for (const row of data.chat) {
          if (row.id > speakFrom && row.code && SPOKEN.has(row.code)) narrate(row.code, row.body);
        }
        lastChat.current = maxId;
        setChat((prev) => {
          const seen = new Set(prev.map((item) => item.id));
          const merged = [...prev, ...data.chat.filter((item) => !seen.has(item.id))];
          return merged.slice(-150);
        });
      }
      firstLoad.current = false;
      setState(data);
      timer = setTimeout(() => { void pull(); }, 1500);
    };
    void pull();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [roomId, onExit]);

  useEffect(() => {
    const id = setInterval(() => setClock((value) => value + 1), 250);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { chatEnd.current?.scrollIntoView({ block: "end" }); }, [chat.length]);
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 3500);
    return () => clearTimeout(id);
  }, [flash]);

  const room = state?.room;
  const me = state?.me;
  const players = state?.players ?? [];
  const phase = room?.phase ?? "lobby";
  const meRole = me?.role ?? null;
  const alive = Boolean(me?.alive) && !me?.left;
  const left = room?.phase_end ? Math.max(0, Math.ceil((room.phase_end - (Date.now() + offsetRef.current)) / 1000)) : null;
  const nameOf = (id: string | null) => players.find((item) => item.id === id)?.name ?? "";

  // Live voice (only on voice tables): who may speak and who may be heard follows the game phase.
  const canSend = !room || room.status !== "playing" ? true : alive && (phase === "talk" || (phase === "night" && meRole === "mafia"));
  const hear = (id: string): boolean => {
    if (!room) return false;
    if (room.status !== "playing") return true;
    const other = players.find((item) => item.id === id);
    if (!other || other.left) return false;
    if (phase === "talk") return other.alive;
    if (phase === "night") return alive && meRole === "mafia" && other.role === "mafia";
    return false;
  };
  const voice = useMafiaVoice({ active: Boolean(room?.voice), roomKey: room?.voice_key ?? null, myId: me?.id ?? "", canSend, hear });
  useEffect(() => { if (voice.error) setFlash(tx("micDenied")); }, [voice.error, tx]);

  const myTarget = useMemo(() => {
    if (!state) return null;
    if (mineLocal && mineLocal.phase === state.room.phase && mineLocal.round === state.room.round) return mineLocal.target;
    return state.my_target;
  }, [state, mineLocal]);

  const voteCount = useMemo(() => {
    const count: Record<string, number> = {};
    for (const vote of state?.votes ?? []) if (vote.target) count[vote.target] = (count[vote.target] ?? 0) + 1;
    return count;
  }, [state]);

  const act = async (player: MafiaPlayer) => {
    if (!state || !room || !alive || !player.alive || player.left) return;
    let kind: "kill" | "check" | "save" | "vote" | null = null;
    if (room.phase === "vote") kind = "vote";
    else if (room.phase === "night") kind = meRole === "mafia" ? "kill" : meRole === "sheriff" ? "check" : meRole === "doctor" ? "save" : null;
    if (!kind) return;
    if (kind === "kill" && player.role === "mafia") return;
    if ((kind === "check" || kind === "vote") && player.me) return;
    if (kind === "check" && state.checks.some((item) => item.round === room.round)) return;
    if (kind === "save" && room.last_save === player.id) { setFlash(tx("repeatSave")); return; }
    const res = await mafiaAct(room.id, kind, player.id);
    if (res && res.ok) {
      setMineLocal({ phase: room.phase, round: room.round, target: player.id });
      if (kind === "check") setFlash(`${player.name}: ${res.mafia ? tx("checkedMafia") : tx("checkedClean")}`);
    } else if (res && res.error === "repeat") setFlash(tx("repeatSave"));
  };

  const send = async () => {
    const value = text.trim();
    if (!value || !room) return;
    setText("");
    await mafiaSay(room.id, value);
  };

  const leave = async () => {
    if (!room) return;
    exited.current = true;
    await mafiaLeave(room.id);
    onExit();
  };
  const tryLeave = () => {
    if (room && room.status === "playing" && alive && room.fee > 0) setConfirmLeave(true);
    else void leave();
  };

  const report = async (row: MafiaChat) => {
    if (!room || !row.from) return;
    const ok = await mafiaReport(room.id, row.from, row.body);
    if (ok) setFlash(tx("reported"));
  };

  if (!state || !room || !me) {
    return <div className="flex h-full items-center justify-center text-sm text-white/70">…</div>;
  }

  const ended = room.status === "finished";
  const phaseTitle = ended ? tx("end") : phase === "lobby" ? tx("lobby") : phase === "night" ? `🌙 ${tx("night")}` : phase === "talk" ? `☀ ${tx("talk")}` : `🗳 ${tx("vote")}`;
  const hint = (() => {
    if (ended) return room.winner === "mafia" ? tx("winMafia") : tx("winCivil");
    if (phase === "lobby") return `${tx("lobbyHint")} ${room.min}`;
    if (!alive) return tx("h_dead");
    if (phase === "night") return tx(`h_${meRole ?? "civil"}_night`);
    if (phase === "talk") return tx("h_talk");
    return tx("h_vote");
  })();
  const night = phase === "night";
  const myTeamWon = ended && room.winner !== null && team(meRole) === room.winner && !me.left;
  const winnersCount = players.filter((item) => !item.bot && !item.left && team(item.role) === room.winner).length;
  const share = ended && room.pot > 0 && winnersCount > 0 ? Math.floor((room.pot * 0.9) / winnersCount) : 0;
  const canWrite = ended || (room.status === "waiting" && !me.left) || (room.status === "playing" && alive && (night ? meRole === "mafia" : true));
  const chatPlaceholder = canWrite ? (night && meRole === "mafia" ? tx("mafiaChat") : tx("chatPlaceholder")) : night ? tx("chatNight") : tx("chatDead");

  // Players sit on a circle.
  const ring = players.filter((item) => !(room.status === "waiting" && item.left));
  const R = ring.length > 8 ? 128 : 122;
  const targetable = (player: MafiaPlayer) => {
    if (!alive || ended || !player.alive || player.left) return false;
    if (phase === "vote") return !player.me;
    if (!night) return false;
    if (meRole === "mafia") return player.role !== "mafia";
    if (meRole === "sheriff") return !player.me && !state.checks.some((item) => item.round === room.round);
    if (meRole === "doctor") return true;
    return false;
  };

  return (
    <div className={`mx-auto flex min-h-full w-full max-w-[460px] flex-col px-3 pb-3 pt-2 ${night ? "bg-[radial-gradient(90%_60%_at_50%_38%,#1c2a5a_0,#0a0f26_55%,#04060f_100%)]" : phase === "talk" || phase === "vote" ? "bg-[radial-gradient(100%_60%_at_50%_0,#f59e0b33_0,transparent_60%)]" : ""}`}>
      <div className="flex items-center justify-between">
        <button type="button" onClick={tryLeave} className="rounded-full bg-white/10 px-3 py-1.5 text-sm">← {tx("leave")}</button>
        <span className="text-sm font-bold">{String(room.id).padStart(3, "0")} · {tx(room.kind)} {room.voice ? "🎤" : "💬"}</span>
        {room.voice ? <button type="button" onClick={() => { void voice.toggle(); }} disabled={!voice.supported} className={`rounded-full px-3 py-1.5 text-sm font-bold ${voice.micOn ? "bg-[#22c55e]" : "bg-white/10"}`} aria-label={voice.micOn ? tx("micOn") : tx("micOff")} title={voice.supported ? (voice.micOn ? tx("micOn") : tx("micOff")) : tx("voiceNo")}>{voice.micOn ? "🎤 ON" : "🎤 OFF"}</button> : null}
        <button type="button" onClick={onToggleVoice} className="rounded-full bg-white/10 px-3 py-1.5 text-sm" aria-label={voiceOff ? tx("voiceOff") : tx("voiceOn")} title={voiceOff ? tx("voiceOff") : tx("voiceOn")}>{voiceOff ? "🔇" : "🔊"}</button>
      </div>

      <div className="mt-2 text-center">
        <b className="text-xl tracking-widest">{phaseTitle}</b>
        <p className="mt-0.5 text-xs text-[#c9d2ff]">{hint}</p>
        {room.voice && voice.micOn && !canSend ? <p className="mt-0.5 text-[11px] text-[#fde68a]">{tx("micMuted")}</p> : null}
        {left !== null && !ended ? (
          <span className="mt-1.5 inline-block rounded-2xl bg-white/10 px-4 py-1 text-lg font-bold tabular-nums">{phase === "lobby" ? `${tx("startIn")} ` : ""}{fmtSecs(left)}</span>
        ) : phase === "lobby" ? <p className="mt-1 text-xs text-[#d8cbe8]">{tx("waitMore")}</p> : null}
        {phase === "lobby" ? <p className="mt-1 text-xs text-[#d8cbe8]">{players.length} / {room.max} {tx("players")}{room.fee ? ` · ${tx("entry")}: ${room.fee} ❤` : ""}</p> : null}
      </div>

      {flash ? <p role="status" className="mx-auto mt-2 rounded-xl bg-[#ffd86b] px-3 py-1.5 text-center text-sm font-bold text-[#3b1d6e]">{flash}</p> : null}

      {phase === "lobby" ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {ring.map((player) => (
            <div key={player.id} className="flex items-center gap-2 rounded-xl bg-white/10 p-2">
              <Face player={player} size={36} />
              <span className="min-w-0 flex-1 truncate text-sm">{player.name}{player.me ? ` (${tx("youTag")})` : ""}</span>
              {voice.speaking.includes(player.id) ? <span aria-hidden>🎤</span> : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="relative mx-auto mt-2 h-[320px] w-[320px] shrink-0">
          {ring.map((player, index) => {
            const angle = (2 * Math.PI * index) / Math.max(ring.length, 1) - Math.PI / 2;
            const x = 160 + R * Math.cos(angle) - 31;
            const y = 160 + R * Math.sin(angle) - 36;
            const can = targetable(player);
            const picked = myTarget === player.id;
            const check = state.checks.find((item) => item.target === player.id);
            const isMafiaMate = meRole === "mafia" && player.role === "mafia" && !player.me;
            const shownRole = (ended || !player.alive || player.me || isMafiaMate) && player.role ? player.role : null;
            const killPick = night && meRole === "mafia" ? state.kills.filter((item) => item.target === player.id).length : 0;
            return (
              <button key={player.id} type="button" disabled={!can} onClick={() => { void act(player); }} style={{ left: x, top: y }} className={`absolute w-[62px] text-center text-[10px] ${can ? "" : "cursor-default"} ${!player.alive ? "opacity-50 grayscale" : ""}`}>
                <span className={`relative mx-auto flex h-[52px] w-[52px] items-center justify-center rounded-full border-[3px] ${picked ? "border-[#ef4444] shadow-[0_0_16px_#ef4444aa]" : voice.speaking.includes(player.id) ? "border-[#22c55e] shadow-[0_0_14px_#22c55e]" : can ? "border-white/70" : "border-white/25"}`}>
                  <Face player={player} size={46} />
                  {!player.alive ? <span className="absolute text-3xl text-[#ef4444]">✖</span> : null}
                  {shownRole ? <span className="absolute -bottom-1 -right-1 text-sm">{ROLE_ICON[shownRole]}</span> : null}
                  {check ? <span className={`absolute -left-2 -top-2 rounded-full px-1 text-[9px] font-bold ${check.mafia ? "bg-[#ef4444]" : "bg-[#22c55e]"}`}>{check.mafia ? "!" : "✓"}</span> : null}
                  {killPick ? <span className="absolute -right-1 -top-2 rounded-full bg-[#ef4444] px-1 text-[9px] font-bold">{killPick}</span> : null}
                  {phase === "vote" && voteCount[player.id] ? <span className="absolute -right-1 -top-2 rounded-full bg-[#f59e0b] px-1.5 text-[10px] font-bold">{voteCount[player.id]}</span> : null}
                </span>
                <span className="mt-0.5 block truncate">{player.name}</span>
              </button>
            );
          })}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {meRole ? (
              <div className="rounded-2xl border border-[#d4af37]/60 bg-black/40 px-3 py-2 text-center">
                <div className="text-2xl">{ROLE_ICON[meRole]}</div>
                <div className="text-[11px] text-[#ffd3de]">{tx("role")}</div>
                <b className="text-sm">{tx(`r_${meRole}`)}</b>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {phase === "vote" && alive ? (
        <div className="mt-1 flex justify-center">
          <button type="button" onClick={() => { void mafiaAct(room.id, "vote", null).then(() => setMineLocal({ phase: room.phase, round: room.round, target: null })); }} className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold">{myTarget === null ? "✓ " : ""}{lang === "az" ? "Səs vermirəm" : "Abstain"}</button>
        </div>
      ) : null}

      {ended ? (
        <div className="mt-3 rounded-2xl bg-[linear-gradient(#fff,#fff6d6)] p-4 text-center text-[#3b1d6e]">
          <div className="text-4xl">{myTeamWon ? "🏆" : "🎭"}</div>
          <b className="block text-lg">{room.winner === "mafia" ? tx("winMafia") : tx("winCivil")}</b>
          {myTeamWon ? <b className="mt-1 block text-sm text-[#e11d48]">{tx("youWon")}</b> : <span className="mt-1 block text-sm">{tx("youLost")}</span>}
          {share > 0 && myTeamWon ? <b className="mt-1 block text-2xl text-[#e11d48]">+{share.toLocaleString("ru-RU")} ❤</b> : null}
          <div className="mt-2 flex flex-wrap justify-center gap-1.5 text-xs">
            {players.map((player) => <span key={player.id} className="rounded-full bg-[#3b1d6e]/10 px-2 py-1">{player.role ? ROLE_ICON[player.role] : ""} {player.name}</span>)}
          </div>
          <button type="button" onClick={() => { void leave(); }} className="mt-3 w-full rounded-full bg-[#8CC63F] py-2.5 font-bold text-white">{tx("again")}</button>
        </div>
      ) : null}

      <div className="mt-3 flex min-h-[150px] flex-1 flex-col rounded-2xl bg-black/35 p-2">
        <div className="max-h-[220px] min-h-[110px] flex-1 space-y-1 overflow-y-auto text-[13px] leading-[18px]">
          {chat.map((row) => (
            <div key={row.id} className={row.from ? "" : "text-center text-[#fde68a]"}>
              {row.from ? (
                <span className={row.channel === "mafia" ? "text-[#fca5a5]" : ""}>
                  <b className="text-[#fda4af]">{row.name ?? nameOf(row.from)}{row.channel === "mafia" ? " 🕴️" : ""}:</b> {row.body}{" "}
                  {row.from !== me.id ? <button type="button" onClick={() => { void report(row); }} className="text-[10px] text-white/40" aria-label={tx("report")} title={tx("report")}>⚑</button> : null}
                </span>
              ) : row.body}
            </div>
          ))}
          <div ref={chatEnd} />
        </div>
        <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="mt-2 flex gap-2">
          <input value={text} onChange={(event) => setText(event.target.value.slice(0, 200))} disabled={!canWrite} placeholder={chatPlaceholder} className="min-w-0 flex-1 rounded-full bg-white/15 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/50 disabled:opacity-60" />
          <button type="submit" disabled={!canWrite || !text.trim()} aria-label={tx("send")} className="h-10 w-10 rounded-full bg-[#e11d48] text-lg disabled:opacity-50">➤</button>
        </form>
      </div>

      {confirmLeave ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-[360px] rounded-2xl bg-[#1d0f3a] p-5 text-center">
            <p className="text-sm">{tx("leaveConfirm")}</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setConfirmLeave(false)} className="flex-1 rounded-full bg-white/15 py-2.5 font-bold">{lang === "az" ? "Qal" : "Stay"}</button>
              <button type="button" onClick={() => { setConfirmLeave(false); void leave(); }} className="flex-1 rounded-full bg-[#e11d48] py-2.5 font-bold">{tx("leave")}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Face({ player, size }: { player: MafiaPlayer; size: number }) {
  if (player.avatar) {
    return <span className="block shrink-0 rounded-full bg-cover bg-center" style={{ width: size, height: size, backgroundImage: `url(${player.avatar})` }} />;
  }
  return <span className="flex shrink-0 items-center justify-center rounded-full bg-[#4b3a7a]" style={{ width: size, height: size, fontSize: size * 0.55 }}>{FACES[(player.seat - 1 + FACES.length) % FACES.length]}</span>;
}
