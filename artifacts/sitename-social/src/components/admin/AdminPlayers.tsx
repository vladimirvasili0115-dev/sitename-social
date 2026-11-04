"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Coins, Crown, FileText, Gamepad2, HeartOff, Palette, Wine } from "lucide-react";
import { VerifiedMark } from "@/components/ui/VerifiedMark";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { NAME_COLORS, nameColorClass, refreshNameColors, useNameColors } from "@/components/bottle/nameColors";
import { GamePanel } from "@/components/admin/AdminUsers";
import { fetchPlayers, gameFlags, gameGrant, giftAllowGet, giftAllowSet, grantCoins, grantHearts, pageAllowGet, pageAllowSet, setNameColor, type GameFlags, type GiftAllow, type PageAllow, type PlayerRow } from "@/lib/adminSync";
import { initialsAvatar } from "@/lib/avatar";
import { userHref } from "@/lib/links";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

const PAGE = 50;
const action = "inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-2.5 text-xs font-semibold text-text hover:bg-surface-2 disabled:opacity-50";
const num = (value: number) => value.toLocaleString("ru-RU");
type Draft = { hearts: string; kisses: string; songs: string; smiles: string; price: string; influence: string };
const emptyDraft: Draft = { hearts: "", kisses: "", songs: "", smiles: "", price: "", influence: "" };

// The list the two tabs share: ordered by bonus balance, 50 at a time, name search with a short pause.
function usePlayers() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<PlayerRow[] | null>(null);
  const [more, setMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const stamp = useRef(0);
  const load = useCallback((search: string, off: number) => {
    const mine = ++stamp.current;
    setLoading(true);
    void fetchPlayers(search, off, PAGE).then((list) => {
      if (mine !== stamp.current) return;
      setLoading(false);
      setFailed(!list);
      if (!list) return off ? undefined : setRows([]);
      setMore(list.length === PAGE);
      setRows((cur) => (off && cur ? [...cur, ...list.filter((row) => !cur.some((old) => old.id === row.id))] : list));
    });
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => load(query, 0), 300);
    return () => window.clearTimeout(timer);
  }, [query, load]);
  return { query, setQuery, rows, more, failed, loading, next: () => load(query, rows?.length ?? 0) };
}

function Foot({ more, loading, next }: { more: boolean; loading: boolean; next: () => void }) {
  return more ? <button type="button" disabled={loading} onClick={next} className="mx-auto mt-4 block h-10 rounded-xl border border-border px-5 text-xs font-semibold hover:bg-surface-2 disabled:opacity-50">{loading ? "…" : "Daha çox göstər"}</button> : null;
}

// Tab "Balanslar": only the bonus balances, from the most to the least.
export function AdminBalances() {
  const { t } = useTranslation();
  const list = usePlayers();
  return (
    <>
      <SearchInput value={list.query} onChange={list.setQuery} label="Ad və ya istifadəçi adı ilə axtar" className="mb-4" />
      {list.failed ? <p role="alert" className="mb-3 rounded-xl border border-danger px-4 py-2.5 text-sm text-danger">{t("report.failed")}</p> : null}
      {list.rows === null ? null : list.rows.length ? (
        <Card className="divide-y divide-border overflow-hidden">
          {list.rows.map((row) => (
            <div key={row.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className={cn("w-9 shrink-0 text-center text-sm font-bold tabular-nums", row.rank <= 3 ? "text-[#D97706]" : "text-muted")}>{row.rank}</span>
              <Link href={userHref(row.id)} className="shrink-0"><img src={row.avatar || initialsAvatar(row.name || "?")} alt="" className="h-9 w-9 rounded-full object-cover" /></Link>
              <Link href={userHref(row.id)} className="min-w-0 flex-1 truncate text-sm font-semibold hover:underline">{row.name || "—"}<VerifiedMark userId={row.id} size={13} /></Link>
              <span className="shrink-0 text-sm font-bold tabular-nums text-[#F4511E]">❤️ {num(row.hearts)}</span>
            </div>
          ))}
        </Card>
      ) : <Card className="p-8 text-center text-sm text-muted">{t("friends.noResults")}</Card>}
      <Foot more={list.more} loading={list.loading} next={list.next} />
    </>
  );
}

// Tab "Oyunçular": place, bonus balance and ratings of every player, with the game controls under each one.
export function AdminPlayers({ owner }: { owner: boolean }) {
  const { t } = useTranslation();
  const list = usePlayers();
  const nameColors = useNameColors();
  const [flags, setFlags] = useState<Record<string, GameFlags>>({});
  const [allowed, setAllowed] = useState<GiftAllow>({});
  const [pageOk, setPageOk] = useState<PageAllow>({});
  const [open, setOpen] = useState<string | null>(null);
  const [panel, setPanel] = useState<"game" | "color" | "coins" | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [bad, setBad] = useState(false);
  const [bonus, setBonus] = useState<Record<string, Draft>>({});
  const [note, setNote] = useState<{ id: string; ok: boolean; max?: boolean } | null>(null);
  const [coins, setCoins] = useState("1");
  const loadFlags = useCallback((ids: string[]) => {
    if (!ids.length) return;
    void gameFlags(ids).then((value) => { if (value && typeof value === "object") setFlags((cur) => ({ ...cur, ...value })); });
    void giftAllowGet(ids).then((value) => { if (value && typeof value === "object") setAllowed((cur) => ({ ...cur, ...Object.fromEntries(ids.map((id) => [id, {}])), ...value })); });
    void pageAllowGet(ids).then((value) => { if (value && typeof value === "object") setPageOk((cur) => ({ ...cur, ...Object.fromEntries(ids.map((id) => [id, false])), ...value })); });
  }, []);
  // Ratings of the rows that are on screen; rows already loaded are not asked again.
  useEffect(() => {
    const fresh = (list.rows ?? []).map((row) => row.id).filter((id) => !flags[id]);
    if (fresh.length) loadFlags(fresh);
  }, [list.rows, flags, loadFlags]);
  async function run(id: string, work: () => Promise<boolean>) {
    setBusy(id);
    setBad(false);
    const done = await work();
    setBusy(null);
    if (!done) setBad(true);
    loadFlags([id]);
  }
  async function giveBonus(id: string) {
    const draft = bonus[id] ?? emptyDraft;
    const v = (key: keyof Draft) => Math.trunc(Number(draft[key]) || 0);
    const hearts = v("hearts"), kisses = v("kisses"), songs = v("songs"), smiles = v("smiles"), price = v("price"), influence = v("influence");
    if (!hearts && !kisses && !songs && !smiles && !price && !influence) return;
    if ([hearts, kisses, songs, smiles, price, influence].some((value) => Math.abs(value) > 100000000)) return setNote({ id, ok: false, max: true });
    setBusy(id);
    const results = await Promise.all([hearts ? grantHearts(id, hearts) : 1, kisses ? gameGrant(id, "kisses", kisses) : 1, songs ? gameGrant(id, "dj", songs) : 1, smiles ? gameGrant(id, "smiles", smiles) : 1, price ? gameGrant(id, "price", price) : 1, influence ? gameGrant(id, "influence", influence) : 1]);
    setBusy(null);
    const ok = results.every((value) => value !== null);
    setNote({ id, ok });
    if (ok) setBonus((cur) => ({ ...cur, [id]: emptyDraft }));
    loadFlags([id]);
  }
  function giveCoins(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const value = Math.round((Number(coins.replace(",", ".")) || 0) * 100);
    if (!value) return;
    void run(id, async () => (await grantCoins(id, value)) !== null);
  }
  const stats = [["kisses", "💋", "#DB3100"], ["songs", "🎵", "#B45D8C"], ["smiles", "😊", "#FC8300"], ["price", "💘", "#D85723"], ["influence", "💕", "#AD1700"]] as const;
  return (
    <>
      <SearchInput value={list.query} onChange={list.setQuery} label="Ad və ya istifadəçi adı ilə axtar" className="mb-4" />
      {list.failed || bad ? <p role="alert" className="mb-3 rounded-xl border border-danger px-4 py-2.5 text-sm text-danger">{t("report.failed")}</p> : null}
      {list.rows === null ? null : list.rows.length ? (
        <ul className="space-y-3">
          {list.rows.map((row) => {
            const flag = flags[row.id];
            const locked = busy === row.id;
            const isOpen = open === row.id;
            return (
              <li key={row.id}>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <span className={cn("w-8 shrink-0 text-center text-sm font-bold tabular-nums", row.rank <= 3 ? "text-[#D97706]" : "text-muted")}>{row.rank}</span>
                    <Link href={userHref(row.id)} className="shrink-0"><img src={row.avatar || initialsAvatar(row.name || "?")} alt="" className="h-11 w-11 rounded-full object-cover" /></Link>
                    <div className="min-w-0 flex-1">
                      <Link href={userHref(row.id)} className="block truncate text-sm font-semibold hover:underline"><span className={nameColorClass(nameColors[row.id])}>{row.name || "—"}</span><VerifiedMark userId={row.id} size={14} /></Link>
                      <p className="truncate text-xs text-muted">@{row.handle}</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-[#F4511E]">❤️ {num(flag?.hearts ?? row.hearts)}</span>
                  </div>
                  <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold tabular-nums">
                    {stats.map(([key, icon, color]) => <span key={key} style={{ color }}>{icon} {num(flag?.[key] ?? 0)}</span>)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button disabled={locked} onClick={() => { setOpen(isOpen ? null : row.id); setPanel(null); setNote(null); }} aria-expanded={isOpen} className={cn(action, isOpen ? "border-accent text-accent" : "")}><Gamepad2 size={14} />İdarə et</button>
                    <button disabled={locked} onClick={() => void run(row.id, async () => (await gameGrant(row.id, "vip", flag?.vip ? 0 : 3650)) !== null)} className={cn(action, flag?.vip ? "border-[#D97706] text-[#D97706]" : "")}><Crown size={14} />{t(flag?.vip ? "admin.vipOff" : "admin.vipOn")}</button>
                  </div>
                  {isOpen ? (
                    <div className="mt-3 border-t border-border pt-3">
                      <form onSubmit={(event) => { event.preventDefault(); void giveBonus(row.id); }} className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-2/60 px-2.5 py-2">
                        <span className="text-xs font-semibold">{t("admin.bonus")}</span>
                        {([["hearts", "❤️", "#F4511E", flag?.hearts ?? row.hearts], ["kisses", "💋", "#DB3100", flag?.kisses], ["songs", "🎵", "#B45D8C", flag?.songs], ["smiles", "😊", "#FC8300", flag?.smiles], ["price", "💘", "#D85723", flag?.price], ["influence", "💕", "#AD1700", flag?.influence]] as const).map(([key, icon, color, have]) => (
                          <label key={key} className="flex items-center gap-1" title={t(`admin.bonus_${key}` as never)}>
                            <span aria-hidden="true">{icon}</span>
                            <span className="min-w-[2.5rem] text-[11px] font-semibold tabular-nums" style={{ color }}>{num(have ?? 0)}</span>
                            <input type="number" step={1} min={-100000000} max={100000000} placeholder="+0" value={bonus[row.id]?.[key] ?? ""} onChange={(event) => setBonus((cur) => ({ ...cur, [row.id]: { ...(cur[row.id] ?? emptyDraft), [key]: event.target.value } }))} aria-label={t(`admin.bonus_${key}` as never)} className="h-8 w-20 rounded-lg border border-border bg-surface px-2 text-xs tabular-nums text-text outline-none focus:border-accent" />
                          </label>
                        ))}
                        <button type="submit" disabled={locked} className="h-8 rounded-lg bg-accent px-3 text-[11px] font-semibold text-bg disabled:opacity-50">{t("admin.bonusGive")}</button>
                        {note?.id === row.id ? <span role="status" className={cn("text-[11px] font-semibold", note.ok ? "text-accent" : "text-danger")}>{t(note.ok ? "admin.gameSaved" : note.max ? "admin.bonusMax" : "admin.vipFail")}</span> : null}
                      </form>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {owner ? <button disabled={locked} onClick={() => { setPanel(panel === "coins" ? null : "coins"); setCoins("1"); }} className={cn(action, panel === "coins" ? "border-accent text-accent" : "")}><Coins size={14} />Balans (₼)</button> : null}
                        <button disabled={locked} onClick={() => setPanel(panel === "game" ? null : "game")} aria-expanded={panel === "game"} className={cn(action, panel === "game" ? "border-accent text-accent" : "")}><Gamepad2 size={14} />VIP / VIP+ / oyun payları</button>
                        <button disabled={locked} onClick={() => setPanel(panel === "color" ? null : "color")} aria-expanded={panel === "color"} className={cn(action, panel === "color" ? "border-accent text-accent" : "")}><Palette size={14} /><span className={nameColorClass(nameColors[row.id])}>{t("admin.nameColor")}</span></button>
                        <button disabled={locked} onClick={() => void run(row.id, async () => (await gameGrant(row.id, "admire_block", flag?.block ? 0 : 1)) !== null)} className={cn(action, flag?.block ? "border-danger text-danger" : "")}><HeartOff size={14} />{t(flag?.block ? "admin.admireUnblock" : "admin.admireBlock")}</button>
                        <button disabled={locked} onClick={() => void run(row.id, async () => (await pageAllowSet(row.id, !pageOk[row.id])) !== null)} className={cn(action, pageOk[row.id] ? "border-accent text-accent" : "")}><FileText size={14} />{pageOk[row.id] ? "Səhifə icazəli (al)" : "Səhifə açmağa icazə ver"}</button>
                        <button disabled={locked} onClick={() => void run(row.id, async () => (await giftAllowSet(row.id, "c:cherry", !allowed[row.id]?.["c:cherry"])) !== null)} className={cn(action, allowed[row.id]?.["c:cherry"] ? "border-accent text-accent" : "")}><Wine size={14} />{allowed[row.id]?.["c:cherry"] ? "Kokteyl icazəli (al)" : "Kokteyl icazə ver"}</button>
                      </div>
                      {panel === "coins" && owner ? (
                        <form onSubmit={(event) => giveCoins(event, row.id)} className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="flex h-10 items-center gap-1.5 rounded-xl bg-surface-2 px-3 text-xs font-bold"><span aria-hidden="true">₼</span>Balans (₼)</span>
                          <input type="number" value={coins} onChange={(event) => setCoins(event.target.value)} min={-1000000} max={1000000} step={0.01} aria-label={t("admin.coinsAmount")} className="h-10 w-32 rounded-xl border border-border bg-surface-2 px-3 text-sm tabular-nums text-text outline-none focus:border-accent" />
                          <button type="submit" className="h-10 rounded-xl bg-accent px-4 text-xs font-semibold text-bg">{t("admin.coinsApply")}</button>
                          <p className="basis-full text-[11px] text-muted">Məbləği manatla yaz: müsbət rəqəm balansı artırır, mənfi azaldır (məsələn 5 və ya 2.50).</p>
                        </form>
                      ) : null}
                      {panel === "game" ? <GamePanel id={row.id} /> : null}
                      {panel === "color" ? (
                        <div className="mt-3 rounded-xl border border-border bg-surface-2/40 p-3">
                          <p className="text-xs font-semibold">{t("admin.nameColor")}: <span className={cn("text-sm", nameColorClass(nameColors[row.id]))}>{row.name || "—"}</span></p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {NAME_COLORS.map((item) => <button key={item.id} type="button" disabled={locked} title={item.id} aria-label={item.id} aria-pressed={nameColors[row.id] === item.id} onClick={() => void run(row.id, async () => { const done = (await setNameColor(row.id, item.id)) !== null; refreshNameColors(); return done; })} className={cn("h-8 w-8 rounded-full border-2 disabled:opacity-50", nameColors[row.id] === item.id ? "border-accent ring-2 ring-accent" : "border-border")} style={{ background: item.swatch }} />)}
                            <button type="button" disabled={locked} onClick={() => void run(row.id, async () => { const done = (await setNameColor(row.id, "")) !== null; refreshNameColors(); return done; })} className="h-8 rounded-full border border-border px-3 text-[11px] font-semibold text-muted hover:text-text disabled:opacity-50">{t("admin.nameColorNone")}</button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      ) : <Card className="p-8 text-center text-sm text-muted">{t("friends.noResults")}</Card>}
      <Foot more={list.more} loading={list.loading} next={list.next} />
    </>
  );
}
