import type { GiftId } from "@/types";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { artNational } from "./artNational";
import { artOther } from "./artOther";

const art = { ...artNational, ...artOther };
export const giftNames: Record<GiftId, TranslationKey> = {
  tea: "gifts.tea", nar: "gifts.nar", buta: "gifts.buta", carpet: "gifts.carpet", tar: "gifts.tar", tower: "gifts.tower", xaribulbul: "gifts.xaribulbul", semeni: "gifts.semeni",
  paxlava: "gifts.paxlava", shekerbura: "gifts.shekerbura", heart: "gifts.heart", rose: "gifts.rose", ring: "gifts.ring", crown: "gifts.crown", diamond: "gifts.diamond", flame: "gifts.flame",
};

export function GiftArt({ id, className }: { id: GiftId; className?: string }) {
  return <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>{art[id]}</svg>;
}
