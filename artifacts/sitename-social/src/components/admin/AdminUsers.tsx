"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Ban, Coins, ShieldCheck, ShieldOff, Trash2, Undo2 } from "lucide-react";
import { deleteUser, fetchAdminUsers, fetchIsOwner, grantCoins, setBan, setModerator, type AdminUser } from "@/lib/adminSync";
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

export function AdminUsers() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [owner, setOwner] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [coinsFor, setCoinsFor] = useState<string | null>(null);
  const [amount, setAmount] = useState("100");
  const [failed, setFailed] = useState(false);
  const load = useCallback((search: string) => void fetchAdminUsers(search).then((list) => {
    setUsers(list ?? []);
    setFailed(!list);
  }), []);
  useEffect(() => {
    void fetchIsOwner().then(setOwner);
  }, []);
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
  function handleCoins(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const value = Math.trunc(Number(amount));
    if (!value) return;
    setCoinsFor(null);
    void run(id, async () => (await grantCoins(id, value)) !== null);
  }

  return (
    <>
      <SearchInput value={query} onChange={setQuery} label={t("admin.searchUsers")} className="mb-4" />
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
                        <Link href={userHref(user.id)} className="truncate text-sm font-semibold hover:underline">{user.name || "—"}</Link>
                        {user.owner ? <span className={cn(chip, "border-accent text-accent")}>{t("admin.roleOwner")}</span> : user.moderator ? <span className={cn(chip, "border-accent text-accent")}>{t("admin.roleModerator")}</span> : null}
                        {user.banned ? <span className={cn(chip, "border-danger text-danger")}>{t("admin.statBanned")}</span> : null}
                        {online ? <span className={cn(chip, "border-border text-accent")}>{t("common.onlineNow")}</span> : null}
                      </div>
                      <p className="truncate text-xs text-muted">{user.email} · @{user.handle}</p>
                      <p className="mt-0.5 text-[11px] text-muted">{t("admin.joined")}: {formatDay(user.joined)} · {t("gifts.balance")}: <span className="tabular-nums text-text">{user.balance}</span></p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button disabled={locked} onClick={() => { setCoinsFor(coinsFor === user.id ? null : user.id); setAmount("100"); }} className={action}><Coins size={14} />{t("admin.coins")}</button>
                    {user.moderator ? null : user.banned
                      ? <button disabled={locked} onClick={() => void run(user.id, () => setBan(user.id, false))} className={action}><Undo2 size={14} />{t("settings.blkUnblock")}</button>
                      : <button disabled={locked} onClick={() => void run(user.id, () => setBan(user.id, true))} className={cn(danger, "text-danger hover:bg-surface-2")}><Ban size={14} />{t("admin.ban")}</button>}
                    {owner && !user.owner ? <button disabled={locked} onClick={() => void run(user.id, () => setModerator(user.id, !user.moderator))} className={action}>{user.moderator ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}{t(user.moderator ? "admin.removeModerator" : "admin.makeModerator")}</button> : null}
                    {user.moderator ? null : <button disabled={locked} onClick={() => (asking ? void run(user.id, () => deleteUser(user.id)) : setConfirm(user.id))} className={cn(danger, asking ? "bg-danger text-bg" : "text-danger hover:bg-surface-2")}><Trash2 size={14} />{t(asking ? "admin.confirm" : "settings.accDelete")}</button>}
                  </div>
                  {coinsFor === user.id ? (
                    <form onSubmit={(event) => handleCoins(event, user.id)} className="mt-3 flex flex-wrap items-center gap-2">
                      <input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} min={-1000000} max={1000000} step={1} aria-label={t("admin.coinsAmount")} className="h-10 w-32 rounded-xl border border-border bg-surface-2 px-3 text-sm tabular-nums text-text outline-none focus:border-accent" />
                      <button type="submit" className="h-10 rounded-xl bg-accent px-4 text-xs font-semibold text-bg">{t("admin.coinsApply")}</button>
                      <p className="basis-full text-[11px] text-muted">{t("admin.coinsHint")}</p>
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
