import type { ReactNode } from "react";
import type { GiftId } from "@/types";

export const artOther: Partial<Record<GiftId, ReactNode>> = {
  paxlava: <>
    <path d="M32 9l25 23-25 23L7 32z" fill="#C97F1E" />
    <path d="M32 14l19.5 18L32 50 12.5 32z" fill="#E9A93C" />
    <path d="M22 23l20 18M42 23L22 41" stroke="#C97F1E" strokeWidth="1.3" />
    <ellipse cx="32" cy="32" rx="5" ry="6.5" fill="#8B5A2B" /><path d="M30 29c1-2 3-2 4 0" fill="none" stroke="#C99A6B" strokeWidth="1.1" strokeLinecap="round" />
  </>,
  shekerbura: <>
    <path d="M7 41a25 23 0 0 1 50 0c0 5-4 8-8 8H15c-4 0-8-3-8-8z" fill="#F0D9A8" stroke="#D1B272" strokeWidth="1.5" />
    <path d="M32 22v24M32 28l-6-4M32 28l6-4M32 34l-8-5M32 34l8-5M32 40l-10-6M32 40l10-6M17 40l5 5M47 40l-5 5" fill="none" stroke="#C49A4A" strokeWidth="1.4" strokeLinecap="round" />
  </>,
  heart: <>
    <path d="M32 55C14 43 7 33 7 23c0-8 6-13 12.5-13 5 0 9.5 3 12.5 7.500C35 13 39.5 10 44.5 10 51 10 57 15 57 23c0 10-7 20-25 32z" fill="#E11D48" />
    <ellipse cx="19" cy="22" rx="4" ry="6" fill="#fff" fillOpacity=".25" transform="rotate(-30 19 22)" />
  </>,
  rose: <>
    <path d="M32 36v22" stroke="#2E9E5B" strokeWidth="3" strokeLinecap="round" />
    <path d="M32 50c-7 1-11-2-13-6 6-2 11 0 13 6z" fill="#3FB26B" />
    <circle cx="32" cy="24" r="16" fill="#C81E3A" />
    <path d="M32 24c-3-4 2-8 6-5 5 4 1 12-6 12-9 0-13-10-7-16 5-5 14-4 18 2" fill="none" stroke="#8F1229" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M18 30c2 6 8 10 14 10s12-4 14-10" fill="none" stroke="#8F1229" strokeWidth="1.5" strokeLinecap="round" strokeOpacity=".7" />
  </>,
  ring: <>
    <circle cx="32" cy="41" r="15" fill="none" stroke="#E7B93C" strokeWidth="5" />
    <path d="M27 26h10l-5 5z" fill="#C9982A" />
    <path d="M23 16l4.5-7h9L41 16l-9 11z" fill="#7DD3FC" /><path d="M23 16h18M27.5 9l4.5 18 4.5-18" fill="none" stroke="#E0F2FE" strokeWidth="1" />
  </>,
  crown: <>
    <path d="M10 46L7 20l13 12 12-20 12 20 13-12-3 26z" fill="#E7B93C" />
    <rect x="10" y="46" width="44" height="8" rx="2" fill="#C9982A" />
    <g fill="#F6D776"><circle cx="7" cy="19" r="3" /><circle cx="32" cy="11" r="3" /><circle cx="57" cy="19" r="3" /></g>
    <circle cx="20" cy="50" r="2.2" fill="#38BDF8" /><circle cx="32" cy="50" r="2.6" fill="#E11D48" /><circle cx="44" cy="50" r="2.2" fill="#3FB26B" />
  </>,
  diamond: <>
    <path d="M18 13h28l12 15-26 28L6 28z" fill="#38BDF8" />
    <path d="M18 13L6 28h52L46 13z" fill="#7DD3FC" />
    <path d="M24 28l8 28 8-28M18 13l6 15 8-15 8 15 6-15" fill="none" stroke="#E0F2FE" strokeWidth="1.2" strokeLinejoin="round" />
  </>,
  flame: <>
    <rect x="6" y="55" width="52" height="3.5" rx="1.7" fill="#5E503C" />
    <path d="M10 55V35c0-10 4-18 9-25 2 9 5 15 5 25v20z" fill="#F97316" />
    <path d="M40 55V35c0-10 3-16 5-25 5 7 9 15 9 25v20z" fill="#F59E0B" />
    <path d="M24 55V29c0-12 4-20 8-27 4 7 8 15 8 27v26z" fill="#EF4444" />
    <path d="M12 42h10M12 48h10M26 34h12M26 41h12M26 48h12M42 42h10M42 48h10" stroke="#fff" strokeOpacity=".3" strokeWidth="1.2" />
  </>,
};
