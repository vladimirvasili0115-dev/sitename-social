// Domino qaydalar mühərriki (2-4 nəfər): 101 və Telefon 365.
// Təmiz məntiqdir: nə brauzer, nə DB tələb edir, server və klientdə eyni işləyir.

export type Tile = readonly [number, number];
export type Mode = "101" | "365";
export type Side = "L" | "R" | "U" | "D";

export interface Placed {
  tile: Tile;
  a: number; // daxili (mərkəzə baxan) rəqəm
  b: number; // xarici (açıq) rəqəm
}

export interface Spin {
  idx: number; // chain içində spinner (ilk qoyulan qoşa) indeksi
  up: Placed[];
  down: Placed[];
}

export interface LastScore {
  team: number;
  pts: number;
  kind: "play" | "round" | "block";
}

export interface State {
  mode: Mode;
  n: number;
  teams: number[]; // oyunçu → komanda
  teamCount: number;
  scores: number[]; // komanda xalları
  target: number;
  hands: Tile[][];
  stock: Tile[];
  chain: Placed[];
  spin: Spin | null; // yalnız 365
  turn: number;
  starter: number;
  passes: number;
  over: boolean; // raund bitdi
  winner: number | null; // əli bitən oyunçu; blokda null
  blocked: boolean;
  firstTile: Tile | null;
  matchOver: boolean;
  matchWinner: number | null; // komanda
  instant: boolean; // 365-də birdəfəyə 35+ xal
  lastScore: LastScore | null;
  roundNo: number;
}

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function allTiles(): Tile[] {
  const out: Tile[] = [];
  for (let i = 0; i <= 6; i++) for (let j = i; j <= 6; j++) out.push([i, j]);
  return out;
}

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const isDouble = (t: Tile) => t[0] === t[1];
export const pips = (t: Tile) => t[0] + t[1];
export const handPips = (h: readonly Tile[]) => h.reduce((a, t) => a + pips(t), 0);

// Başlanğıc: 365-də əvvəl 3-2, sonra 1-1 … 6-6. 101-də 1-1 … 6-6.
const DOUBLE_ORDER = [1, 2, 3, 4, 5, 6];

function findStarter(hands: Tile[][], mode: Mode): { player: number; tile: Tile } | null {
  if (mode === "365") {
    for (let p = 0; p < hands.length; p++) {
      const t = hands[p].find((x) => (x[0] === 3 && x[1] === 2) || (x[0] === 2 && x[1] === 3));
      if (t) return { player: p, tile: t };
    }
  }
  for (const v of DOUBLE_ORDER) {
    for (let p = 0; p < hands.length; p++) {
      const t = hands[p].find((x) => isDouble(x) && x[0] === v);
      if (t) return { player: p, tile: t };
    }
  }
  return null;
}

export interface MatchOpts {
  target?: number; // 101: 101; 365: 365 / 355 / 255
  teams?: boolean; // yalnız 4 nəfərdə: 2x2 (standart: bəli)
}

function dealRound(base: Pick<State, "n" | "mode" | "teams" | "teamCount" | "scores" | "target" | "roundNo">, rng: Rng): State {
  const { n, mode } = base;
  for (let tries = 0; tries < 1000; tries++) {
    const deck = shuffle(allTiles(), rng);
    const hands: Tile[][] = [];
    for (let p = 0; p < n; p++) hands.push(deck.slice(p * 7, p * 7 + 7));
    const stock = deck.slice(n * 7);
    const s = findStarter(hands, mode);
    if (!s) continue; // başlanğıc daş yoxdursa yenidən payla
    return {
      ...base, hands, stock, chain: [], spin: null, turn: s.player, starter: s.player,
      passes: 0, over: false, winner: null, blocked: false, firstTile: s.tile,
      matchOver: false, matchWinner: null, instant: false, lastScore: null,
    };
  }
  throw new Error("deal_failed");
}

export function newMatch(n: number, mode: Mode, rng: Rng, opts: MatchOpts = {}): State {
  if (n < 2 || n > 4) throw new Error("players_2_4");
  const useTeams = n === 4 && opts.teams !== false;
  const teams = useTeams ? [0, 1, 0, 1] : Array.from({ length: n }, (_, i) => i);
  const teamCount = useTeams ? 2 : n;
  const target = opts.target ?? (mode === "101" ? 101 : 365);
  if (mode === "365" && ![365, 355, 255].includes(target)) throw new Error("bad_target");
  if (mode === "101" && target !== 101) throw new Error("bad_target");
  return dealRound({ n, mode, teams, teamCount, scores: new Array(teamCount).fill(0), target, roundNo: 1 }, rng);
}

// Köhnə ad (testlər və sadə istifadə üçün)
export const newRound = newMatch;

// Raund bitib, oyun bitməyibsə yeni raund (xallar saxlanır).
export function nextRound(s: State, rng: Rng): State {
  if (!s.over || s.matchOver) throw new Error("no_next_round");
  return dealRound(
    { n: s.n, mode: s.mode, teams: s.teams, teamCount: s.teamCount, scores: s.scores.slice(), target: s.target, roundNo: s.roundNo + 1 },
    rng,
  );
}

// ───────── Lövhə uc hesabı ─────────

const arms = (s: State) => !!s.spin && s.spin.idx > 0 && s.spin.idx < s.chain.length - 1;

function endValue(pl: Placed, outer: "a" | "b"): number {
  return outer === "a" ? pl.a : pl.b;
}

export type EndKey = "L" | "R" | "U" | "D";

export function openEnds(s: State): { key: EndKey; value: number; double: boolean }[] {
  if (!s.chain.length) return [];
  const out: { key: EndKey; value: number; double: boolean }[] = [];
  const first = s.chain[0];
  const last = s.chain[s.chain.length - 1];
  out.push({ key: "L", value: endValue(first, "a"), double: first.a === first.b });
  out.push({ key: "R", value: endValue(last, "b"), double: last.a === last.b });
  if (arms(s)) {
    const v = s.chain[s.spin!.idx].a;
    const up = s.spin!.up, down = s.spin!.down;
    const u = up.length ? up[up.length - 1] : null;
    const d = down.length ? down[down.length - 1] : null;
    out.push({ key: "U", value: u ? u.b : v, double: !!u && u.a === u.b });
    out.push({ key: "D", value: d ? d.b : v, double: !!d && d.a === d.b });
  }
  return out;
}

// 365 xal hesabı: açıq uclardakı rəqəmlərin cəmi (qoşa uc iki dəfə sayılır).
// Lövhədə tək daş varsa, onun öz cəmi.
// Spinnerin yuxarı/aşağı tərəfi yalnız ora daş qoyulubsa sayılır (istifadəçi təsdiqlədi):
// 2 tərəfdə daş → 2 ucun cəmi, 3 tərəfdə → 3, 4 tərəfdə → 4.
export function endsSum(s: State): number {
  if (!s.chain.length) return 0;
  if (s.chain.length === 1) return pips(s.chain[0].tile);
  return openEnds(s)
    .filter((e) => (e.key !== "U" || !!s.spin?.up.length) && (e.key !== "D" || !!s.spin?.down.length))
    .reduce((a, e) => a + e.value * (e.double ? 2 : 1), 0);
}

export function canPlayTile(s: State, t: Tile, side: Side): boolean {
  if (!s.chain.length) return !!s.firstTile && t[0] === s.firstTile[0] && t[1] === s.firstTile[1] && side === "R";
  if ((side === "U" || side === "D") && (s.mode !== "365" || !arms(s))) return false;
  const e = openEnds(s).find((x) => x.key === side);
  if (!e) return false;
  return t[0] === e.value || t[1] === e.value;
}

export interface Move { tileIdx: number; side: Side }

export function legalMoves(s: State, p: number): Move[] {
  const out: Move[] = [];
  s.hands[p].forEach((t, i) => {
    (["L", "R", "U", "D"] as Side[]).forEach((side) => {
      if (canPlayTile(s, t, side)) out.push({ tileIdx: i, side });
    });
  });
  return out;
}

export const hasMove = (s: State, p: number) => legalMoves(s, p).length > 0;

// Bazardan neçə daş: 101 → 2-2, 365 → 1-1. Az qalıbsa qalan qədər.
export const drawChunk = (s: State) => Math.min(s.mode === "101" ? 2 : 1, s.stock.length);

export type Result = { ok: true; s: State } | { ok: false; err: string };
const bad = (err: string): Result => ({ ok: false, err });

function clone(s: State): State {
  return {
    ...s,
    scores: s.scores.slice(),
    hands: s.hands.map((h) => h.slice()),
    stock: s.stock.slice(),
    chain: s.chain.slice(),
    spin: s.spin ? { idx: s.spin.idx, up: s.spin.up.slice(), down: s.spin.down.slice() } : null,
  };
}

const nextTurn = (s: State) => { s.turn = (s.turn + 1) % s.n; };

function orient(t: Tile, inner: number): Placed {
  return t[0] === inner ? { tile: t, a: t[0], b: t[1] } : { tile: t, a: t[1], b: t[0] };
}

function addScore(s: State, team: number, pts: number, kind: LastScore["kind"]) {
  s.scores[team] += pts;
  s.lastScore = { team, pts, kind };
  if (s.scores[team] >= s.target && !s.matchOver) {
    s.matchOver = true;
    s.matchWinner = team;
    s.over = true;
  }
}

// 365 raund sonu bonusu: həmişə yuxarı, növbəti 5-ə (1-4 → 5, 6-9 → 10, 11 → 15; 10 → 10),
// yalnız komandanın xalı 300-dən az olanda (istifadəçi təsdiqlədi).
export const BONUS_LIMIT_365 = 300;
export const round5 = (x: number) => Math.ceil(x / 5) * 5;

function bonus365(s: State, team: number, raw: number, kind: "round" | "block") {
  if (s.scores[team] >= BONUS_LIMIT_365) return;
  const pts = round5(raw);
  if (pts > 0) addScore(s, team, pts, kind);
}

export function play(s0: State, p: number, tileIdx: number, side: Side): Result {
  if (s0.over) return bad("over");
  if (p !== s0.turn) return bad("not_your_turn");
  const t = s0.hands[p][tileIdx];
  if (!t) return bad("no_tile");
  if (!canPlayTile(s0, t, side)) return bad("illegal");
  const s = clone(s0);
  s.hands[p].splice(tileIdx, 1);
  const wasEmpty = s.chain.length === 0;
  // 365 spinner: ilk dəfə yanına daş qoyulan qoşa (istifadəçi təsdiqlədi). İki ucda qoşa olsa da,
  // hansına əvvəl daş bitişdirilsə, 4 tərəfli yalnız o olur; digəri adi qoşa qalır.
  if (wasEmpty) {
    s.chain.push({ tile: t, a: t[0], b: t[1] });
    s.firstTile = null;
  } else if (side === "L") {
    const endDouble = s.chain[0].a === s.chain[0].b;
    // solda xarici rəqəm a-dır: daşın daxili tərəfi chain[0].a-ya bitişir (b)
    const o = orient(t, s.chain[0].a);
    s.chain.unshift({ tile: t, a: o.b, b: o.a });
    if (s.spin) s.spin.idx += 1;
    else if (s.mode === "365" && endDouble) s.spin = { idx: 1, up: [], down: [] };
  } else if (side === "R") {
    const last = s.chain.length - 1;
    const endDouble = s.chain[last].a === s.chain[last].b;
    s.chain.push(orient(t, s.chain[last].b));
    if (s.mode === "365" && !s.spin && endDouble) s.spin = { idx: last, up: [], down: [] };
  } else {
    const arm = side === "U" ? s.spin!.up : s.spin!.down;
    const inner = arm.length ? arm[arm.length - 1].b : s.chain[s.spin!.idx].a;
    arm.push(orient(t, inner));
  }
  s.passes = 0;
  s.lastScore = null;

  // 365: hər hamlədən sonra uclar cəmi 5-ə bölünürsə, cəm qədər xal.
  if (s.mode === "365") {
    const sum = endsSum(s);
    if (sum > 0 && sum % 5 === 0) {
      addScore(s, s.teams[p], sum, "play");
      if (sum >= 35 && !s.matchOver) {
        // birdəfəyə 35+ xal: hədəfi gözləmədən oyun bitir
        s.matchOver = true;
        s.matchWinner = s.teams[p];
        s.instant = true;
        s.over = true;
      } else if (sum >= 35) s.instant = true;
    }
  }

  if (!s.matchOver && s.hands[p].length === 0) {
    s.over = true;
    s.winner = p;
    const others = s.hands.reduce((a, h, i) => (s.teams[i] === s.teams[p] ? a : a + handPips(h)), 0);
    if (s.mode === "101") {
      if (others > 0) addScore(s, s.teams[p], others, "round");
    } else {
      // 365: rəqiblərin əlindəki cəm, yalnız komanda xalı 300-dən az olanda
      bonus365(s, s.teams[p], others, "round");
    }
  } else if (s.hands[p].length === 0) {
    s.winner = p;
  }
  if (!s.over) nextTurn(s);
  return { ok: true, s };
}

export function draw(s0: State, p: number): Result {
  if (s0.over) return bad("over");
  if (p !== s0.turn) return bad("not_your_turn");
  if (s0.stock.length === 0) return bad("stock_empty");
  // Gediş olsa da çəkmək olar (istifadəçi təsdiqlədi, paket-IZ). Növbə oyunçuda qalır.
  const s = clone(s0);
  const k = drawChunk(s);
  for (let i = 0; i < k; i++) s.hands[p].push(s.stock.shift()!);
  return { ok: true, s };
}

export function pass(s0: State, p: number): Result {
  if (s0.over) return bad("over");
  if (p !== s0.turn) return bad("not_your_turn");
  if (hasMove(s0, p)) return bad("has_move");
  if (s0.stock.length > 0) return bad("must_draw");
  const s = clone(s0);
  s.passes += 1;
  if (s.passes >= s.n) {
    s.over = true;
    s.blocked = true;
    s.winner = null;
    // blok: komandaların əlində qalan daş cəmi; az olan qalib. Bərabərlikdə xal yoxdur.
    const totals = new Array(s.teamCount).fill(0);
    s.hands.forEach((h, i) => { totals[s.teams[i]] += handPips(h); });
    const min = Math.min(...totals);
    const winners = totals.map((v, i) => (v === min ? i : -1)).filter((i) => i >= 0);
    if (winners.length === 1) {
      const total = totals.reduce((a, b) => a + b, 0);
      if (s.mode === "101") {
        const opp = total - min; // 101: rəqiblərin tam cəmi (paket-JA, əvvəl fərq idi)
        if (opp > 0) addScore(s, winners[0], opp, "block");
      } else {
        bonus365(s, winners[0], total - min, "block"); // 365: rəqiblərin cəmi (300-dən az olanda)
      }
    }
  } else nextTurn(s);
  return { ok: true, s };
}

export function required(s: State): "play" | "draw" | "pass" | "over" {
  if (s.over) return "over";
  if (hasMove(s, s.turn)) return "play";
  if (s.stock.length > 0) return "draw";
  return "pass";
}
