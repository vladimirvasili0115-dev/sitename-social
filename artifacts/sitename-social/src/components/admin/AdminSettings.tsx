"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { fetchNotice, fetchPriceTables, fetchWelcome, fetchWords, saveNotice, saveWelcome, setPrice, setWord, type SiteNotice, type Welcome } from "@/lib/adminSync";
import { priceColumn, refreshPrices, type PriceTable } from "@/lib/pricesSync";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { giftNames } from "@/components/gifts/GiftArt";
import type { GiftId } from "@/types";
import { cn } from "@/lib/utils";

const heading = "mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted";
const field = "h-10 rounded-xl border border-border bg-surface-2 px-3 text-sm text-text outline-none focus:border-accent";
const packColumns: { key: string; label: TranslationKey }[] = [{ key: "coins", label: "admin.priceCoins" }, { key: "bonus", label: "admin.priceBonus" }, { key: "price", label: "admin.priceAzn" }];

function PriceInput({ value, step, label, onSave }: { value: number; step: number; label: string; onSave: (value: number) => Promise<boolean> }) {
  const [draft, setDraft] = useState(String(value));
  const [state, setState] = useState<"idle" | "saved" | "failed">("idle");
  useEffect(() => setDraft(String(value)), [value]);
  async function commit() {
    const next = Number(draft);
    if (!Number.isFinite(next) || next < 0 || next === value) return setDraft(String(value));
    setState((await onSave(next)) ? "saved" : "failed");
  }
  return <input type="number" min={0} step={step} value={draft} aria-label={label} onChange={(event) => { setDraft(event.target.value); setState("idle"); }} onBlur={() => void commit()} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} className={cn(field, "w-24 tabular-nums", state === "saved" && "border-accent", state === "failed" && "border-danger")} />;
}

export function AdminSettings() {
  const { t } = useTranslation();
  const [notice, setNotice] = useState<SiteNotice>({ body: "", kind: "info", active: false, updatedAt: "" });
  const [noticeState, setNoticeState] = useState<"idle" | "saved" | "failed">("idle");
  const [welcome, setWelcome] = useState<Welcome>({ enabled: false, text: "" });
  const [welcomeState, setWelcomeState] = useState<"idle" | "saved" | "failed">("idle");
  const [words, setWords] = useState<string[]>([]);
  const [word, setWordDraft] = useState("");
  const [tables, setTables] = useState<{ gifts: PriceTable; packages: PriceTable } | null>(null);
  const [failed, setFailed] = useState(false);

  const loadWords = useCallback(() => void fetchWords().then((list) => setWords(list ?? [])), []);
  const loadPrices = useCallback(() => void fetchPriceTables().then(setTables), []);
  useEffect(() => {
    void fetchNotice().then((value) => { if (value) setNotice(value); });
    void fetchWelcome().then((value) => { if (value) setWelcome(value); });
    loadWords();
    loadPrices();
  }, [loadWords, loadPrices]);

  async function handleNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNoticeState((await saveNotice(notice.body.trim(), notice.kind, notice.active && Boolean(notice.body.trim()))) ? "saved" : "failed");
  }
  async function handleWelcome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWelcomeState((await saveWelcome(welcome.text.trim(), welcome.enabled && Boolean(welcome.text.trim()))) ? "saved" : "failed");
  }
  async function handleWord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (word.trim().length < 2) return;
    const done = await setWord(word, true);
    setFailed(!done);
    if (done) setWordDraft("");
    loadWords();
  }
  async function savePrice(table: "gift_prices" | "coin_packages", key: string, column: string, value: number) {
    const done = await setPrice(table, key, column, value);
    if (done) {
      loadPrices();
      void refreshPrices();
    }
    return done;
  }
  const giftColumn = priceColumn(tables?.gifts);
  const giftKey = tables?.gifts.pk;
  const packKey = tables?.packages.pk;

  return (
    <>
      <h2 className={heading}>{t("admin.notice")}</h2>
      <Card className="mb-6 p-4">
        <form onSubmit={handleNotice}>
          <textarea value={notice.body} onChange={(event) => { setNotice({ ...notice, body: event.target.value }); setNoticeState("idle"); }} maxLength={500} rows={3} aria-label={t("admin.notice")} placeholder={t("admin.noticePlaceholder")} className="w-full resize-none rounded-xl border border-border bg-surface-2 px-3.5 py-3 text-sm leading-6 text-text outline-none placeholder:text-muted focus:border-accent" />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              {(["info", "warning"] as const).map((kind) => <button key={kind} type="button" aria-pressed={notice.kind === kind} onClick={() => setNotice({ ...notice, kind })} className={cn("h-9 rounded-full border px-3.5 text-xs font-semibold", notice.kind === kind ? "border-accent bg-surface-2 text-accent" : "border-border text-muted hover:text-text")}>{t(kind === "info" ? "admin.noticeInfo" : "admin.noticeWarning")}</button>)}
            </div>
            <label className="flex items-center gap-2 text-sm"><Switch checked={notice.active} onChange={(active) => setNotice({ ...notice, active })} label={t("admin.noticeActive")} />{t("admin.noticeActive")}</label>
            <Button type="submit" className="ml-auto h-10 px-4 text-xs">{t("profile.save")}</Button>
          </div>
          {noticeState !== "idle" ? <p role="status" className={cn("mt-2 text-xs", noticeState === "saved" ? "text-accent" : "text-danger")}>{t(noticeState === "saved" ? "admin.saved" : "report.failed")}</p> : null}
        </form>
      </Card>

      <h2 className={heading}>{t("admin.welcome")}</h2>
      <Card className="mb-6 p-4">
        <p className="mb-3 text-xs leading-5 text-muted">{t("admin.welcomeHint")}</p>
        <form onSubmit={handleWelcome}>
          <textarea value={welcome.text} onChange={(event) => { setWelcome({ ...welcome, text: event.target.value }); setWelcomeState("idle"); }} maxLength={1500} rows={9} aria-label={t("admin.welcome")} className="w-full resize-y rounded-xl border border-border bg-surface-2 px-3.5 py-3 text-sm leading-6 text-text outline-none focus:border-accent" />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm"><Switch checked={welcome.enabled} onChange={(enabled) => setWelcome({ ...welcome, enabled })} label={t("admin.welcomeActive")} />{t("admin.welcomeActive")}</label>
            <Button type="submit" className="ml-auto h-10 px-4 text-xs">{t("profile.save")}</Button>
          </div>
          {welcomeState !== "idle" ? <p role="status" className={cn("mt-2 text-xs", welcomeState === "saved" ? "text-accent" : "text-danger")}>{t(welcomeState === "saved" ? "admin.saved" : "report.failed")}</p> : null}
        </form>
      </Card>

      <h2 className={heading}>{t("admin.words")}</h2>
      <Card className="mb-6 p-4">
        <p className="mb-3 text-xs leading-5 text-muted">{t("admin.wordsHint")}</p>
        <form onSubmit={handleWord} className="flex gap-2">
          <input value={word} onChange={(event) => setWordDraft(event.target.value)} maxLength={40} aria-label={t("admin.wordsAdd")} placeholder={t("admin.wordsAdd")} autoComplete="off" className={cn(field, "min-w-0 flex-1")} />
          <Button type="submit" className="h-10 px-4 text-xs">{t("admin.add")}</Button>
        </form>
        {failed ? <p role="alert" className="mt-2 text-xs text-danger">{t("report.failed")}</p> : null}
        {words.length ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {words.map((item) => <li key={item} className="flex items-center gap-1 rounded-full border border-border py-1 pl-3 pr-1 text-xs text-text">{item}<button onClick={() => void setWord(item, false).then(loadWords)} aria-label={`${t("post.delete")}: ${item}`} className="flex h-6 w-6 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-danger"><X size={13} /></button></li>)}
          </ul>
        ) : null}
      </Card>

      <h2 className={heading}>{t("admin.giftPrices")}</h2>
      <Card className="mb-6 p-4">
        {tables && giftKey && giftColumn ? (
          <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {tables.gifts.rows.map((row) => {
              const id = String(row[giftKey]);
              const name = giftNames[id as GiftId];
              return <li key={id} className="flex items-center justify-between gap-3"><span className="truncate text-sm">{name ? t(name) : id}</span><PriceInput value={Number(row[giftColumn])} step={1} label={name ? t(name) : id} onSave={(value) => savePrice("gift_prices", id, giftColumn, Math.round(value))} /></li>;
            })}
          </ul>
        ) : <p className="text-sm text-muted">{t("admin.pricesMissing")}</p>}
      </Card>

      <h2 className={heading}>{t("admin.packages")}</h2>
      <Card className="p-4">
        {tables && packKey && tables.packages.rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[380px] text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wide text-muted"><th className="pb-2 font-semibold">{t("admin.package")}</th>{packColumns.filter((column) => column.key in tables.packages.rows[0]).map((column) => <th key={column.key} className="pb-2 font-semibold">{t(column.label)}</th>)}</tr></thead>
              <tbody>
                {tables.packages.rows.map((row) => {
                  const id = String(row[packKey]);
                  return <tr key={id}><td className="py-1 pr-3 tabular-nums text-muted">{id}</td>{packColumns.filter((column) => column.key in row).map((column) => <td key={column.key} className="py-1 pr-2"><PriceInput value={Number(row[column.key])} step={column.key === "price" ? 0.01 : 1} label={`${id} ${t(column.label)}`} onSave={(value) => savePrice("coin_packages", id, column.key, column.key === "price" ? value : Math.round(value))} /></td>)}</tr>;
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-muted">{t("admin.pricesMissing")}</p>}
        <p className="mt-3 text-[11px] leading-5 text-muted">{t("admin.pricesHint")}</p>
      </Card>
    </>
  );
}
