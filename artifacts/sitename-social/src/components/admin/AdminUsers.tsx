"use client";
import { VerifiedMark } from "@/components/ui/VerifiedMark";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Award, BadgeCheck, Ban, ChevronDown, Coins, Crown, Gamepad2, Heart, ShieldCheck, ShieldOff, Trash2, Undo2 } from "lucide-react";
import { useSyncExternalStore } from "react";
import { refreshVerified, verifiedStore } from "@/lib/verifiedSync";
import { banUser, deleteUser, fetchAdminUsers, fetchUserDetail, grantCoins, grantHearts, setModerator, setVerified, vipAll, vipCount, gameState, gameGrant, gameFlags, type GameFlags, type GameState, type AdminUser, type UserDetail } from "@/lib/adminSync";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { initialsAvatar } from "@/lib/avatar";
import { formatDay } from "@/lib/datetime";
import { userHref } from "@/lib/links";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { cn } from "@/lib/utils";

const chip = "rounded-full border px-2 py-0.5 text-[10px] font-semibold";
const action = "inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-2.5 text-xs font-semibold text-text hover:bg-surface-2 disabled:opacity-50";
const danger = "inline-flex h-9 items-center gap-1.5 rounded-xl border border-danger px-2.5 text-xs font-semibold disabled:opacity-50";
const ONLINE_WINDOW = 3 * 60_000;
const durations: { days: number; label: TranslationKey }[] = [{ days: 1, label: "admin.ban1" }, { days: 7, label: "admin.ban7" }, { days: 30, label: "admin.ban30" }, { days: 0, label: "admin.banForever" }];
const counters: { key: "posts" | "comments" | "photos" | "videos" | "tracks" | "groups" | "friends" | "reportsTotal"; label: TranslationKey }[] = [
  { key: "posts", label: "saved.tabPosts" }, { key: "comments", label: "post.comments" }, { key: "photos", label: "nav.photos" }, { key: "videos", label: "nav.videos" },
  { key: "tracks", label: "nav.music" }, { key: "groups", label: "nav.groups" }, { key: "friends", label: "nav.friends" }, { key: "reportsTotal", label: "admin.tabReports" },
];

export function AdminUsers({ owner }: { owner: boolean }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [coinsFor, setCoinsFor] = useState<string | null>(null);
  const [gameFor, setGameFor] = useState<string | null>(null);
  const [grantKind, setGrantKind] = useState<"coins" | "hearts">("coins");
  const [amount, setAmount] = useState("100");
  const [banFor, setBanFor] = useState<string | null>(null);
  const [banDays, setBanDays] = useState(7);
  const [reason, setReason] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const verified = useSyncExternalStore(verifiedStore.subscribe, verifiedStore.get, verifiedStore.getServer);
  // VIP and TOP of every listed player, so each row shows "VIP et / VIP-i qaytar" and "TOP-a sal / TOP-dan çıxar".
  const [flags, setFlags] = useState<Record<string, GameFlags>>({});
  const loadFlags = useCallback((ids: string[]) => { if (ids.length) void gameFlags(ids).then((value) => { if (value && typeof value === "object") setFlags((cur) => ({ ...cur, ...value })); }); }, []);
  const load = useCallback((search: string) => void fetchAdminUsers(search).then((list) => {
    setUsers(list ?? []);
    setFailed(!list);
    loadFlags((list ?? []).map((user) => user.id));
  }), [loadFlags]);
  // Bonus hearts, kisses and songs for one player, typed right under the row; a negative number takes away.
  const [bonus, setBonus] = useState<Record<string, { hearts: string; kisses: string; songs: string; smiles: string }>>({});
  const [bonusNote, setBonusNote] = useState<{ id: string; ok: boolean } | null>(null);
  async function giveBonus(id: string) {
    const draft = bonus[id] ?? { hearts: "", kisses: "", songs: "", smiles: "" };
    const hearts = Math.trunc(Number(draft.hearts) || 0), kisses = Math.trunc(Number(draft.kisses) || 0), songs = Math.trunc(Number(draft.songs) || 0), smiles = Math.trunc(Number(draft.smiles) || 0);
    if (!hearts && !kisses && !songs && !smiles) return;
    setBusy(id);
    const results = await Promise.all([hearts ? grantHearts(id, hearts) : 1, kisses ? gameGrant(id, "kisses", kisses) : 1, songs ? gameGrant(id, "dj", songs) : 1, smiles ? gameGrant(id, "smiles", smiles) : 1]);
    setBusy(null);
    const ok = results.every((value) => value !== null);
    setBonusNote({ id, ok });
    if (ok) setBonus((cur) => ({ ...cur, [id]: { hearts: "", kisses: "", songs: "", smiles: "" } }));
    loadFlags([id]);
  }
  // VIP and TOP stay until they are taken back (about ten years).
  async function toggleGame(id: string, kind: "vip" | "top", on: boolean) {
    await run(id, async () => (await gameGrant(id, kind, on ? 0 : 3650)) !== null);
    loadFlags([id]);
  }
  // Search as the moderator types, with a short pause.
  useEffect(() => {
    const timer = window.setTimeout(() => load(query), 300);
    return () => window.clearTimeout(timer);
  }, [query, load]);

  async function run(id: string, work: () => Promise<boolean>) {
    setBusy(id);
    setConfirm(null);
    setFailed(false);
    const done = await work();
    setBusy(null);
    if (!done) return setFailed(true);
    load(query);
  }
  function handleBan(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    setBanFor(null);
    void run(id, () => banUser(id, banDays, reason.trim()));
  }
  function toggleDetail(id: string) {
    setDetail(null);
    if (openId === id) return setOpenId(null);
    setOpenId(id);
    void fetchUserDetail(id).then(setDetail);
  }
  function handleCoins(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const value = Math.trunc(Number(amount));
    if (!value) return;
    setCoinsFor(null);
    void run(id, async () => (await (grantKind === "hearts" ? grantHearts(id, value) : grantCoins(id, value))) !== null);
  }

  return (
    <>
      <VipAllCard />
      <SearchInput value={query} onChange={setQuery} label={t(owner ? "admin.searchUsers" : "admin.searchUsersMod")} className="mb-4" />
      {failed ? <p role="alert" className="mb-3 rounded-xl border border-danger px-4 py-2.5 text-sm text-danger">{t("report.failed")}</p> : null}
      {users === null ? null : users.length ? (
        <ul className="space-y-3">
          {users.map((user) => {
            const online = Boolean(user.lastSeen) && Date.now() - (user.lastSeen ?? 0) < ONLINE_WINDOW;
            const locked = busy === user.id;
            const asking = confirm === user.id;
            return (
              <li key={user.id}>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Link href={userHref(user.id)} className="shrink-0"><img src={user.avatar || initialsAvatar(user.name || "?")} alt="" className="h-11 w-11 rounded-full object-cover" /></Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link href={userHref(user.id)} className="truncate text-sm font-semibold hover:underline">{user.name || "—"}<VerifiedMark userId={user.id} size={14} /></Link>
                        {user.owner ? <span className={cn(chip, "border-accent text-accent")}>{t("admin.roleOwner")}</span> : user.moderator ? <span className={cn(chip, "border-accent text-accent")}>{t("admin.roleModerator")}</span> : null}
                        {user.banned ? <span className={cn(chip, "border-danger text-danger")}>{t("admin.statBanned")}</span> : null}
                        {online ? <span className={cn(chip, "border-border text-accent")}>{t("common.onlineNow")}</span> : null}
                      </div>
                      <p className="truncate text-xs text-muted">{user.email ? `${user.email} · ` : ""}@{user.handle}</p>
                      <p className="mt-0.5 text-[11px] text-muted">{t("admin.joined")}: {formatDay(user.joined)} · {t("gifts.balance")}: <span className="tabular-nums text-text">{user.balance}</span></p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {owner ? <button disabled={locked} onClick={() => { setGrantKind("coins"); setCoinsFor(coinsFor === user.id && grantKind === "coins" ? null : user.id); setAmount("100"); }} className={action}><Coins size={14} />{t("admin.coins")}</button> : null}
                    <button disabled={locked} onClick={() => void toggleGame(user.id, "vip", Boolean(flags[user.id]?.vip))} className={cn(action, flags[user.id]?.vip ? "border-[#D97706] text-[#D97706]" : "")}><Crown size={14} />{t(flags[user.id]?.vip ? "admin.vipOff" : "admin.vipOn")}</button>
                    <button disabled={locked} onClick={() => void toggleGame(user.id, "top", Boolean(flags[user.id]?.top))} className={cn(action, flags[user.id]?.top ? "border-[#CA8A04] text-[#CA8A04]" : "")}><Award size={14} />{t(flags[user.id]?.top ? "admin.topOff" : "admin.topOn")}</button>
                    <button disabled={locked} onClick={() => setGameFor(gameFor === user.id ? null : user.id)} aria-expanded={gameFor === user.id} className={action}><Gamepad2 size={14} />{t("admin.game")}</button>
                    {user.moderator ? null : user.banned
                      ? <button disabled={locked} onClick={() => void run(user.id, () => banUser(user.id, -1, ""))} className={action}><Undo2 size={14} />{t("settings.blkUnblock")}</button>
                      : <button disabled={locked} onClick={() => { setBanFor(banFor === user.id ? null : user.id); setBanDays(7); setReason(""); }} className={cn(danger, "text-danger hover:bg-surface-2")}><Ban size={14} />{t("admin.ban")}</button>}
                    {owner && verified[user.id] !== "official" ? <button disabled={locked} onClick={() => void run(user.id, async () => { const done = await setVerified(user.id, !verified[user.id]); await refreshVerified(); return done; })} className={action}><BadgeCheck size={14} style={{ color: "#3B9DF8" }} />{t(verified[user.id] ? "admin.unverify" : "admin.verify")}</button> : null}
                    {owner && !user.owner ? <button disabled={locked} onClick={() => void run(user.id, () => setModerator(user.id, !user.moderator))} className={action}>{user.moderator ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}{t(user.moderator ? "admin.removeModerator" : "admin.makeModerator")}</button> : null}
                    {user.moderator || !owner ? null : <button disabled={locked} onClick={() => (asking ? void run(user.id, () => deleteUser(user.id)) : setConfirm(user.id))} className={cn(danger, asking ? "bg-danger text-bg" : "text-danger hover:bg-surface-2")}><Trash2 size={14} />{t(asking ? "admin.confirm" : "settings.accDelete")}</button>}
                    <button onClick={() => toggleDetail(user.id)} aria-expanded={openId === user.id} className={cn(action, "ml-auto")}>{t("admin.details")}<ChevronDown size={14} className={openId === user.id ? "rotate-180" : ""} /></button>
                  </div>
                  {banFor === user.id ? (
                    <form onSubmit={(event) => handleBan(event, user.id)} className="mt-3 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {durations.filter((item) => owner || item.days > 0).map((item) => <button key={item.days} type="button" aria-pressed={banDays === item.days} onClick={() => setBanDays(item.days)} className={cn("h-9 rounded-full border px-3.5 text-xs font-semibold", banDays === item.days ? "border-danger bg-surface-2 text-danger" : "border-border text-muted hover:text-text")}>{t(item.label)}</button>)}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} aria-label={t("admin.banReason")} placeholder={t("admin.banReason")} autoComplete="off" className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-3 text-sm text-text outline-none placeholder:text-muted focus:border-accent" />
                        <button type="submit" className="h-10 rounded-xl bg-danger px-4 text-xs font-semibold text-bg">{t("admin.ban")}</button>
                      </div>
                    </form>
                  ) : null}
                  {openId === user.id ? (
                    <div className="mt-3 border-t border-border pt-3">
                      {detail ? (
                        <>
                          <dl className="grid grid-cols-4 gap-2">
                            {counters.map((item) => <div key={item.key} className="rounded-xl bg-surface-2 px-2 py-2 text-center"><dd className="text-sm font-semibold tabular-nums">{detail[item.key] ?? 0}</dd><dt className="truncate text-[10px] capitalize text-muted">{t(item.label)}</dt></div>)}
                          </dl>
                          {detail.ban ? <p className="mt-3 rounded-xl border border-danger px-3 py-2 text-xs leading-5 text-text"><span className="font-semibold text-danger">{t("admin.statBanned")}</span> · {detail.ban.until ? `${t("admin.banUntil")} ${formatDay(Date.parse(detail.ban.until))}` : t("admin.banForever")}{detail.ban.reason ? ` · ${detail.ban.reason}` : ""}</p> : null}
                          {detail.recentPosts.length ? (
                            <>
                              <h4 className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{t("admin.recentPosts")}</h4>
                              <ul className="mt-1.5 space-y-1.5">
                                {detail.recentPosts.map((post) => <li key={post.id} className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-xs">{post.image ? <img src={post.image} alt="" loading="lazy" className="h-9 w-9 shrink-0 rounded-lg object-cover" /> : null}<span className="min-w-0 flex-1 truncate text-text">{post.text || "—"}</span><span className="shrink-0 tabular-nums text-muted">{formatDay(Date.parse(post.at))}</span></li>)}
                              </ul>
                            </>
                          ) : null}
                          {detail.log.length ? (
                            <>
                              <h4 className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{t("admin.tabLog")}</h4>
                              <ul className="mt-1.5 space-y-1 text-xs text-muted">
                                {detail.log.map((entry, index) => <li key={index} className="flex gap-2"><span className="shrink-0 tabular-nums">{formatDay(Date.parse(entry.at))}</span><span className="min-w-0 break-words"><span className="text-text">{entry.admin}</span>: {entry.action}{entry.details ? ` (${entry.details})` : ""}</span></li>)}
                              </ul>
                            </>
                          ) : null}
                        </>
                      ) : <p className="text-xs text-muted">…</p>}
                    </div>
                  ) : null}
                  <form onSubmit={(event) => { event.preventDefault(); void giveBonus(user.id); }} className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-surface-2/60 px-2.5 py-2">
                    <span className="text-xs font-semibold">{t("admin.bonus")}</span>
                    {([["hearts", "❤️", "#F4511E", flags[user.id]?.hearts], ["kisses", "💋", "#DB3100", flags[user.id]?.kisses], ["songs", "🎵", "#B45D8C", flags[user.id]?.songs], ["smiles", "😊", "#FC8300", flags[user.id]?.smiles]] as const).map(([key, icon, color, have]) => (
                      <label key={key} className="flex items-center gap-1" title={t(`admin.bonus_${key}` as TranslationKey)}>
                        <span aria-hidden="true">{icon}</span>
                        <span className="min-w-[2.5rem] text-[11px] font-semibold tabular-nums" style={{ color }}>{(have ?? 0).toLocaleString("ru-RU")}</span>
                        <input type="number" step={1} placeholder="+0" value={bonus[user.id]?.[key] ?? ""} onChange={(event) => setBonus((cur) => ({ ...cur, [user.id]: { ...(cur[user.id] ?? { hearts: "", kisses: "", songs: "", smiles: "" }), [key]: event.target.value } }))} aria-label={t(`admin.bonus_${key}` as TranslationKey)} className="h-8 w-20 rounded-lg border border-border bg-surface px-2 text-xs tabular-nums text-text outline-none focus:border-accent" />
                      </label>
                    ))}
                    <button type="submit" disabled={locked} className="h-8 rounded-lg bg-accent px-3 text-[11px] font-semibold text-bg disabled:opacity-50">{t("admin.bonusGive")}</button>
                    {bonusNote?.id === user.id ? <span role="status" className={cn("text-[11px] font-semibold", bonusNote.ok ? "text-accent" : "text-danger")}>{t(bonusNote.ok ? "admin.gameSaved" : "admin.vipFail")}</span> : null}
                  </form>
                  {gameFor === user.id ? <GamePanel id={user.id} /> : null}
                  {coinsFor === user.id ? (
                    <form onSubmit={(event) => handleCoins(event, user.id)} className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold ${grantKind === "hearts" ? "bg-[#F4511E] text-white" : "bg-surface-2 text-text"}`}>{grantKind === "hearts" ? <Heart size={14} fill="currentColor" /> : <Coins size={14} />}{t(grantKind === "hearts" ? "admin.hearts" : "admin.coins")}</span>
                      <input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} min={-1000000} max={1000000} step={1} aria-label={t("admin.coinsAmount")} className="h-10 w-32 rounded-xl border border-border bg-surface-2 px-3 text-sm tabular-nums text-text outline-none focus:border-accent" />
                      <button type="submit" className="h-10 rounded-xl bg-accent px-4 text-xs font-semibold text-bg">{t("admin.coinsApply")}</button>
                      <p className="basis-full text-[11px] text-muted">{t(grantKind === "hearts" ? "admin.heartsHint" : "admin.coinsHint")}</p>
                    </form>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      ) : <Card className="p-8 text-center text-sm text-muted">{t("friends.noResults")}</Card>}
    </>
  );
}

// One click gives every player VIP for the chosen number of days (the owner and moderators can do it).
function VipAllCard() {
  const { t } = useTranslation();
  const [days, setDays] = useState(7);
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [count, setCount] = useState<{ vip: number; total: number } | null>(null);
  const loadCount = useCallback(() => void vipCount().then((value) => { if (value && typeof value === "object") setCount(value); }), []);
  useEffect(() => { loadCount(); }, [loadCount]);
  async function give() {
    if (!sure) return setSure(true);
    setSure(false);
    setBusy(true);
    const done = await vipAll(days);
    setBusy(false);
    setNote(typeof done === "number" ? { ok: true, text: t("admin.vipDone").replace("{n}", String(done)) } : { ok: false, text: t("admin.vipFail") });
    loadCount();
  }
  return (
    <Card className="mb-4 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[#D97706]"><Crown size={20} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t("admin.vipAllTitle")}</p>
          <p className="mt-0.5 text-xs leading-5 text-muted">{t("admin.vipAllText")}</p>
          {count ? <p className="mt-1 text-xs text-muted">{t("admin.vipNow").replace("{vip}", String(count.vip)).replace("{total}", String(count.total))}</p> : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {[1, 7, 30, 365].map((n) => <button key={n} type="button" aria-pressed={days === n} onClick={() => { setDays(n); setSure(false); }} className={cn("h-9 rounded-full border px-3.5 text-xs font-semibold", days === n ? "border-[#D97706] bg-surface-2 text-[#D97706]" : "border-border text-muted hover:text-text")}>{t("admin.vipDays").replace("{n}", String(n))}</button>)}
        <button type="button" disabled={busy} onClick={() => void give()} className={cn("ml-auto inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold text-white disabled:opacity-50", sure ? "bg-danger" : "bg-[#D97706] hover:brightness-110")}><Crown size={14} />{sure ? t("admin.vipSure").replace("{n}", String(days)) : t("admin.vipGive")}</button>
      </div>
      {note ? <p role="status" className={cn("mt-2 text-xs font-semibold", note.ok ? "text-accent" : "text-danger")}>{note.text}</p> : null}
    </Card>
  );
}

// Game grants for one player: hearts, VIP and TOP (days), DJ score, chances and boosters. Owner and moderators.
function GamePanel({ id }: { id: string }) {
  const { t } = useTranslation();
  const [data, setData] = useState<GameState | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({ hearts: "100", kisses: "100", smiles: "100", dj: "10", chances: "5", kiss_fire: "5", refuse_slap: "5" });
  useEffect(() => { void gameState(id).then((value) => { if (value && typeof value === "object") setData(value); }); }, [id]);
  async function apply(work: () => Promise<unknown>) {
    setBusy(true);
    const done = await work();
    setBusy(false);
    setNote(done === null ? { ok: false, text: t("admin.vipFail") } : { ok: true, text: t("admin.gameSaved") });
    const fresh = await gameState(id);
    if (fresh && typeof fresh === "object") setData(fresh);
  }
  const day = (value: string | null) => (value ? new Date(value).toLocaleDateString() : null);
  const days = (kind: "vip" | "top", list: number[], until: string | null, color: string) => (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-20 shrink-0 text-xs font-semibold" style={{ color }}>{kind === "vip" ? "VIP" : "TOP"}</span>
      <span className="min-w-[110px] text-[11px] text-muted">{until ? t("admin.gameUntil").replace("{d}", day(until) ?? "") : t("admin.gameNone")}</span>
      {list.map((n) => <button key={n} type="button" disabled={busy} onClick={() => void apply(() => gameGrant(id, kind, n))} className="h-8 rounded-full border border-border px-2.5 text-[11px] font-semibold text-text hover:bg-surface-2 disabled:opacity-50">+{t("admin.vipDays").replace("{n}", String(n))}</button>)}
      {until ? <button type="button" disabled={busy} onClick={() => void apply(() => gameGrant(id, kind, 0))} className="h-8 rounded-full border border-danger px-2.5 text-[11px] font-semibold text-danger hover:bg-surface-2 disabled:opacity-50">{t("admin.gameRemove")}</button> : null}
    </div>
  );
  const amountRow = (key: "hearts" | "kisses" | "smiles" | "dj" | "chances" | "kiss_fire" | "refuse_slap", label: string, have: number | undefined, color: string) => (
    <form key={key} onSubmit={(event) => { event.preventDefault(); const value = Math.trunc(Number(drafts[key])); if (!value) return; void apply(() => (key === "hearts" ? grantHearts(id, value) : gameGrant(id, key, value))); }} className="flex flex-wrap items-center gap-1.5">
      <span className="w-20 shrink-0 text-xs font-semibold" style={{ color }}>{label}</span>
      <span className="min-w-[110px] text-[11px] text-muted">{t("admin.gameHave").replace("{n}", String(have ?? 0))}</span>
      <input type="number" step={1} value={drafts[key]} onChange={(event) => setDrafts((cur) => ({ ...cur, [key]: event.target.value }))} aria-label={label} className="h-8 w-24 rounded-lg border border-border bg-surface-2 px-2 text-xs tabular-nums text-text outline-none focus:border-accent" />
      <button type="submit" disabled={busy} className="h-8 rounded-lg bg-accent px-3 text-[11px] font-semibold text-bg disabled:opacity-50">{t("admin.gameGive")}</button>
    </form>
  );
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-border bg-surface-2/40 p-3">
      <p className="text-xs font-semibold">{t("admin.gameTitle")}</p>
      {amountRow("hearts", t("admin.hearts"), data?.hearts, "#F4511E")}
      {amountRow("kisses", t("admin.bonus_kisses"), data?.kisses, "#DB3100")}
      {amountRow("smiles", t("admin.bonus_smiles"), data?.smiles, "#FC8300")}
      {days("vip", [1, 7, 30, 365], data?.vip_until ?? null, "#D97706")}
      {days("top", [1, 7, 30], data?.top_until ?? null, "#CA8A04")}
      {amountRow("dj", t("admin.gameDj"), data?.dj, "#B45D8C")}
      {amountRow("chances", t("admin.gameChances"), data?.chances, "#12998C")}
      {amountRow("kiss_fire", t("admin.gameFire"), data?.kiss_fire, "#E2401F")}
      {amountRow("refuse_slap", t("admin.gameSlap"), data?.refuse_slap, "#7C4DDB")}
      <p className="text-[11px] leading-4 text-muted">{t("admin.gameHint")}</p>
      {note ? <p role="status" className={cn("text-xs font-semibold", note.ok ? "text-accent" : "text-danger")}>{note.text}</p> : null}
    </div>
  );
}
