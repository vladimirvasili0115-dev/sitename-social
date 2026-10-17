import type { Notice, NoticeType } from "@/types";

const now = Date.now();
const notice = (id: string, type: NoticeType, userId: string, minutesAgo: number, read = false, giftId?: Notice["giftId"]): Notice => ({ id, type, userId, at: now - minutesAgo * 60_000, read, giftId });

export const initialNotices: Notice[] = [
  notice("n1", "guest", "u12", 8),
  notice("n2", "message", "u1", 11),
  notice("n3", "request", "u12", 40),
  notice("n4", "message", "u7", 95),
  notice("n5", "gift", "u1", 180, false, "tea"),
  notice("n6", "like", "u2", 260),
  notice("n7", "request", "u10", 900, true),
  notice("n8", "comment", "u3", 1300, true),
  notice("n9", "gift", "u2", 1200, true, "nar"),
  notice("n10", "guest", "u15", 1500, true),
  notice("n11", "request", "u11", 2900, true),
  notice("n12", "like", "u9", 4300, true),
];
