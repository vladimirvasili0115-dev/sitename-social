"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { supabase } from "@/lib/supabase";
import {
  dominoCreate, dominoDraw, dominoInvite, dominoInviteAnswer, dominoInvites, dominoJoin, dominoLeave, dominoMyTable, dominoPairsTop,
  dominoPass, dominoPlay, dominoProfile, dominoRooms, dominoSettings, dominoStart, dominoSync, dominoTop, findUserByHandle, tileHi, tileLo,
  type DGame, type DInvite, type DMode, type DPairRow, type DProfile, type DRoom, type DSeat, type DSide, type DSync, type DTopRow,
} from "@/lib/dominoSync";
import { DominoBoard, lastPieceKey, useAnchor } from "./DominoBoard";
import { DominoDefs, DominoTile } from "./DominoTile";

type Dict = Record<string, string>;
const TX: Record<"az" | "en", Dict> = {
  az: {
    back: "Geri", tables: "Masalar", rating: "Reytinq", medals: "Medallarım", rules: "Qaydalar",
    create: "Masa yarat", mode: "Rejim", target: "Hədəf", teams: "4 nəfərdə 2x2 komanda", noTeams: "komandasız", start: "Başlat", join: "Otur",
    noTables: "Hələ açıq masa yoxdur. Öz masanı yarat.", playing: "oyun gedir", waiting: "gözləyir", players: "nəfər",
    quick: "TEZ OYUNA BAŞLA", atTables: "nəfər masada", liveTables: "CANLI MASALAR", d101: "Klassik Azərbaycan dominosu", d365: "Uclar 5-ə bölünsə xal",
    invites: "Dəvətlər", invitedYou: "səni masaya çağırır", accept: "Qəbul et", decline: "Rədd et",
    week: "Həftə", month: "Ay", all: "Ümumi", pairs: "Cütlər", games: "oyun", wins: "qələbə", points: "xal", empty: "Hələ heç kim yoxdur.",
    leave: "Çıx", leaveConfirm: "Oyun gedir. Çıxsan, komandan məğlub sayılacaq. Çıxırsan?", sitHere: "Bura otur", emptySeat: "Boş yer",
    waitOwner: "Masa sahibi oyunu başladacaq.", needTwo: "Başlamaq üçün ən az 2 nəfər lazımdır.", owner: "sahib", you: "Sən",
    invite: "Dəvət et", invitePh: "@istifadəçi adı", invited: "Dəvət göndərildi.", noUser: "Belə istifadəçi tapılmadı.",
    scores: "XALLAR", teamA: "Komanda A", teamB: "Komanda B", rule35: "35 xal birdəfəyə yazan komanda dərhal qalib olur",
    draw: "Çək", drawEmpty: "Çək (bazar yoxdur)", pass: "Pas", stock: "Bazar", yourTurn: "Sənin növbən", sec: "san",
    roundOver: "Raund bitdi", blocked: "Blok", won: "qazandı", nextRound: "Növbəti raund başlayır…", hands: "Əllərdə qalan",
    matchOver: "OYUN BİTDİ", winner: "Qalib", again: "Yenidən başlat", left: "oyunu tərk etdi", somePlayer: "Bir oyunçu", instant: "Birdəfəyə 35 xal!",
    signIn: "Oynamaq üçün hesaba daxil ol.", demo: "Önizləmə (demo)", demoNote: "Bu önizləmədir: oyun serverə bağlı deyil.", tapTile: "Daşa toxun, sonra işıqlanan yerə qoy.",
    round: "Raund", failed: "Alınmadı, yenidən cəhd et.",
    e_not_your_turn: "Növbə səndə deyil.", e_illegal: "Bu daş ora qoyulmur.", e_has_move: "Gedişin var, bazardan çəkmək olmaz.", e_must_draw: "Əvvəl bazardan çək.",
    e_playing: "Bu masada oyun gedir.", e_full: "Masa doludur.", e_seat_taken: "Bu yer tutulub.", e_not_owner: "Bunu yalnız masa sahibi edə bilər.",
    e_players_2_4: "2-4 nəfər lazımdır.", e_too_many: "Çox dəvət göndərdin, bir az gözlə.", e_not_signed_in: "Hesaba daxil ol.",
    rulesText: "101: başlayan 1-1 olan oyunçudur (yoxdursa 2-2…6-6). Əli ilk boşalan raundu qazanır, rəqiblərin əlindəki xallar ona yazılır. Blokda əlində az qalan qazanır (xal = fərq). 101-ə ilk çatan qalibdir. Bazardan 2-2 çəkilir.\n\nTelefon 365: başlayan 3-2 daşı olan oyunçudur. İlk qoşa spinner olur və 4 tərəfə açılır. Hər hamlədən sonra uclar cəmi 5-ə bölünürsə, o qədər xal yazılır. Birdəfəyə 35 xal yazan dərhal qalibdir. Raund sonunda rəqiblərin əlindəki xal (5-ə yuvarlaq) yalnız 300-dən az xalı olan komandaya yazılır. Bazardan 1-1 çəkilir.\n\n4 nəfərdə qarşı-qarşıya oturanlar komandadır. Növbə 30 saniyədir, vaxt bitəndə hamləni server edir.",
    m_win1: "İlk qələbə", m_win10: "Usta (bürünc)", m_win50: "Usta (gümüş)", m_win100: "Usta (qızıl)", m_win500: "Usta (brilyant)", m_phone35: "Telefon 35",
    m_clean: "Quru qələbə", m_streak5: "Seriya 5", m_pair10: "Komanda ruhu", m_week1: "Həftənin 1-ci", m_week2: "Həftənin 2-ci", m_week3: "Həftənin 3-cü",
    noMedals: "Hələ medal yoxdur. Oyna və qazan!", myStats: "Göstəricilərim", streak: "seriya",
  },
  en: {
    back: "Back", tables: "Tables", rating: "Rating", medals: "My medals", rules: "Rules",
    create: "Create table", mode: "Mode", target: "Target", teams: "2x2 teams with 4 players", noTeams: "no teams", start: "Start", join: "Sit",
    noTables: "No open tables yet. Create your own.", playing: "playing", waiting: "waiting", players: "players",
    quick: "QUICK PLAY", atTables: "at tables", liveTables: "LIVE TABLES", d101: "Classic Azerbaijani domino", d365: "Score when the ends add up to 5s",
    invites: "Invites", invitedYou: "invites you to a table", accept: "Accept", decline: "Decline",
    week: "Week", month: "Month", all: "All time", pairs: "Pairs", games: "games", wins: "wins", points: "pts", empty: "Nobody yet.",
    leave: "Leave", leaveConfirm: "A game is on. If you leave, your team loses. Leave?", sitHere: "Sit here", emptySeat: "Empty seat",
    waitOwner: "The table owner will start the game.", needTwo: "At least 2 players are needed.", owner: "owner", you: "You",
    invite: "Invite", invitePh: "@username", invited: "Invite sent.", noUser: "User not found.",
    scores: "SCORES", teamA: "Team A", teamB: "Team B", rule35: "A team scoring 35 at once wins at once",
    draw: "Draw", drawEmpty: "Draw (stock empty)", pass: "Pass", stock: "Stock", yourTurn: "Your turn", sec: "s",
    roundOver: "Round over", blocked: "Blocked", won: "won", nextRound: "Next round is starting…", hands: "Left in hands",
    matchOver: "GAME OVER", winner: "Winner", again: "Start again", left: "left the game", somePlayer: "A player", instant: "35 points at once!",
    signIn: "Sign in to play.", demo: "Preview (demo)", demoNote: "This is a preview: not connected to the server.", tapTile: "Tap a tile, then the glowing spot.",
    round: "Round", failed: "Failed, try again.",
    e_not_your_turn: "It is not your turn.", e_illegal: "That tile does not go there.", e_has_move: "You have a move, you cannot draw.", e_must_draw: "Draw from the stock first.",
    e_playing: "A game is on at this table.", e_full: "The table is full.", e_seat_taken: "That seat is taken.", e_not_owner: "Only the table owner can do that.",
    e_players_2_4: "2-4 players are needed.", e_too_many: "Too many invites, wait a little.", e_not_signed_in: "Sign in first.",
    rulesText: "101: the player with 1-1 starts (else 2-2…6-6). First to empty the hand wins the round and scores the opponents' pips. In a block the lower hand wins (score = difference). First to 101 wins. Draw 2 at a time.\n\nPhone 365: the player with 3-2 starts. The first double is the spinner and opens 4 ways. After each move, if the open ends add up to a multiple of 5, that many points are scored. 35 at once wins at once. At round end the opponents' pips (rounded to 5) are scored only by a team under 300. Draw 1 at a time.\n\nWith 4 players, partners sit opposite. A turn is 30 seconds; when time runs out the server moves.",
    m_win1: "First win", m_win10: "Master (bronze)", m_win50: "Master (silver)", m_win100: "Master (gold)", m_win500: "Master (diamond)", m_phone35: "Phone 35",
    m_clean: "Clean win", m_streak5: "Streak 5", m_pair10: "Team spirit", m_week1: "Week #1", m_week2: "Week #2", m_week3: "Week #3",
    noMedals: "No medals yet. Play and win!", myStats: "My stats", streak: "streak",
  },
};
const MEDAL_ICON: Record<string, string> = {
  win1: "🥇", win10: "🥉", win50: "🥈", win100: "🏆", win500: "💎", phone35: "📞", clean: "🧼", streak5: "🔥", pair10: "🤝", week1: "👑", week2: "🥈", week3: "🥉",
};
const TARGETS: Record<DMode, number[]> = { "101": [101], "365": [365, 355, 255] };
const shell = "fixed inset-0 z-[60] overflow-hidden bg-[radial-gradient(120%_80%_at_50%_30%,#2a1458_0,#110726_55%,#05030c_100%)] text-white";
const gold = "bg-[linear-gradient(#ffe08a,#c8973a)] text-[#2a1500]";

function useTx() {
  const { locale } = useTranslation();
  const lang: "az" | "en" = locale === "az" ? "az" : "en";
  return useCallback((key: string) => TX[lang][key] ?? TX.az[key] ?? key, [lang]);
}

function errText(tx: (k: string) => string, err: string | null) {
  if (!err) return null;
  const code = Object.keys(TX.az).find((k) => k.startsWith("e_") && err.includes(k.slice(2)));
  return code ? tx(code) : tx("failed");
}

function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className="select-none leading-none">
      <div className={`${small ? "text-xl" : "text-[34px]"} bg-[linear-gradient(#fff2b0,#c8973a_60%,#7a4a14)] bg-clip-text font-black tracking-[3px] text-transparent drop-shadow-[0_2px_0_#000]`}>DOMINO</div>
      <div className={`${small ? "text-[8px] tracking-[4px]" : "text-[11px] tracking-[5px]"} mt-0.5 text-[#c8973a]`}>RAVETILL</div>
    </div>
  );
}

function Avatar({ name, src, turn = false, blue = false, size = 42 }: { name: string; src?: string | null; turn?: boolean; blue?: boolean; size?: number }) {
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full border-2 font-extrabold ${blue ? "border-[#9cc4ff] bg-[linear-gradient(135deg,#3a7bd5,#1b3a73)]" : "border-[#ffd77a] bg-[linear-gradient(135deg,#c8973a,#7a4a14)]"} ${turn ? "shadow-[0_0_0_3px_#ffd77a,0_0_24px_#ffd77a99]" : ""}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : (name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

// ───────────────────────── Page ─────────────────────────

export function DominoGame() {
  const tx = useTx();
  const [tableId, setTableId] = useState<number | null>(null);
  const [demo, setDemo] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get("demo");
    if (d === "1" || d === "101" || d === "365" || d === "solo") { setDemo(d); setChecked(true); return; }
    if (!supabase) { setChecked(true); return; }
    dominoMyTable().then((r) => { if (r.data) setTableId(r.data); setChecked(true); });
  }, []);

  if (!checked) return <div className={shell}><DominoDefs /></div>;
  if (demo) return <div className={shell}><DominoDefs /><DemoTable key={demo} variant={demo} onExit={() => setDemo(null)} tx={tx} /></div>;
  if (tableId !== null) return <div className={shell}><DominoDefs /><DominoTable tableId={tableId} tx={tx} onExit={() => setTableId(null)} /></div>;
  return <div className={`${shell} overflow-y-auto`}><DominoDefs /><Lobby tx={tx} onOpen={setTableId} onDemo={() => setDemo("1")} /></div>;
}

// ───────────────────────── Lobby ─────────────────────────

const sampleSeat = (seat: number, name: string): DSeat => ({ seat, user_id: `s${seat}${name}`, name, avatar: null });
const SAMPLE_ROOMS: DRoom[] = [
  { id: 1, owner: null, mode: "365", target: 365, teams: true, status: "waiting", seats: [sampleSeat(0, "Elnur"), sampleSeat(1, "Aysel"), sampleSeat(2, "Rauf")] },
  { id: 2, owner: null, mode: "101", target: 101, teams: true, status: "waiting", seats: [sampleSeat(1, "Nigar"), sampleSeat(2, "Kamran")] },
  { id: 3, owner: null, mode: "365", target: 255, teams: false, status: "playing", seats: [sampleSeat(0, "Orxan"), sampleSeat(1, "Leyla"), sampleSeat(2, "Murad"), sampleSeat(3, "Səbinə")] },
];

function Lobby({ tx, onOpen, onDemo }: { tx: (k: string) => string; onOpen: (id: number) => void; onDemo: () => void }) {
  const [tab, setTab] = useState<"tables" | "rating" | "medals" | "rules">("tables");
  const online = !!supabase;
  // Without a server (local preview only) a few sample tables are shown so the screen can be judged.
  const [rooms, setRooms] = useState<DRoom[]>(() => (online ? [] : SAMPLE_ROOMS));
  const [invites, setInvites] = useState<DInvite[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [mode, setMode] = useState<DMode>("101");
  const [target, setTarget] = useState(101);
  const [teams, setTeams] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!online) return;
    let alive = true;
    const load = async () => {
      const [r, i] = await Promise.all([dominoRooms(), dominoInvites()]);
      if (!alive) return;
      if (r.data) setRooms(r.data);
      if (i.data) setInvites(i.data);
      if (r.error && r.error.includes("not_signed_in")) setNote(tx("signIn"));
    };
    load();
    const id = setInterval(load, 4000);
    return () => { alive = false; clearInterval(id); };
  }, [online, tx]);

  const create = async () => {
    setBusy(true);
    const r = await dominoCreate(mode, target, teams);
    setBusy(false);
    if (r.data) onOpen(r.data); else setNote(errText(tx, r.error));
  };
  const join = async (id: number) => {
    setBusy(true);
    const r = await dominoJoin(id, null);
    setBusy(false);
    if (r.data) onOpen(r.data); else setNote(errText(tx, r.error));
  };
  const answer = async (inv: DInvite, ok: boolean) => {
    const r = await dominoInviteAnswer(inv.id, ok);
    setInvites((list) => list.filter((x) => x.id !== inv.id));
    if (ok && r.data) onOpen(r.data); else if (r.error) setNote(errText(tx, r.error));
  };

  // "Quick play": the fullest waiting table with a free seat, otherwise a new 101 table.
  const quick = async () => {
    const free = rooms
      .filter((r) => r.status === "waiting" && (r.seats?.length ?? 0) < 4)
      .sort((a, b) => (b.seats?.length ?? 0) - (a.seats?.length ?? 0))[0];
    if (free) { await join(free.id); return; }
    setBusy(true);
    const r = await dominoCreate("101", 101, true);
    setBusy(false);
    if (r.data) onOpen(r.data); else setNote(errText(tx, r.error));
  };
  const [sheet, setSheet] = useState(false);
  const openMode = (m: DMode) => { setMode(m); setTarget(TARGETS[m][0]); setSheet(true); };
  const seated = rooms.reduce((sum, r) => sum + (r.seats?.length ?? 0), 0);

  const TABS: { key: typeof tab; icon: string }[] = [
    { key: "tables", icon: "🁫" }, { key: "rating", icon: "🏆" }, { key: "medals", icon: "🏅" }, { key: "rules", icon: "📖" },
  ];

  return (
    <div className="mx-auto min-h-full w-full max-w-[480px] bg-[#07051a] pb-[calc(env(safe-area-inset-bottom)+76px)]">
      {/* hero: the neon table */}
      <div className="relative h-[300px] overflow-hidden bg-[url(/domino/table.jpg)] bg-cover bg-center">
        <div className="absolute inset-0 bg-[linear-gradient(#07051a00_30%,#07051a)]" />
        <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between">
          <Link href="/games" className="rounded-full bg-black/60 px-3 py-1.5 text-xs">← {tx("back")}</Link>
          <span className="rounded-full border border-[#7dffa655] bg-black/60 px-2.5 py-1 text-[11px] text-[#7dffa6]">● {seated} {tx("atTables")}</span>
        </div>
        <div className="absolute inset-x-0 top-[58px] z-10 flex justify-center"><Logo /></div>
        <button type="button" onClick={quick} disabled={busy || !online}
          className={`absolute inset-x-5 top-[200px] z-10 flex h-[58px] items-center justify-center gap-2 rounded-[18px] text-[19px] font-black shadow-[0_0_30px_#ffd77a88] disabled:opacity-60 ${gold}`}>
          ⚡ {tx("quick")}
        </button>
      </div>

      {!online ? <p className="mx-4 mt-2 rounded-xl bg-white/10 p-3 text-center text-sm">{tx("signIn")} <button type="button" onClick={onDemo} className="ml-1 text-[#ffd77a] underline">{tx("demo")}</button></p> : null}
      {note ? <p className="mx-4 mt-2 rounded-xl bg-red-500/20 p-2.5 text-center text-sm" onClick={() => setNote(null)}>{note}</p> : null}

      {invites.length ? (
        <div className="mx-4 mt-3 space-y-2">
          {invites.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 rounded-2xl border border-[#ff4d6d66] bg-[linear-gradient(90deg,#ff4d6d33,#ffd77a22)] p-2.5">
              <Avatar name={inv.name ?? "?"} src={inv.avatar} size={34} />
              <div className="min-w-0 flex-1 text-xs"><b className="text-sm">{inv.name}</b> {tx("invitedYou")}<div className="text-white/60">{inv.mode === "365" ? `Telefon 365 · ${inv.target}` : "101"}</div></div>
              <button type="button" onClick={() => answer(inv, true)} className={`rounded-xl px-3 py-1.5 text-xs font-bold ${gold}`}>{tx("accept")}</button>
              <button type="button" onClick={() => answer(inv, false)} className="rounded-xl bg-white/10 px-2.5 py-1.5 text-xs">✕</button>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "tables" ? (
        <>
          <div className="relative z-10 -mt-1.5 flex gap-3 px-4">
            {(["101", "365"] as DMode[]).map((m) => (
              <button key={m} type="button" onClick={() => openMode(m)}
                className={`flex-1 rounded-[18px] border p-3 text-left ${m === "101"
                  ? "border-[#5b7cff88] bg-[linear-gradient(160deg,#1c2a8a,#100b3a)] shadow-[0_0_18px_#4b5bff44]"
                  : "border-[#c06bff88] bg-[linear-gradient(160deg,#5b1c8a,#1a0b3a)] shadow-[0_0_18px_#a04bff44]"}`}>
                <DominoTile a={m === "101" ? 1 : 3} b={m === "101" ? 1 : 2} className="h-[44px] w-[22px]" />
                <div className="mt-1.5 text-[17px] font-extrabold">{m === "101" ? "101" : "Telefon 365"}</div>
                <div className="mt-0.5 text-[11px] text-white/65">{tx(m === "101" ? "d101" : "d365")}</div>
              </button>
            ))}
          </div>
          <h4 className="mx-4 mb-2 mt-5 text-[13px] font-bold tracking-[1px] text-[#ffd77a]">{tx("liveTables")}</h4>
          <div className="space-y-2 px-4">
            {rooms.length ? rooms.map((r) => {
              const seats = r.seats ?? [];
              const full = seats.length >= 4;
              return (
                <div key={r.id} className="flex items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-2.5">
                  <div className="min-w-0 flex-1 text-xs text-white/65">
                    <b className="block text-sm text-white">{r.mode === "365" ? "Telefon 365" : "101"}{r.teams ? " · 2×2" : ""}</b>
                    {r.mode === "365" ? `${tx("target")} ${r.target} · ` : ""}{seats.length}/4 · {r.status === "playing" ? tx("playing") : tx("waiting")}
                  </div>
                  <div className="flex pl-1.5">
                    {[0, 1, 2, 3].map((i) => {
                      const s = seats.find((x) => x.seat === i);
                      return s
                        ? <span key={i} className="-ml-1.5"><Avatar name={s.name ?? "?"} src={s.avatar} size={24} blue={r.teams && i % 2 === 1} /></span>
                        : <span key={i} className="-ml-1.5 grid h-6 w-6 place-items-center rounded-full border-2 border-dashed border-white/25 bg-white/5 text-[10px] text-white/40">+</span>;
                    })}
                  </div>
                  <button type="button" disabled={busy || r.status === "playing" || full} onClick={() => join(r.id)}
                    className={`rounded-[14px] px-3.5 py-2 text-xs font-extrabold disabled:opacity-40 ${gold}`}>{tx("join")}</button>
                </div>
              );
            }) : <p className="rounded-2xl bg-white/[0.04] p-4 text-center text-sm text-white/60">{tx("noTables")}</p>}
          </div>
        </>
      ) : null}
      {tab !== "tables" ? (
        <div className="px-4 pt-3">
          {tab === "rating" ? <Rating tx={tx} /> : null}
          {tab === "medals" ? <Medals tx={tx} /> : null}
          {tab === "rules" ? <p className="mt-2 whitespace-pre-line rounded-2xl bg-white/[0.07] p-4 text-sm leading-6 text-white/85">{tx("rulesText")}</p> : null}
        </div>
      ) : null}

      {/* bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex h-[calc(env(safe-area-inset-bottom)+62px)] max-w-[480px] items-start justify-around border-t border-white/[0.08] bg-[#0b0920ee] pt-2 backdrop-blur">
        {TABS.map(({ key, icon }) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={`flex flex-col items-center gap-0.5 text-[10px] ${tab === key ? "text-[#ffd77a]" : "text-white/55"}`}>
            <span className="text-lg leading-none">{icon}</span>{tx(key)}
          </button>
        ))}
      </nav>

      {/* create-table sheet (opens from a mode card) */}
      {sheet ? (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60" onClick={() => setSheet(false)}>
          <div className="w-full max-w-[480px] rounded-t-3xl border-t border-[#c8973a88] bg-[#110b2a] p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <div className="text-lg font-extrabold">{tx("create")} · {mode === "101" ? "101" : "Telefon 365"}</div>
            {mode === "365" ? (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-white/70">{tx("target")}:</span>
                {TARGETS["365"].map((v) => (
                  <button key={v} type="button" onClick={() => setTarget(v)} className={`rounded-full px-3 py-1 ${target === v ? gold : "bg-white/10"}`}>{v}</button>
                ))}
              </div>
            ) : null}
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={teams} onChange={(e) => setTeams(e.target.checked)} className="h-4 w-4 accent-[#c8973a]" />
              {tx("teams")}
            </label>
            <button type="button" disabled={busy || !online} onClick={() => { setSheet(false); create(); }}
              className={`mt-4 h-12 w-full rounded-2xl text-base font-extrabold disabled:opacity-50 ${gold}`}>{tx("create")}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Rating({ tx }: { tx: (k: string) => string }) {
  const [kind, setKind] = useState<"week" | "month" | "all" | "pairs">("week");
  const [rows, setRows] = useState<DTopRow[]>([]);
  const [pairs, setPairs] = useState<DPairRow[]>([]);
  useEffect(() => {
    if (kind === "pairs") dominoPairsTop().then((r) => setPairs(r.data ?? []));
    else dominoTop(kind).then((r) => setRows(r.data ?? []));
  }, [kind]);
  return (
    <div className="mt-4">
      <div className="flex gap-2">
        {(["week", "month", "all", "pairs"] as const).map((k) => (
          <button key={k} type="button" onClick={() => setKind(k)} className={`rounded-full px-3 py-1 text-xs font-semibold ${kind === k ? gold : "bg-white/10"}`}>{tx(k)}</button>
        ))}
      </div>
      <ol className="mt-3 space-y-1.5">
        {kind === "pairs"
          ? (pairs.length ? pairs.map((p, i) => (
            <li key={`${p.u1}-${p.u2}`} className="flex items-center gap-2 rounded-xl bg-white/[0.07] p-2 text-sm">
              <span className="w-6 text-center font-bold text-[#ffd77a]">{i + 1}</span>
              <div className="flex -space-x-2"><Avatar name={p.name1 ?? "?"} src={p.avatar1} size={28} /><Avatar name={p.name2 ?? "?"} src={p.avatar2} size={28} blue /></div>
              <span className="min-w-0 flex-1 truncate">{p.name1} + {p.name2}</span>
              <span className="text-xs text-white/70">{p.wins} {tx("wins")} · {p.games} {tx("games")}</span>
            </li>
          )) : <li className="text-center text-sm text-white/60">{tx("empty")}</li>)
          : (rows.length ? rows.map((r, i) => (
            <li key={r.user_id} className="flex items-center gap-2 rounded-xl bg-white/[0.07] p-2 text-sm">
              <span className="w-6 text-center font-bold text-[#ffd77a]">{i + 1}</span>
              <Avatar name={r.name ?? "?"} src={r.avatar} size={28} />
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
              <span className="text-xs text-white/70">{r.wins} {tx("wins")} · {r.points} {tx("points")}</span>
              <b className="w-10 text-right text-[#ffd77a]">{r.rating}</b>
            </li>
          )) : <li className="text-center text-sm text-white/60">{tx("empty")}</li>)}
      </ol>
    </div>
  );
}

function Medals({ tx }: { tx: (k: string) => string }) {
  const [p, setP] = useState<DProfile | null>(null);
  useEffect(() => { dominoProfile().then((r) => setP(r.data)); }, []);
  const s = p?.stats;
  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-2xl bg-white/[0.07] p-3 text-sm">
        <div className="mb-1 font-bold text-[#ffd77a]">{tx("myStats")}</div>
        {s ? `${s.games} ${tx("games")} · ${s.wins} ${tx("wins")} · ${s.points} ${tx("points")} · ${tx("rating")}: ${s.rating} · ${tx("streak")}: ${s.best_streak}` : "—"}
      </div>
      {p?.medals.length ? (
        <div className="grid grid-cols-3 gap-2">
          {p.medals.map((m) => (
            <div key={m.medal} className="rounded-2xl border border-[#c8973a66] bg-black/40 p-2 text-center">
              <div className="text-3xl">{MEDAL_ICON[m.medal] ?? "🏅"}</div>
              <div className="mt-1 text-xs font-semibold">{tx(`m_${m.medal}`)}</div>
              {m.cnt > 1 ? <div className="text-[10px] text-[#ffd77a]">×{m.cnt}</div> : null}
            </div>
          ))}
        </div>
      ) : <p className="text-center text-sm text-white/60">{tx("noMedals")}</p>}
    </div>
  );
}

// ───────────────────────── Table (shared view) ─────────────────────────

type Pos = "bottom" | "right" | "top" | "left";
const POS_BY_N: Record<number, Pos[]> = { 2: ["bottom", "top"], 3: ["bottom", "right", "left"], 4: ["bottom", "right", "top", "left"] };

function TableBackground() {
  const [img, setImg] = useState(true);
  return img ? (
    // Neon table from Canva (2400x1600). On a tall (portrait) screen it is turned 90° so the oval stands upright.
    <img src="/domino/table.jpg" alt="" onError={() => setImg(false)}
      className="pointer-events-none absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 max-w-none object-cover portrait:h-[100vw] portrait:w-[100vh] portrait:rotate-90" />
  ) : (
    <div className="pointer-events-none absolute inset-[9%_3%_11%] rounded-[50%] border-[3px] border-[#5b7cff] bg-[radial-gradient(ellipse_at_50%_45%,#1d3bb0_0,#11257a_55%,#0a1650_100%)] shadow-[0_0_0_6px_#2a1458,0_0_40px_#6d5bff,inset_0_0_60px_#000a,inset_0_0_30px_#7d6bff66] sm:inset-[12%_8%_10%]" />
  );
}

// Where tiles may lie: a rectangle inside the felt of table.jpg (2400x1600), clear of the neon line.
// Measured on the picture: neon line x 14%–86%, y 22.6%–71.7%, round ends of radius ~16% of the width.
// U/V below keep the corners of the rectangle inside the round ends too; MARGIN adds a gap on every side.
// The picture is drawn with object-cover (and turned 90° clockwise on a portrait screen), so the
// rectangle is mapped the same way. "short" = phone held sideways: little height, compact layout.
const FELT = { u0: 0.27, u1: 0.73, v0: 0.25, v1: 0.69 };
const FELT_MARGIN = 10;
type Geometry = { zone: { left: number; top: number; width: number; height: number }; short: boolean };
function useTableGeometry(): Geometry | null {
  const [geo, setGeo] = useState<Geometry | null>(null);
  useLayoutEffect(() => {
    const calc = () => {
      const W = window.innerWidth, H = window.innerHeight;
      let x0: number, x1: number, y0: number, y1: number;
      if (H >= W) {
        const s = Math.max(W / 1600, H / 2400), dw = 1600 * s, dh = 2400 * s, ox = (W - dw) / 2, oy = (H - dh) / 2;
        x0 = ox + (1 - FELT.v1) * dw; x1 = ox + (1 - FELT.v0) * dw; y0 = oy + FELT.u0 * dh; y1 = oy + FELT.u1 * dh;
      } else {
        const s = Math.max(W / 2400, H / 1600), dw = 2400 * s, dh = 1600 * s, ox = (W - dw) / 2, oy = (H - dh) / 2;
        x0 = ox + FELT.u0 * dw; x1 = ox + FELT.u1 * dw; y0 = oy + FELT.v0 * dh; y1 = oy + FELT.v1 * dh;
      }
      setGeo({
        zone: { left: x0 + FELT_MARGIN, top: y0 + FELT_MARGIN, width: Math.max(40, x1 - x0 - 2 * FELT_MARGIN), height: Math.max(40, y1 - y0 - 2 * FELT_MARGIN) },
        short: W > H && H < 520,
      });
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return geo;
}

type ViewSeat = { name: string; avatar: string | null; me: boolean; turn: boolean; blue: boolean; count: number; secs: number | null; partner: boolean; empty: boolean; seat: number };

function SeatBadge({ pos, s, tx, onSit, short = false }: { pos: Pos; s: ViewSeat; tx: (k: string) => string; onSit?: () => void; short?: boolean }) {
  const place: Record<Pos, string> = {
    // sideways phone: my badge goes to the bottom-left corner so the hand can sit in the middle
    bottom: short ? "bottom-[calc(env(safe-area-inset-bottom)+6px)] left-2" : "bottom-[calc(env(safe-area-inset-bottom)+6px)] left-2 sm:left-1/2 sm:-translate-x-1/2",
    top: "top-[148px] left-1/2 -translate-x-1/2 sm:top-2",
    left: "left-1 top-[30%] -translate-y-1/2 sm:left-4 sm:top-1/2",
    right: "right-1 top-[30%] -translate-y-1/2 sm:right-4 sm:top-1/2",
  };
  if (s.empty) {
    return (
      <button type="button" onClick={onSit} disabled={!onSit} className={`absolute z-20 ${place[pos]} rounded-full border border-dashed border-white/40 bg-black/50 px-3 py-2 text-xs text-white/70`}>
        {onSit ? tx("sitHere") : tx("emptySeat")}
      </button>
    );
  }
  return (
    <div className={`absolute z-20 ${place[pos]} flex items-center gap-2 rounded-full border border-[#c8973a88] bg-black/70 py-1 pl-1 pr-3 text-xs sm:text-sm`}>
      <Avatar name={s.name} src={s.avatar} turn={s.turn} blue={s.blue} size={pos === "bottom" ? 34 : 32} />
      <div className="leading-tight">
        <div className="max-w-[90px] truncate font-semibold sm:max-w-[140px]">{s.me ? tx("you") : s.name}{s.partner ? " 🤝" : ""}</div>
        {s.turn && s.secs !== null ? <div className={`text-[11px] ${s.secs <= 5 ? "text-red-400" : "text-[#7dffa6]"}`}>⏱ {s.secs} {tx("sec")}</div> : <div className="text-[11px] text-white/50">{s.count ? `🁫 ${s.count}` : ""}</div>}
      </div>
    </div>
  );
}

function HiddenHand({ pos, count }: { pos: Pos; count: number }) {
  if (pos === "bottom" || count <= 0) return null;
  const vertical = pos === "left" || pos === "right";
  const place: Record<Pos, string> = {
    top: "top-[192px] left-1/2 -translate-x-1/2 flex-row sm:top-[62px]",
    left: "left-2 top-[30%] mt-6 flex-col sm:left-6 sm:top-1/2 sm:-translate-y-1/2 sm:mt-12",
    right: "right-2 top-[30%] mt-6 flex-col sm:right-6 sm:top-1/2 sm:-translate-y-1/2 sm:mt-12",
    bottom: "",
  };
  const shown = Math.min(count, 10);
  return (
    <div className={`absolute z-10 flex gap-[3px] ${place[pos]}`}>
      {Array.from({ length: shown }, (_, i) => (
        <DominoTile key={i} back horizontal={vertical} className={vertical ? "h-[11px] w-[22px] sm:h-[15px] sm:w-[30px]" : "h-[22px] w-[11px] sm:h-[30px] sm:w-[15px]"} />
      ))}
      {count > shown ? <span className="text-[10px] text-white/60">+{count - shown}</span> : null}
    </div>
  );
}

type StageProps = {
  tx: (k: string) => string;
  sync: DSync;
  myId: string | null;
  clockOffset: number;
  error: string | null;
  toast: string | null;
  onPlay: (tile: number, side: DSide) => void;
  onDraw: () => void;
  onPass: () => void;
  onLeave: () => void;
  onSit?: (seat: number) => void;
  onStart?: () => void;
  onSettings?: (mode: DMode, target: number, teams: boolean) => void;
  onInvite?: (handle: string) => Promise<string>;
  banner?: string | null;
};

function teamLabel(tx: (k: string) => string, g: DGame, team: number, names: string[]) {
  const members = g.players.map((_, p) => p).filter((p) => g.teams[p] === team).map((p) => names[p]);
  if (g.team_count === 2 && g.n === 4) return `${team === 0 ? tx("teamA") : tx("teamB")} (${members.join(" + ")})`;
  return members.join(" + ");
}

function Stage({ tx, sync, myId, clockOffset, error, toast, onPlay, onDraw, onPass, onLeave, onSit, onStart, onSettings, onInvite, banner }: StageProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((v) => v + 1), 500); return () => clearInterval(id); }, []);
  const g = sync.game;
  const t = sync.table;
  const live = !!g && !g.match_over && t.status === "playing";
  const me = sync.me ?? null;
  const myTurn = live && !!g && me !== null && g.turn === me && !g.over;
  const moves = useMemo(() => (myTurn ? sync.moves ?? [] : []), [myTurn, sync.moves]);
  useEffect(() => { setSelected(null); }, [g?.ver]);
  const anchor = useAnchor(g, t.id);
  const geo = useTableGeometry();
  const short = !!geo?.short;
  // Compact scores: sideways phone, or more than two teams (3-4 players without teams).
  const compact = short || (!!g && g.team_count > 2);

  const nameOf = (uid: string) => sync.seats.find((s) => s.user_id === uid)?.name ?? "—";
  const avatarOf = (uid: string) => sync.seats.find((s) => s.user_id === uid)?.avatar ?? null;

  // Seats around the table
  const views: { pos: Pos; s: ViewSeat }[] = [];
  if (live && g) {
    const base = me ?? 0;
    const order = POS_BY_N[g.n] ?? POS_BY_N[4];
    const secsLeft = Math.max(0, Math.ceil(sync.turn_secs - (Date.now() - clockOffset - Date.parse(g.turn_at)) / 1000));
    g.players.forEach((uid, p) => {
      const rel = (p - base + g.n) % g.n;
      const myTeam = me !== null ? g.teams[me] : g.teams[0];
      views.push({
        pos: order[rel],
        s: {
          name: nameOf(uid), avatar: avatarOf(uid), me: p === me, turn: !g.over && g.turn === p, blue: g.teams[p] !== myTeam,
          count: g.hand_n[p] ?? 0, secs: !g.over && g.turn === p ? secsLeft : null, partner: p !== me && g.teams[p] === myTeam && g.team_count === 2 && g.n === 4,
          empty: false, seat: p,
        },
      });
    });
  } else {
    const mySeat = sync.seats.find((s) => s.user_id === myId)?.seat ?? 0;
    const order: Pos[] = ["bottom", "right", "top", "left"];
    for (let seat = 0; seat < 4; seat++) {
      const s = sync.seats.find((x) => x.seat === seat);
      const rel = (seat - mySeat + 4) % 4;
      views.push({
        pos: order[rel],
        s: s
          ? { name: s.name ?? "—", avatar: s.avatar, me: s.user_id === myId, turn: false, blue: t.teams && (seat % 2) !== (mySeat % 2), count: 0, secs: null, partner: t.teams && s.user_id !== myId && seat % 2 === mySeat % 2, empty: false, seat }
          : { name: "", avatar: null, me: false, turn: false, blue: false, count: 0, secs: null, partner: false, empty: true, seat },
      });
    }
  }

  const hand = sync.hand ?? [];
  const playable = new Set(moves.map((m) => m.t));
  const targets = selected !== null ? moves.filter((m) => m.t === selected).map((m) => m.side) : [];
  const pick = (tile: number) => {
    if (!myTurn || !playable.has(tile)) return;
    const sides = moves.filter((m) => m.t === tile).map((m) => m.side);
    if (sides.length === 1) { onPlay(tile, sides[0]); setSelected(null); return; }
    setSelected(selected === tile ? null : tile);
  };

  const names = g ? g.players.map(nameOf).map((n, p) => (p === me ? tx("you") : n)) : [];
  const winnerName = g && g.winner !== null ? names[g.winner] : null;

  return (
    <div className="absolute inset-0">
      <TableBackground />
      {/* top bar */}
      <div className="absolute left-2 top-2 z-30 flex items-start gap-2 sm:left-5 sm:top-4">
        <button type="button" onClick={onLeave} className="rounded-full bg-black/60 px-3 py-1.5 text-xs">← {tx("leave")}</button>
        {short ? null : <div className="hidden sm:block"><Logo /></div>}
      </div>
      <div className={`absolute left-2 top-[46px] z-30 hidden whitespace-nowrap rounded-full border border-[#c8973a] bg-black/70 px-3 py-1 text-[11px] text-[#ffd77a] sm:left-5 sm:top-[84px] sm:text-[13px] ${short ? "" : "sm:block"}`}>
        {t.mode === "365" ? "Telefon 365" : "101"} · {tx("target")} {t.target}{g ? ` · ${g.n === 4 && g.team_count === 2 ? "2×2" : `${g.n}`}` : ""}{g && live ? ` · ${tx("round")} ${g.round_no}` : ""}
      </div>

      {/* scores */}
      {g ? (
        compact ? (
          // One line per team, thin bar: fits 4 solo players (and a sideways phone) without covering the top seat.
          <div className={`absolute right-2 top-2 z-30 rounded-xl border border-[#c8973a] bg-black/75 px-2 py-1.5 ${short ? "w-[160px]" : "w-[170px] sm:right-5 sm:top-4 sm:w-[220px]"}`}>
            <div className="mb-1 flex justify-between text-[10px] font-bold text-[#ffd77a]"><span className="tracking-[2px]">{tx("scores")}</span><span className="font-normal">{t.mode === "365" ? "365" : "101"} · {tx("round")} {g.round_no}</span></div>
            {g.scores.map((sc, team) => {
              const mine = me !== null && g.teams[me] === team;
              return (
                <div key={team} className="mb-1 text-[10px] leading-tight">
                  <div className="flex justify-between gap-2"><span className="truncate">{teamLabel(tx, g, team, names)}</span><b className={mine ? "text-[#ffd77a]" : ""}>{sc}/{g.target}</b></div>
                  <div className="mt-px h-[3px] overflow-hidden rounded bg-[#2a2a2a]"><b className="block h-full bg-[linear-gradient(90deg,#c8973a,#ffe08a)]" style={{ width: `${Math.min(100, (sc / g.target) * 100)}%` }} /></div>
                </div>
              );
            })}
            {live ? <div className="text-[10px] text-white/60">{tx("stock")}: {g.stock_n}</div> : null}
          </div>
        ) : (
          <div className="absolute right-2 top-2 z-30 w-[170px] rounded-xl border border-[#c8973a] bg-black/75 p-2 sm:right-5 sm:top-4 sm:w-[250px] sm:p-3.5">
            <div className="mb-1.5 text-[10px] font-bold tracking-[2px] text-[#ffd77a] sm:text-[13px]">{tx("scores")}</div>
            <div className="mb-1 text-[10px] text-[#ffd77a] sm:hidden">{t.mode === "365" ? "Telefon 365" : "101"} · {tx("round")} {g.round_no}</div>
            {g.scores.map((sc, team) => {
              const mine = me !== null && g.teams[me] === team;
              return (
                <div key={team} className="mb-1.5 text-[10px] sm:mb-2.5 sm:text-[13px]">
                  <div className="flex justify-between gap-2"><span className="truncate">{teamLabel(tx, g, team, names)}</span><b className={mine ? "text-[#ffd77a]" : ""}>{sc}/{g.target}</b></div>
                  <div className="mt-0.5 h-1.5 overflow-hidden rounded bg-[#2a2a2a] sm:h-2"><b className="block h-full bg-[linear-gradient(90deg,#c8973a,#ffe08a)]" style={{ width: `${Math.min(100, (sc / g.target) * 100)}%` }} /></div>
                </div>
              );
            })}
            {g.mode === "365" ? <div className="hidden text-[11px] text-white/60 sm:block">{tx("rule35")}</div> : null}
            {live ? <div className="text-[10px] text-white/60 sm:text-[11px]">{tx("stock")}: {g.stock_n}</div> : null}
          </div>
        )
      ) : null}

      {views.map(({ pos, s }) => (
        <SeatBadge key={`${pos}-${s.seat}`} pos={pos} s={s} tx={tx} short={short} onSit={!live && s.empty && onSit ? () => onSit(s.seat) : undefined} />
      ))}
      {/* sideways phone: no room for the face-down rows, the badge already shows how many tiles are left */}
      {live && g && !short ? views.filter((v) => !v.s.me).map(({ pos, s }) => <HiddenHand key={`h-${pos}`} pos={pos} count={s.count} />) : null}

      {/* board: always inside the felt, never on or past the neon line */}
      {g && (live || g.match_over) && geo ? (
        <div className="absolute z-10" style={geo.zone}>
          <DominoBoard game={g} anchor={anchor} targets={targets} onTarget={(side) => { if (selected !== null) { onPlay(selected, side); setSelected(null); } }} lastKey={lastPieceKey(g)} maxUnit={46} />
        </div>
      ) : null}

      {toast ? (
        <div key={toast} className={`absolute left-1/2 top-[44%] z-40 -translate-x-1/2 animate-bounce rounded-3xl px-5 py-1.5 text-xl font-black shadow-[0_0_30px_#ffd77aaa] sm:text-2xl ${gold}`}>{toast}</div>
      ) : null}

      {/* my hand + actions */}
      {live && g && me !== null ? (
        <div className={`absolute inset-x-0 z-20 flex flex-col items-center gap-2 px-2 ${short ? "bottom-[calc(env(safe-area-inset-bottom)+4px)]" : "bottom-[calc(env(safe-area-inset-bottom)+46px)]"}`}>
          {myTurn && !short ? <div className="rounded-full bg-black/60 px-3 py-0.5 text-[11px] text-[#7dffa6]">{sync.need === "play" ? tx("tapTile") : tx("yourTurn")}</div> : null}
          <div className="flex max-w-full items-end justify-center gap-1 overflow-x-auto pb-1 sm:gap-2">
            {hand.map((tile) => {
              const ok = playable.has(tile);
              return (
                <button key={tile} type="button" onClick={() => pick(tile)} disabled={!myTurn || !ok}
                  className={`shrink-0 transition-transform ${selected === tile ? "-translate-y-3" : ok ? "hover:-translate-y-1" : ""}`}>
                  <DominoTile a={tileLo(tile)} b={tileHi(tile)} glow={selected === tile} dim={myTurn && !ok}
                    className={short ? "h-[50px] w-[25px]" : "h-[60px] w-[30px] sm:h-[96px] sm:w-[48px]"} />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {live && g && me !== null ? (
        <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+6px)] right-2 z-30 flex gap-2 sm:right-5">
          <button type="button" onClick={onDraw} disabled={!myTurn || sync.need !== "draw"}
            className={`rounded-full border border-[#c8973a88] px-3 py-2 text-xs disabled:opacity-40 sm:text-sm ${myTurn && sync.need === "draw" ? gold + " font-bold" : "bg-black/70"}`}>
            {g.stock_n > 0 ? `${tx("draw")} (${g.stock_n})` : tx("drawEmpty")}
          </button>
          <button type="button" onClick={onPass} disabled={!myTurn || sync.need !== "pass"}
            className={`rounded-full px-4 py-2 text-xs font-extrabold disabled:opacity-40 sm:text-sm ${myTurn && sync.need === "pass" ? gold : "bg-black/70 text-white"}`}>{tx("pass")}</button>
        </div>
      ) : null}

      {/* chat placeholder (stage 4) */}
      <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+6px)] left-2 z-30 hidden w-[260px] rounded-xl border border-white/15 bg-black/70 p-2.5 text-xs text-white/50 lg:block">
        💬 Ya Allah Bismillah · uğurlar hamıya 🎲
      </div>

      {error ? <div className="absolute left-1/2 top-[38%] z-50 -translate-x-1/2 rounded-xl bg-red-600/90 px-4 py-2 text-sm font-semibold">{error}</div> : null}
      {banner ? <div className="absolute left-2 top-[48px] z-40 max-w-[48vw] rounded-full bg-black/70 px-3 py-1 text-[10px] text-white/70 sm:left-5 sm:top-[120px] sm:text-[11px]">{banner}</div> : null}

      {/* round over */}
      {g && g.over && !g.match_over && live ? (
        <div className="absolute left-1/2 top-1/2 z-40 w-[min(92vw,380px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#c8973a] bg-black/85 p-4 text-center">
          <div className="text-lg font-black text-[#ffd77a]">{g.blocked ? tx("blocked") : `${tx("roundOver")}: ${winnerName ?? ""} ${tx("won")}`}</div>
          {g.last_score && g.last_score.kind !== "play" ? <div className="mt-1 text-sm">+{g.last_score.pts} → {teamLabel(tx, g, g.last_score.team, names)}</div> : null}
          {g.hands ? (
            <div className="mt-3 space-y-1.5 text-left text-xs">
              <div className="text-white/60">{tx("hands")}:</div>
              {g.hands.map((h, p) => (
                <div key={p} className="flex items-center gap-1.5"><span className="w-16 truncate">{names[p]}</span>
                  {h.map((tile) => <DominoTile key={tile} a={tileLo(tile)} b={tileHi(tile)} horizontal className="h-[14px] w-[28px]" />)}</div>
              ))}
            </div>
          ) : null}
          <div className="mt-3 text-xs text-white/60">{tx("nextRound")}</div>
        </div>
      ) : null}

      {/* waiting room / match over */}
      {!live ? (
        <WaitingPanel tx={tx} sync={sync} myId={myId} names={names} onStart={onStart} onSettings={onSettings} onInvite={onInvite} />
      ) : null}
    </div>
  );
}

function WaitingPanel({ tx, sync, myId, names, onStart, onSettings, onInvite }: {
  tx: (k: string) => string; sync: DSync; myId: string | null; names: string[];
  onStart?: () => void; onSettings?: (mode: DMode, target: number, teams: boolean) => void; onInvite?: (handle: string) => Promise<string>;
}) {
  const t = sync.table;
  const g = sync.game;
  const owner = t.owner !== null && t.owner === myId;
  const [handle, setHandle] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const count = sync.seats.length;
  // The player who left is no longer seated, so the name is read from the profile.
  const leaver = g?.leaver ?? null;
  const [leaverName, setLeaverName] = useState<string | null>(null);
  useEffect(() => {
    setLeaverName(null);
    if (!leaver) return;
    const seated = sync.seats.find((s) => s.user_id === leaver)?.name;
    if (seated) { setLeaverName(seated); return; }
    let alive = true;
    supabase?.from("profiles").select("name").eq("id", leaver).maybeSingle()
      .then(({ data }) => { if (alive && data?.name) setLeaverName(data.name as string); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaver]);
  return (
    <div className="absolute left-1/2 top-1/2 z-30 w-[min(88vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#c8973a] bg-black/80 p-4 text-center">
      {g?.match_over ? (
        <div className="mb-3">
          <div className="text-xl font-black text-[#ffd77a]">{tx("matchOver")}</div>
          {g.match_winner !== null ? <div className="mt-1 text-sm">🏆 {tx("winner")}: <b>{teamLabel(tx, g, g.match_winner, names)}</b></div> : null}
          {g.instant ? <div className="text-xs text-[#7dffa6]">{tx("instant")}</div> : null}
          {g.leaver ? <div className="text-xs text-white/60">{leaverName ?? tx("somePlayer")} {tx("left")}</div> : null}
          <div className="mt-1 text-xs text-white/70">{g.scores.join(" : ")}</div>
        </div>
      ) : null}
      {owner && onSettings ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            {(["101", "365"] as DMode[]).map((m) => (
              <button key={m} type="button" onClick={() => onSettings(m, TARGETS[m][0], t.teams)} className={`flex-1 rounded-xl py-1.5 text-sm font-bold ${t.mode === m ? gold : "bg-white/10"}`}>{m === "101" ? "101" : "Telefon 365"}</button>
            ))}
          </div>
          {t.mode === "365" ? (
            <div className="flex justify-center gap-2 text-sm">
              {TARGETS["365"].map((v) => (
                <button key={v} type="button" onClick={() => onSettings(t.mode, v, t.teams)} className={`rounded-full px-3 py-0.5 ${t.target === v ? gold : "bg-white/10"}`}>{v}</button>
              ))}
            </div>
          ) : null}
          <label className="flex items-center justify-center gap-2 text-xs">
            <input type="checkbox" checked={t.teams} onChange={(e) => onSettings(t.mode, t.target, e.target.checked)} className="accent-[#c8973a]" />{tx("teams")}
          </label>
          <button type="button" onClick={onStart} disabled={count < 2} className={`w-full rounded-xl py-2.5 font-extrabold disabled:opacity-40 ${gold}`}>{g?.match_over ? tx("again") : tx("start")} ({count}/4)</button>
          {count < 2 ? <div className="text-xs text-white/60">{tx("needTwo")}</div> : null}
        </div>
      ) : (
        <div className="text-sm text-white/80">{tx("waitOwner")} ({count}/4)</div>
      )}
      {onInvite ? (
        <form className="mt-3 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (!handle.trim()) return; setMsg(await onInvite(handle)); setHandle(""); }}>
          <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder={tx("invitePh")} className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-white/40" />
          <button type="submit" className="rounded-xl bg-white/15 px-3 text-sm">{tx("invite")}</button>
        </form>
      ) : null}
      {msg ? <div className="mt-1 text-xs text-[#7dffa6]">{msg}</div> : null}
    </div>
  );
}

// Shows "+N" when a move scored.
// The timer depends only on the toast itself, so the 1.5 s polling cannot keep restarting it.
function useScoreToast(g: DGame | undefined) {
  const [toast, setToast] = useState<string | null>(null);
  const lastVer = useRef<number | null>(null);
  const ver = g?.ver;
  const pts = g?.last_score?.pts ?? 0;
  const matchOver = !!g?.match_over;
  useEffect(() => {
    if (ver === undefined) return;
    if (lastVer.current !== null && ver !== lastVer.current && pts > 0 && !matchOver) setToast(`+${pts} xal`);
    lastVer.current = ver;
  }, [ver, pts, matchOver]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => { if (matchOver) setToast(null); }, [matchOver]);
  return toast;
}

// ───────────────────────── Online table ─────────────────────────

function DominoTable({ tableId, tx, onExit }: { tableId: number; tx: (k: string) => string; onExit: () => void }) {
  const [sync, setSync] = useState<DSync | null>(null);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const toast = useScoreToast(sync?.game);

  useEffect(() => { supabase?.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null)); }, []);

  const apply = useCallback((s: DSync | null) => {
    if (!s) return;
    if (s.gone) { onExit(); return; }
    setOffset(Date.now() - Date.parse(s.now));
    setSync(s);
  }, [onExit]);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const loop = async () => {
      const r = await dominoSync(tableId);
      if (!alive) return;
      apply(r.data);
      timer = setTimeout(loop, 1500);
    };
    loop();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [tableId, apply]);

  useEffect(() => { if (!error) return; const id = setTimeout(() => setError(null), 2500); return () => clearTimeout(id); }, [error]);

  const act = async (p: Promise<{ data: DSync | null; error: string | null }>) => {
    const r = await p;
    if (r.error) setError(errText(tx, r.error)); else apply(r.data);
  };
  const plain = async (p: Promise<{ data: unknown; error: string | null }>) => {
    const r = await p;
    if (r.error) setError(errText(tx, r.error));
    else { const s = await dominoSync(tableId); apply(s.data); }
  };
  const leave = async () => {
    const g = sync?.game;
    const playing = !!g && !g.match_over && sync?.table.status === "playing" && sync.me !== null && sync.me !== undefined;
    if (playing && !window.confirm(tx("leaveConfirm"))) return;
    await dominoLeave();
    onExit();
  };

  if (!sync) return <div className="grid h-full place-items-center text-white/60">…</div>;
  return (
    <Stage
      tx={tx} sync={sync} myId={myId} clockOffset={offset} error={error} toast={toast}
      onPlay={(tile, side) => act(dominoPlay(tableId, tile, side))}
      onDraw={() => act(dominoDraw(tableId))}
      onPass={() => act(dominoPass(tableId))}
      onLeave={leave}
      onSit={(seat) => plain(dominoJoin(tableId, seat))}
      onStart={() => plain(dominoStart(tableId))}
      onSettings={(mode, target, teams) => plain(dominoSettings(tableId, mode, target, teams))}
      onInvite={async (handle) => {
        const u = await findUserByHandle(handle);
        if (!u) return tx("noUser");
        const r = await dominoInvite(tableId, u.id);
        return r.error ? errText(tx, r.error) ?? tx("failed") : `${tx("invited")} (${u.name})`;
      }}
    />
  );
}

// ───────────────────────── Demo (preview without server) ─────────────────────────

const DEMO_IDS = ["me", "rauf", "elnur", "aysel"];
function demoMoves(g: DGame, hand: number[]): { t: number; side: DSide }[] {
  const out: { t: number; side: DSide }[] = [];
  for (const t of hand) for (const e of g.ends) if (tileLo(t) === e.v || tileHi(t) === e.v) out.push({ t, side: e.k });
  return out;
}
function demoEnds(g: Pick<DGame, "ch_a" | "ch_b" | "spin_idx" | "up_a" | "up_b" | "dn_a" | "dn_b">) {
  const n = g.ch_a.length;
  const ends: { k: DSide; v: number; dbl: boolean }[] = [
    { k: "L", v: g.ch_a[0], dbl: g.ch_a[0] === g.ch_b[0] },
    { k: "R", v: g.ch_b[n - 1], dbl: g.ch_a[n - 1] === g.ch_b[n - 1] },
  ];
  if (g.spin_idx !== null && g.spin_idx > 0 && g.spin_idx < n - 1) {
    const sv = g.ch_a[g.spin_idx];
    const u = g.up_a.length, d = g.dn_a.length;
    ends.push({ k: "U", v: u ? g.up_b[u - 1] : sv, dbl: !!u && g.up_a[u - 1] === g.up_b[u - 1] });
    ends.push({ k: "D", v: d ? g.dn_b[d - 1] : sv, dbl: !!d && g.dn_a[d - 1] === g.dn_b[d - 1] });
  }
  return ends;
}
// ?demo=1: the design layout; ?demo=101 / ?demo=365: long lines to check how the snake turns.
const DEMO_BOARDS: Record<string, Pick<DGame, "ch_a" | "ch_b" | "spin_idx" | "up_a" | "up_b" | "dn_a" | "dn_b">> = {
  "1": { ch_a: [5, 2, 6, 6, 4, 4], ch_b: [2, 6, 6, 4, 4, 1], spin_idx: 2, up_a: [6], up_b: [4], dn_a: [6], dn_b: [0] },
  "101": {
    ch_a: [6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0, 6, 6, 4, 1, 3, 5, 2], ch_b: [5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0, 6, 6, 4, 1, 3, 5, 2, 0],
    spin_idx: null, up_a: [], up_b: [], dn_a: [], dn_b: [],
  },
  "365": {
    ch_a: [3, 2, 4, 6, 6, 5, 5, 1, 1, 0, 3, 3, 4], ch_b: [2, 4, 6, 6, 5, 5, 1, 1, 0, 3, 3, 4, 4], spin_idx: 3,
    up_a: [6, 2, 2, 0, 0], up_b: [2, 2, 0, 0, 5], dn_a: [6, 3, 1, 4], dn_b: [3, 1, 4, 5],
  },
};
function demoSync(variant = "1"): DSync {
  const solo = variant === "solo"; // 4 players without teams, like a real 101 table
  const base = DEMO_BOARDS[solo ? "101" : variant] ?? DEMO_BOARDS["1"];
  const used = new Set([...base.ch_a.map((a, i) => Math.min(a, base.ch_b[i]) * 10 + Math.max(a, base.ch_b[i])),
    ...base.up_a.map((a, i) => Math.min(a, base.up_b[i]) * 10 + Math.max(a, base.up_b[i])),
    ...base.dn_a.map((a, i) => Math.min(a, base.dn_b[i]) * 10 + Math.max(a, base.dn_b[i]))]);
  const ends = demoEnds(base);
  const g: DGame = {
    ...base, players: DEMO_IDS, n: 4, mode: variant === "101" || solo ? "101" : "365",
    teams: solo ? [0, 1, 2, 3] : [0, 1, 0, 1], team_count: solo ? 4 : 2, scores: solo ? [0, 0, 0, 0] : [180, 135], target: solo || variant === "101" ? 101 : 365,
    turn: 0, starter: 0, passes: 0, over: false, winner: null, blocked: false, first_tile: null, match_over: false, match_winner: null, instant: false,
    last_score: null, round_no: 3, turn_at: new Date().toISOString(), over_at: null, last_move: null, leaver: null, ver: 1, stock_n: 0,
    ends_sum: ends.reduce((a, e) => a + e.v * (e.dbl ? 2 : 1), 0), ends, hand_n: [7, 7, 7, 7],
  };
  const hand = [55, 36, 2, 13, 24, 11, 5, 15, 25, 35, 45, 56, 16, 26, 46, 0, 22, 44].filter((t) => !used.has(t)).slice(0, 7);
  return {
    now: new Date().toISOString(), turn_secs: 30,
    table: { id: 0, owner: "me", mode: variant === "101" || solo ? "101" : "365", target: variant === "101" || solo ? 101 : 365, teams: !solo, status: "playing" },
    seats: [
      { seat: 0, user_id: "me", name: "Sən", avatar: null }, { seat: 1, user_id: "rauf", name: "Rauf", avatar: null },
      { seat: 2, user_id: "elnur", name: "Elnur", avatar: null }, { seat: 3, user_id: "aysel", name: "Aysel", avatar: null },
    ],
    game: g, me: 0, hand, need: "play", moves: demoMoves(g, hand),
  };
}

function DemoTable({ tx, onExit, variant }: { tx: (k: string) => string; onExit: () => void; variant: string }) {
  const [sync, setSync] = useState<DSync>(() => demoSync(variant));
  const toast = useScoreToast(sync.game);
  const play = (tile: number, side: DSide) => {
    setSync((s) => {
      const g0 = s.game!;
      const g = { ...g0, ch_a: [...g0.ch_a], ch_b: [...g0.ch_b], up_a: [...g0.up_a], up_b: [...g0.up_b], dn_a: [...g0.dn_a], dn_b: [...g0.dn_b] };
      const lo = tileLo(tile), hi = tileHi(tile);
      const other = (inner: number) => (lo === inner ? hi : lo);
      if (side === "L") { const inner = g.ch_a[0]; g.ch_a.unshift(other(inner)); g.ch_b.unshift(inner); if (g.spin_idx !== null) g.spin_idx += 1; }
      else if (side === "R") { const inner = g.ch_b[g.ch_b.length - 1]; g.ch_a.push(inner); g.ch_b.push(other(inner)); }
      else if (side === "U") { const inner = g.up_a.length ? g.up_b[g.up_b.length - 1] : g.ch_a[g.spin_idx!]; g.up_a.push(inner); g.up_b.push(other(inner)); }
      else { const inner = g.dn_a.length ? g.dn_b[g.dn_b.length - 1] : g.ch_a[g.spin_idx!]; g.dn_a.push(inner); g.dn_b.push(other(inner)); }
      g.ends = demoEnds(g);
      g.ends_sum = g.ends.reduce((a, e) => a + e.v * (e.dbl ? 2 : 1), 0);
      g.scores = [...g.scores];
      g.last_score = null;
      if (g.mode === "365" && g.ends_sum % 5 === 0) { g.scores[0] += g.ends_sum; g.last_score = { team: 0, pts: g.ends_sum, kind: "play" }; }
      g.last_move = { kind: "play", p: 0, t: tile, side };
      g.ver += 1;
      g.turn_at = new Date().toISOString();
      const hand = (s.hand ?? []).filter((t) => t !== tile);
      g.hand_n = [hand.length, ...g.hand_n.slice(1)];
      return { ...s, now: new Date().toISOString(), game: g, hand, moves: demoMoves(g, hand), need: demoMoves(g, hand).length ? "play" : "pass" };
    });
  };
  return (
    <Stage tx={tx} sync={sync} myId="me" clockOffset={0} error={null} toast={toast} banner={tx("demoNote")}
      onPlay={play} onDraw={() => {}} onPass={() => setSync(demoSync(variant))} onLeave={onExit} />
  );
}
