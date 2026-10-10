import type { GuestsState, Visit } from "@/types";

const now = Date.now();
const visit = (userId: string, minutesAgo: number, isNew = false): Visit => ({ userId, at: now - minutesAgo * 60_000, isNew });

export const initialGuests: GuestsState = {
  visitors: [
    visit("u12", 8, true), visit("u1", 35, true), visit("u15", 140, true), visit("u7", 420), visit("u14", 1500),
    visit("u3", 1720), visit("u10", 2900), visit("u18", 4400), visit("u5", 6100), visit("u16", 9800), visit("u11", 13200),
  ],
  visited: [visit("u2", 50), visit("u9", 300), visit("u13", 1600), visit("u17", 5200), visit("u6", 8100)],
};
