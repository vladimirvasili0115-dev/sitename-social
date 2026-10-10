"use client";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { GiftCategory, GiftDef } from "@/types";
import { giftCategories } from "@/data/gifts";
import { usePrices } from "@/components/gifts/usePrices";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils";
import { useFriends } from "@/components/friends/useFriends";
import { useGifts } from "@/components/gifts/useGifts";
import { TopUpModal } from "@/components/gifts/TopUpModal";
import { giftNames } from "@/components/gifts/GiftArt";
import { formatDay } from "@/lib/datetime";
import { GiftCard } from "@/components/gifts/GiftCard";
import { GiftRecordCard } from "@/components/gifts/GiftRecordCard";
import { SendGiftModal } from "@/components/gifts/SendGiftModal";
import { Price } from "@/components/gifts/Price";

type GiftsTab = "store" | "received" | "sent" | "history";
type Filter = GiftCategory | "all";
const categoryLabels: Record<GiftCategory, TranslationKey> = { national: "gifts.catNational", sweets: "gifts.catSweets", love: "gifts.catLove", premium: "gifts.catPremium" };

export default function GiftsPage() {
  const { t } = useTranslation();
  const { balance, received, sent, transactions, topUp, send } = useGifts();
  const [paying, setPaying] = useState(false);
  const { friends, directory: people } = useFriends();
  const { gifts: giftCatalog } = usePrices();
  const [tab, setTab] = useState<GiftsTab>("store");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<GiftDef | null>(null);
  const [toId, setToId] = useState<string | null>(null);

  useEffect(() => setToId(new URLSearchParams(window.location.search).get("to")), []);
  const target = people.find((item) => item.user.id === toId);
  const recipients = target && !friends.some((item) => item.user.id === target.user.id) ? [target, ...friends] : friends;
  const filters: { id: Filter; label: string }[] = [{ id: "all", label: t("common.all") }, ...giftCategories.map((id) => ({ id, label: t(categoryLabels[id]) }))];
  const visible = giftCatalog.filter((gift) => filter === "all" || gift.category === filter);
  const records = tab === "received" ? received : sent;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 px-1">
        <h1 className="flex-1 text-[23px] font-semibold tracking-[-0.035em]">{t("nav.gifts")}</h1>
        <span className="flex h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm text-muted">{t("gifts.balance")}<Price value={balance} className="text-text" /></span>
        <button onClick={() => setPaying(true)} className="flex h-11 items-center gap-1.5 rounded-xl bg-accent px-3.5 text-sm font-semibold text-bg hover:brightness-110"><Plus size={16} />{t("gifts.topUp")}</button>
      </div>
      {target ? <p className="mb-3 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-muted">{t("gifts.to")}: <span className="font-semibold text-text">{target.user.name}</span></p> : null}
      <Tabs<GiftsTab> active={tab} onChange={setTab} tabs={[{ id: "store", label: t("gifts.tabStore"), count: giftCatalog.length }, { id: "received", label: t("gifts.tabReceived"), count: received.length }, { id: "sent", label: t("gifts.tabSent"), count: sent.length }, { id: "history", label: t("gifts.tabHistory") }]} />
      {tab === "store" ? (
        <>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {filters.map((item) => <button key={item.id} onClick={() => setFilter(item.id)} aria-pressed={item.id === filter} className={cn("shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium", item.id === filter ? "border-accent bg-accent text-bg" : "border-border bg-surface text-muted hover:text-text")}>{item.label}</button>)}
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {visible.map((gift) => <li key={gift.id}><GiftCard gift={gift} onSelect={() => setSelected(gift)} /></li>)}
          </ul>
        </>
      ) : tab === "history" ? (transactions.length ? (
        <Card><ul className="divide-y divide-border">
          {transactions.map((item) => (
            <li key={item.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.type === "topup" ? t("gifts.txTopUp") : `${t("gifts.txGift")}${item.giftId ? `: ${t(giftNames[item.giftId])}` : ""}`}</p>
                <p className="mt-0.5 text-xs text-muted">{formatDay(item.at)}{item.price ? ` · ${item.price.toFixed(2)} AZN` : ""}</p>
              </div>
              <span className={cn("text-sm font-semibold tabular-nums", item.amount > 0 ? "text-accent" : "text-muted")}>{item.amount > 0 ? "+" : ""}{item.amount}</span>
            </li>
          ))}
        </ul></Card>
      ) : <Card className="p-8 text-center text-sm text-muted">{t("gifts.emptyHistory")}</Card>) : records.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {records.map((record) => <li key={record.id}><GiftRecordCard record={record} direction={tab === "received" ? "from" : "to"} /></li>)}
        </ul>
      ) : <Card className="p-8 text-center text-sm text-muted">{t(tab === "received" ? "gifts.emptyReceived" : "gifts.emptySent")}</Card>}
      {paying ? <TopUpModal onPay={topUp} onClose={() => setPaying(false)} /> : null}
      {selected ? <SendGiftModal gift={selected} balance={balance} recipients={recipients} initialUserId={target?.user.id} onSend={(input) => send(selected, input)} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
