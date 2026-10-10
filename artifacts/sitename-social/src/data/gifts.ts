import type { GiftCategory, GiftDef, GiftRecord, GiftsState } from "@/types";

export const giftCategories: GiftCategory[] = ["national", "sweets", "love", "premium"];
export const giftCatalog: GiftDef[] = [
  { id: "tea", category: "national", price: 10 },
  { id: "nar", category: "national", price: 15 },
  { id: "buta", category: "national", price: 20 },
  { id: "semeni", category: "national", price: 25 },
  { id: "carpet", category: "national", price: 40 },
  { id: "tar", category: "national", price: 60 },
  { id: "xaribulbul", category: "national", price: 80 },
  { id: "tower", category: "national", price: 120 },
  { id: "paxlava", category: "sweets", price: 15 },
  { id: "shekerbura", category: "sweets", price: 15 },
  { id: "heart", category: "love", price: 10 },
  { id: "rose", category: "love", price: 20 },
  { id: "ring", category: "love", price: 150 },
  { id: "crown", category: "premium", price: 200 },
  { id: "flame", category: "premium", price: 250 },
  { id: "diamond", category: "premium", price: 300 },
];

const now = Date.now();
const got = (id: string, giftId: GiftRecord["giftId"], userId: string, hoursAgo: number, message?: string, anonymous = false): GiftRecord => ({ id, giftId, userId, at: now - hoursAgo * 3_600_000, message, anonymous });

export const initialGifts: GiftsState = {
  balance: 500,
  received: [
    got("rg1", "tea", "u1", 3, "Bir stəkan çay məndən ☕"),
    got("rg2", "nar", "u2", 20, "Bərəkətli olsun!"),
    got("rg3", "xaribulbul", "u7", 50),
    got("rg4", "paxlava", "u3", 96, "Novruzun mübarək!"),
    got("rg5", "rose", "u12", 150, undefined, true),
    got("rg6", "crown", "u9", 300, "Kraliçaya layiq 👑"),
  ],
  sent: [got("sg1", "heart", "u1", 30, "Darıxdım!"), got("sg2", "buta", "u3", 200)],
};
