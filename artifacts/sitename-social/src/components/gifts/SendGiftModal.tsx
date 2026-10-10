"use client";
import { useEffect, useState } from "react";
import { Check, PartyPopper, X } from "lucide-react";
import type { GiftDef, GiftRecord, Person } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/utils";
import { GiftArt, giftNames } from "./GiftArt";
import { giftGlow, premiumGlow } from "./GiftCard";
import { Price } from "./Price";

type Props = { gift: GiftDef; balance: number; recipients: Person[]; initialUserId?: string | null; onSend: (input: Pick<GiftRecord, "userId" | "message" | "anonymous">) => Promise<boolean>; onClose: () => void };

export function SendGiftModal({ gift, balance, recipients, initialUserId, onSend, onClose }: Props) {
  const { t } = useTranslation();
  const [userId, setUserId] = useState<string | null>(initialUserId ?? null);
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [done, setDone] = useState(false);
  const enough = balance >= gift.price;
  const recipient = recipients.find((item) => item.user.id === userId);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const [pending, setPending] = useState(false);
  const submit = async () => {
    if (!userId || pending) return;
    setPending(true);
    const ok = await onSend({ userId, message: message.trim() || undefined, anonymous });
    setPending(false);
    if (ok) setDone(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <Card role="dialog" aria-modal="true" aria-label={t(giftNames[gift.id])} className="flex max-h-[94dvh] w-full max-w-[440px] flex-col rounded-b-none sm:rounded-b-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold">{t("gifts.send")}</h2>
          <IconButton aria-label={t("photos.close")} onClick={onClose}><X size={18} /></IconButton>
        </div>
        <div className="overflow-y-auto p-5">
          <div className={cn("mx-auto flex h-36 w-36 items-center justify-center rounded-3xl", gift.category === "premium" ? premiumGlow : giftGlow)}><GiftArt id={gift.id} className="h-28 w-28" /></div>
          <p className="mt-2 text-center text-lg font-semibold">{t(giftNames[gift.id])}</p>
          {done ? (
            <div role="status" className="mt-4 text-center">
              <p className="flex items-center justify-center gap-2 text-sm font-semibold text-accent"><PartyPopper size={17} />{t("gifts.sent")}</p>
              <p className="mt-1 text-sm text-muted">{recipient?.user.name}</p>
              <Button className="mt-5 w-full" onClick={onClose}>{t("photos.close")}</Button>
            </div>
          ) : (
            <>
              <p className="mt-1 text-center"><Price value={gift.price} className="text-sm text-text" /></p>
              <p className="mb-2 mt-5 text-xs font-medium text-muted">{t("gifts.to")}</p>
              <ul className="flex gap-2 overflow-x-auto pb-2">
                {recipients.map(({ user }) => (
                  <li key={user.id} className="shrink-0">
                    <button onClick={() => setUserId(user.id)} aria-pressed={user.id === userId} className={cn("flex w-[68px] flex-col items-center gap-1.5 rounded-xl border p-2", user.id === userId ? "border-accent bg-surface-2" : "border-transparent hover:bg-surface-2")}>
                      <span className="relative"><Avatar user={user} size="lg" />{user.id === userId ? <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-bg"><Check size={12} strokeWidth={3} /></span> : null}</span>
                      <span className="w-full truncate text-[11px] text-text">{user.name.split(" ")[0]}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <label className="mt-3 block text-xs font-medium text-muted">{t("gifts.message")}
                <input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={100} className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface-2 px-3.5 text-sm text-text outline-none focus:border-accent" />
              </label>
              <div className="mt-4 flex items-center gap-3">
                <div className="min-w-0 flex-1"><p className="text-sm font-medium">{t("gifts.anonymous")}</p><p className="text-xs text-muted">{t("gifts.anonymousHint")}</p></div>
                <Switch checked={anonymous} onChange={setAnonymous} label={t("gifts.anonymous")} />
              </div>
              {enough ? null : <p className="mt-4 text-sm text-danger">{t("gifts.notEnough")}</p>}
              <Button className="mt-5 h-12 w-full disabled:opacity-40" disabled={!userId || !enough || pending} onClick={() => void submit()}>{t("gifts.send")}</Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
