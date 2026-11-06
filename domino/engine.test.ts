import * as E from "./engine";

declare const process: { exit(code: number): never };

let fails = 0;
function ok(cond: boolean, msg: string) {
  if (!cond) { fails++; console.log("XƏTA:", msg); }
}
const key = (t: E.Tile) => `${Math.min(t[0], t[1])}-${Math.max(t[0], t[1])}`;
const P = (t: E.Tile, a: number, b: number): E.Placed => ({ tile: t, a, b });

function base(n: number, mode: E.Mode, over: Partial<E.State>): E.State {
  const s = E.newMatch(n, mode, E.mulberry32(1));
  return { ...s, ...over };
}

// 1) Paylama və başlanğıc
for (const mode of ["101", "365"] as E.Mode[]) {
  for (let n = 2; n <= 4; n++) {
    for (let seed = 1; seed <= 300; seed++) {
      const s = E.newMatch(n, mode, E.mulberry32(seed));
      ok(s.hands.every((h) => h.length === 7), `${n} nəfər: hər kəsdə 7 daş`);
      ok(s.stock.length === 28 - n * 7, `${n} nəfər: bazar ${28 - n * 7}`);
      const all = [...s.hands.flat(), ...s.stock].map(key);
      ok(new Set(all).size === 28, "28 fərqli daş");
      const ft = s.firstTile!;
      ok(s.hands[s.starter].some((t) => t[0] === ft[0] && t[1] === ft[1]), "başlayanda başlanğıc daş var");
      if (mode === "365") {
        const holder = s.hands.findIndex((h) => h.some((t) => key(t) === "2-3"));
        if (holder >= 0) ok(key(ft) === "2-3" && holder === s.starter, "365: 3-2 olan başlayır");
        else ok(E.isDouble(ft), "3-2 yoxdursa qoşa");
      } else ok(E.isDouble(ft), "101: qoşa ilə başlanır");
    }
  }
}
// qoşa sırası: 1-1 olanda həmişə o başlayır
for (let seed = 1; seed <= 300; seed++) {
  const s = E.newMatch(4, "101", E.mulberry32(seed));
  const holder = s.hands.findIndex((h) => h.some((t) => key(t) === "1-1"));
  if (holder >= 0) ok(s.starter === holder && key(s.firstTile!) === "1-1", "1-1 olan başlayır");
}
ok(E.newMatch(4, "101", E.mulberry32(1)).stock.length === 0, "4 nəfərdə bazar yoxdur");
ok(E.newMatch(3, "101", E.mulberry32(1)).stock.length === 7, "3 nəfərdə bazar 7");

// 2) Komandalar və hədəf
{
  const s4 = E.newMatch(4, "101", E.mulberry32(1));
  ok(JSON.stringify(s4.teams) === "[0,1,0,1]" && s4.teamCount === 2, "4 nəfər 2x2");
  const s4b = E.newMatch(4, "101", E.mulberry32(1), { teams: false });
  ok(s4b.teamCount === 4, "komandasız 4 nəfər");
  const s3 = E.newMatch(3, "365", E.mulberry32(1), { target: 255 });
  ok(s3.teamCount === 3 && s3.target === 255, "3 nəfər təkbətək, hədəf 255");
  let threw = false;
  try { E.newMatch(2, "365", E.mulberry32(1), { target: 300 }); } catch { threw = true; }
  ok(threw, "yanlış hədəf rədd");
}

// 3) Bazar qaydaları
{
  const mk = (mode: E.Mode): E.State =>
    base(3, mode, {
      hands: [[[0, 1]], [[2, 3]], [[4, 5]]],
      stock: [[6, 6], [5, 5], [3, 3], [0, 0], [1, 1], [2, 2], [4, 4]],
      chain: [P([6, 6], 6, 6)], spin: null, turn: 0, passes: 0, over: false, winner: null, blocked: false, firstTile: null,
    });
  for (const mode of ["101", "365"] as E.Mode[]) {
    const s = mk(mode);
    ok(!E.hasMove(s, 0), "gedişi yoxdur");
    ok(E.required(s) === "draw", "çəkməlidir");
    ok(!E.pass(s, 0).ok, "bazar doludursa pas olmaz");
    const r = E.draw(s, 0);
    ok(r.ok, "çəkdi");
    if (r.ok) ok(r.s.hands[0].length === 1 + (mode === "101" ? 2 : 1), `${mode} çəkmə sayı`);
  }
  const s2 = mk("101"); s2.hands[0] = [[6, 1]];
  ok(!E.draw(s2, 0).ok, "əlində gediş varkən çəkmək olmaz");
  const s3 = mk("101"); s3.stock = [[5, 5]];
  const r3 = E.draw(s3, 0);
  ok(r3.ok && r3.s.hands[0].length === 2, "bazarda 1 qalanda 1 çəkir");
  const s4 = mk("101"); s4.stock = [];
  ok(E.required(s4) === "pass", "pas");
  const r4 = E.pass(s4, 0);
  ok(r4.ok && r4.s.turn === 1, "pas növbəni keçir");
}

// 4) 101 xal: əl bitəndə rəqiblərin qalan daşları qalibin komandasına
{
  const s = base(4, "101", {
    hands: [[[1, 2]], [[6, 6], [5, 4]], [[0, 1], [3, 3]], [[2, 2]]],
    stock: [], chain: [P([2, 3], 2, 3)], spin: null, turn: 0, passes: 0,
    over: false, winner: null, blocked: false, firstTile: null,
  });
  // 1-2 → sol uc 2 uyğun
  const r = E.play(s, 0, 0, "L");
  ok(r.ok, "1-2 qoyuldu");
  if (r.ok) {
    ok(r.s.over && r.s.winner === 0, "raund bitdi");
    // rəqib komanda = oyunçu 1 və 3: (12+9) + 4 = 25
    ok(r.s.scores[0] === 25 && r.s.scores[1] === 0, `komanda 0 xalı 25 (alındı ${r.s.scores[0]})`);
    ok(!r.s.matchOver, "hələ 101 deyil");
  }
  // hədəfə çatma
  const s2 = { ...s, scores: [90, 0] };
  const r2 = E.play(s2, 0, 0, "L");
  ok(r2.ok && r2.s.matchOver && r2.s.matchWinner === 0 && r2.s.scores[0] === 115, "101-ə çatan qalib");
  // növbəti raund xalları saxlayır
  if (r.ok) {
    const nx = E.nextRound(r.s, E.mulberry32(9));
    ok(nx.scores[0] === 25 && nx.roundNo === 2 && !nx.over, "növbəti raund, xallar qalır");
  }
}

// 5) 101 blok: az qalan komanda qalib, xal = fərq
{
  const s = base(2, "101", {
    hands: [[[0, 1]], [[5, 6]]], stock: [], chain: [P([3, 3], 3, 3)], spin: null,
    turn: 0, passes: 0, over: false, winner: null, blocked: false, firstTile: null,
  });
  const a = E.pass(s, 0);
  ok(a.ok && !a.s.over, "1 pas oyun bitmir");
  if (a.ok) {
    const b = E.pass(a.s, 1);
    ok(b.ok && b.s.blocked && b.s.over, "blok");
    if (b.ok) ok(b.s.scores[0] === 10 && b.s.scores[1] === 0, `blokda fərq 11-1=10 (alındı ${b.s.scores[0]})`);
  }
}

// 6) 365: 3-2 başlayanda 5 xal
{
  let found = 0;
  for (let seed = 1; seed <= 200 && !found; seed++) {
    const s = E.newMatch(2, "365", E.mulberry32(seed));
    if (key(s.firstTile!) !== "2-3") continue;
    found++;
    const idx = s.hands[s.starter].findIndex((t) => key(t) === "2-3");
    const r = E.play(s, s.starter, idx, "R");
    ok(r.ok, "3-2 qoyuldu");
    if (r.ok) ok(r.s.scores[s.teams[s.starter]] === 5 && r.s.lastScore?.pts === 5, "3-2 → 5 xal");
  }
  ok(found === 1, "3-2 ilə başlayan paylama tapıldı");
}

// 7) 365: spinner (4 tərəf) və xal hesabı
{
  let s = base(2, "365", {
    hands: [[[6, 6], [6, 1], [6, 4], [0, 0]], [[1, 1], [0, 2], [3, 3], [5, 5]]],
    stock: [], chain: [], spin: null, turn: 0, firstTile: [6, 6], passes: 0, over: false, winner: null, blocked: false,
    scores: [0, 0],
  });
  let r = E.play(s, 0, 0, "R"); // 6-6 tək daş: cəmi 12 (5-ə bölünmür); yanına daş gəlməyib, hələ spinner deyil
  ok(r.ok && r.s.scores[0] === 0 && !r.s.spin, "6-6 qoyuldu, xal yoxdur, hələ spinner deyil");
  if (!r.ok) throw new Error("x");
  s = { ...r.s, turn: 0 };
  ok(!E.canPlayTile(s, [6, 4], "U"), "spinner açılmayıb: yuxarı olmaz");
  r = E.play(s, 0, 1, "R"); // 6-4: 6-6-ya ilk daş → spinner. uclar: sol 6-6(12) + sağ 4 = 16
  ok(r.ok && r.s.scores[0] === 0 && r.s.spin?.idx === 0, "16 xal deyil, 6-6 spinner oldu");
  if (!r.ok) throw new Error("x");
  s = { ...r.s, turn: 0 };
  ok(!E.canPlayTile(s, [6, 1], "U"), "hələ də bir tərəf boş: yuxarı olmaz");
  r = E.play(s, 0, 0, "L"); // 6-1 sola: yuxarı/aşağı boşdur, sayılmır → sol 1 + sağ 4 = 5
  ok(r.ok, "6-1 sola");
  if (!r.ok) throw new Error("x");
  ok(E.endsSum(r.s) === 5 && r.s.scores[0] === 5, `2 tərəf: uclar cəmi 5, 5 xal (alındı ${E.endsSum(r.s)} / ${r.s.scores[0]})`);
  s = { ...r.s, hands: [[[6, 4], [6, 0], [0, 0]], r.s.hands[1]], turn: 0 };
  ok(E.canPlayTile(s, [6, 4], "U") && E.canPlayTile(s, [6, 4], "D"), "indi yuxarı/aşağı açıqdır");
  const r2 = E.play(s, 0, 0, "U"); // 3 tərəf: sol 1 + sağ 4 + yuxarı 4 = 9 → xal yox
  ok(r2.ok && E.endsSum(r2.s) === 9 && r2.s.scores[0] === 5, `3 tərəf: cəmi 9, xal yoxdur (alındı ${r2.ok ? E.endsSum(r2.s) : "?"})`);
  if (!r2.ok) throw new Error("x");
  const r3 = E.play({ ...r2.s, turn: 0 }, 0, 0, "D"); // 4 tərəf: sol 1 + sağ 4 + yuxarı 4 + aşağı 0 = 9
  ok(r3.ok && E.endsSum(r3.s) === 9, `4 tərəf: cəmi 9 (alındı ${r3.ok ? E.endsSum(r3.s) : "?"})`);
}

// 7b) 365: iki ucda qoşa — spinner ilk yanına daş qoyulan qoşa olur, digəri adi qalır
{
  let s = base(2, "365", {
    hands: [[[2, 2], [3, 1], [2, 5]], [[3, 3], [1, 4]]],
    stock: [], chain: [P([3, 2], 3, 2)], spin: null, turn: 0, firstTile: null, passes: 0, over: false, winner: null, blocked: false,
    scores: [0, 0],
  });
  let r = E.play(s, 0, 0, "R"); // 2-2 sağa (əvvəl oynanan qoşa)
  ok(r.ok && !r.s.spin, "2-2 qoyuldu, yanına daş gəlməyib: spinner yoxdur");
  if (!r.ok) throw new Error("x");
  r = E.play({ ...r.s, turn: 1 }, 1, 0, "L"); // 3-3 sola: uclar 3-3 (6) + 2-2 (4) = 10
  ok(r.ok && !r.s.spin && r.s.scores[1] === 10, `iki ucda qoşa, spinner yoxdur, 10 xal (alındı ${r.ok ? r.s.scores[1] : "?"})`);
  if (!r.ok) throw new Error("x");
  r = E.play({ ...r.s, turn: 0 }, 0, 0, "L"); // 3-1 → 3-3-ün yanına: 3-3 spinner olur
  ok(r.ok && r.s.spin?.idx === 1 && r.s.chain[1].tile[0] === 3 && r.s.chain[1].tile[1] === 3, "spinner 3-3 oldu (əvvəl oynanan 2-2 yox)");
  if (!r.ok) throw new Error("x");
  s = { ...r.s, turn: 0 };
  ok(E.canPlayTile(s, [3, 5], "U") && E.canPlayTile(s, [3, 5], "D"), "3-3-ün yuxarı/aşağısı açıqdır");
  r = E.play(s, 0, 0, "R"); // 2-5 → 2-2-nin yanına: 2-2 adi qalır
  ok(r.ok && r.s.spin?.idx === 1, "2-2 spinner olmadı");
}

// 8) 365: birdəfəyə 35 xal → oyun dərhal bitir
{
  const chain = [P([6, 6], 6, 6), P([3, 3], 3, 3), P([3, 6], 3, 6)];
  const s = base(2, "365", {
    hands: [[[6, 6], [0, 1]], [[1, 1]]], stock: [], chain,
    spin: { idx: 1, up: [P([3, 6], 3, 6)], down: [P([3, 5], 3, 5)] },
    turn: 0, firstTile: null, passes: 0, over: false, winner: null, blocked: false, scores: [0, 0],
  });
  ok(E.endsSum(s) === 29, `əvvəl 29 (alındı ${E.endsSum(s)})`);
  const r = E.play(s, 0, 0, "R"); // sağ: 6-6 qoşa → 12+12+6+5 = 35
  ok(r.ok && r.s.matchOver && r.s.instant && r.s.matchWinner === 0 && r.s.scores[0] === 35, "35 → dərhal qalib");
}

// 9) 365: hədəf (255) ayarı
{
  const chain = [P([2, 3], 2, 3)];
  const s = base(2, "365", {
    hands: [[[3, 2], [4, 4]], [[1, 1]]], stock: [], chain, spin: null, target: 255,
    turn: 0, firstTile: null, passes: 0, over: false, winner: null, blocked: false, scores: [250, 0],
  });
  // sol uc 2, sağ uc 3 → 2-0? sağa 3-2 qoy: sol 2, sağ 2 = 4 xal yox; sola 3-2: 3(a=3) + 3 = 6 yox.
  // sağa [3,2]: uc 2 → sol 2 + sağ 2 = 4 → xal yox. Aşağıdakı yoxlama xal olan hamlə üçün:
  const s2 = { ...s, chain: [P([1, 4], 1, 4)], hands: [[[4, 1], [4, 4]], [[1, 1]]] as E.Tile[][], scores: [250, 0] };
  const r = E.play(s2, 0, 0, "R"); // sağ 4, sonra [4,1]: yeni sağ uc 1; sol 1 → cəm 2 → xal yox
  ok(r.ok, "hamlə qəbul edildi");
}

// 9b) 365: raund sonu bonusu (300-dən az olanda, həmişə yuxarı 5-ə yuvarlaq)
{
  const rr = [[0, 0], [1, 5], [4, 5], [5, 5], [6, 10], [9, 10], [10, 10], [11, 15], [14, 15], [22, 25], [23, 25]];
  ok(rr.every(([x, y]) => E.round5(x) === y), `yuxarı 5-ə yuvarlaq (${rr.map(([x]) => `${x}→${E.round5(x)}`).join(" ")})`);
  // 0 oyunçusu son daşı qoyur: zəncir [1-1], əlində [1-2] → uclar 1+2 = 3 (xal yox). Rəqibdə 6-4 və 3-1 = 14 → 15.
  const mk = (sc: number[]) => base(2, "365", {
    hands: [[[1, 2]], [[6, 4], [3, 1]]], stock: [], chain: [P([1, 1], 1, 1)], spin: { idx: 0, up: [], down: [] },
    turn: 0, firstTile: null, passes: 0, over: false, winner: null, blocked: false, scores: sc,
  });
  let r = E.play(mk([180, 0]), 0, 0, "R");
  ok(r.ok && r.s.over && r.s.scores[0] === 195 && r.s.lastScore?.kind === "round", `365 əl boşaldı: 180 → 195 (alındı ${r.ok && r.s.scores[0]})`);
  r = E.play(mk([305, 0]), 0, 0, "R");
  ok(r.ok && r.s.over && r.s.scores[0] === 305, "365: 300-dən sonra bonus yazılmır");
  r = E.play(mk([299, 0]), 0, 0, "R");
  ok(r.ok && r.s.scores[0] === 314, "365: 299-da bonus yazılır (300-ü keçir)");
  // bonus hədəfə çatdırır → matç bitir
  const s255 = { ...mk([245, 0]), target: 255 };
  r = E.play(s255, 0, 0, "R");
  ok(r.ok && r.s.matchOver && r.s.matchWinner === 0 && r.s.scores[0] === 260, "365: bonus hədəfə çatdırır");
  // blok: 0-da 1 xal, 1-də 6-6+5-5 = 22 → 0-a 25 yazılır (rəqiblərin cəmi, yuxarı yuvarlaq)
  const blk = (sc: number[]) => base(2, "365", {
    hands: [[[0, 1]], [[6, 6], [5, 5]]], stock: [], chain: [P([2, 2], 2, 2), P([2, 3], 2, 3)], spin: { idx: 0, up: [], down: [] },
    turn: 0, firstTile: null, passes: 1, over: false, winner: null, blocked: false, scores: sc,
  });
  r = E.pass(blk([100, 0]), 0);
  ok(r.ok && r.s.blocked && r.s.scores[0] === 125 && r.s.lastScore?.kind === "block", `365 blok: 100 → 125 (alındı ${r.ok && r.s.scores[0]})`);
  r = E.pass(blk([300, 0]), 0);
  ok(r.ok && r.s.blocked && r.s.scores[0] === 300, "365 blok: 300-də bonus yoxdur");
  // blok bərabərlik: xal yoxdur
  const tie = base(2, "365", {
    hands: [[[0, 4]], [[1, 3]]], stock: [], chain: [P([2, 2], 2, 2), P([2, 5], 2, 5)], spin: { idx: 0, up: [], down: [] },
    turn: 0, firstTile: null, passes: 1, over: false, winner: null, blocked: false, scores: [10, 10],
  });
  r = E.pass(tie, 0);
  ok(r.ok && r.s.blocked && r.s.scores[0] === 10 && r.s.scores[1] === 10, "365 blok bərabərlik: xal yox");
}

// 10) Tam təsadüfi matçlar
let matches = 0, instants = 0, totalRounds = 0;
for (const mode of ["101", "365"] as E.Mode[]) {
  for (let n = 2; n <= 4; n++) {
    for (let seed = 1; seed <= 600; seed++) {
      const rng = E.mulberry32(seed * 11 + n);
      const target = mode === "101" ? 101 : [365, 355, 255][seed % 3];
      let s = E.newMatch(n, mode, rng, { target });
      let rounds = 0, steps = 0;
      while (true) {
        if (++steps > 20000) { ok(false, `sonsuz matç ${mode} n=${n} seed=${seed}`); break; }
        if (s.over) {
          rounds++;
          if (s.matchOver) break;
          if (rounds > 400) { ok(false, `çox raund ${mode} n=${n} seed=${seed}`); break; }
          s = E.nextRound(s, rng);
          continue;
        }
        const req = E.required(s);
        let r: E.Result;
        if (req === "play") {
          const m = E.legalMoves(s, s.turn);
          const pick = m[Math.floor(rng() * m.length)];
          r = E.play(s, s.turn, pick.tileIdx, pick.side);
        } else if (req === "draw") r = E.draw(s, s.turn);
        else r = E.pass(s, s.turn);
        if (!r.ok) { ok(false, `hamlə rədd: ${r.err} (${mode} n=${n} seed=${seed})`); break; }
        s = r.s;
        const onBoard = s.chain.length + (s.spin ? s.spin.up.length + s.spin.down.length : 0);
        const total = s.hands.flat().length + s.stock.length + onBoard;
        if (total !== 28) { ok(false, "daş itdi"); break; }
        if (s.scores.some((x) => x < 0)) { ok(false, "mənfi xal"); break; }
      }
      matches++; totalRounds += rounds;
      ok(s.matchOver && s.matchWinner !== null, "matçın qalibi var");
      if (s.matchOver && s.matchWinner !== null) {
        ok(s.scores[s.matchWinner] >= target || s.instant, "qalib hədəfə çatıb və ya 35 yazıb");
      }
      if (s.instant) instants++;
      for (let i = 1; i < s.chain.length; i++) {
        if (s.chain[i - 1].b !== s.chain[i].a) { ok(false, "zəncir qırıldı"); break; }
      }
      if (n === 4) ok(s.stock.length === 0, "4 nəfərdə bazar boş");
    }
  }
}
console.log(`Matçlar: ${matches}, raundlar: ${totalRounds}, 35 ilə dərhal bitən: ${instants}`);
console.log(fails === 0 ? "BÜTÜN TESTLƏR KEÇDİ" : `${fails} XƏTA`);
process.exit(fails ? 1 : 0);
