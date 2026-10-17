import type { ReactNode } from "react";
import type { GiftId } from "@/types";

const fringe = [14, 20, 26, 32, 38, 44, 50].map((x) => `M${x} 12v-5M${x} 52v5`).join("");
const blades = [16, 20, 24, 28, 32, 36, 40, 44, 48];

export const artNational: Partial<Record<GiftId, ReactNode>> = {
  tea: <>
    <ellipse cx="32" cy="55" rx="19" ry="4" fill="#E8DCC8" /><ellipse cx="32" cy="54" rx="13" ry="2.5" fill="#CDBFA6" />
    <path d="M23 12h18c0 7-3.5 9.5-3.5 15 0 4.5 6.5 7 6.5 14a12 11 0 0 1-24 0c0-7 6.5-9.5 6.5-14 0-5.5-3.5-8-3.5-15z" fill="#DFF3F5" fillOpacity=".3" stroke="#BFE6EA" strokeWidth="1.2" />
    <path d="M25.5 22h13c-.6 2-1 3.5-1 5 0 4.5 6.5 7 6.5 14a12 11 0 0 1-24 0c0-7 6.5-9.5 6.5-14 0-1.5-.4-3-1-5z" fill="#B4441A" />
    <path d="M25 40c0 4 2 7 5 8" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M28 8c-2-2 2-3 0-5M36 8c-2-2 2-3 0-5" fill="none" stroke="#8FA3AB" strokeWidth="1.3" strokeLinecap="round" />
  </>,
  nar: <>
    <path d="M38 15c5-5 10-4 13-1-4 4-9 4-13 1z" fill="#2E9E5B" />
    <circle cx="32" cy="37" r="19" fill="#C81E3A" />
    <path d="M25 20l2-9 5 5 5-5 2 9z" fill="#9C1430" />
    <ellipse cx="24" cy="31" rx="4.5" ry="8" fill="#fff" fillOpacity=".2" transform="rotate(-28 24 31)" />
    <path d="M32 56c-10 0-18-7-19-17" fill="none" stroke="#9C1430" strokeWidth="1.5" strokeLinecap="round" strokeOpacity=".6" />
  </>,
  buta: <>
    <path d="M40 6c4 6 2 10-2 14 8 2 14 9 14 18 0 11-9 20-20 20S12 49 12 38c0-14 12-22 28-32z" fill="#D4A72C" />
    <path d="M37 18c2 4 0 6-2 8 6 1 10 6 10 12 0 7-6 13-13 13s-13-6-13-13c0-9 8-15 18-20z" fill="#B5341F" />
    <circle cx="32" cy="38" r="5.5" fill="#F4E3B1" /><circle cx="32" cy="38" r="2" fill="#B5341F" />
    <g fill="#F4E3B1"><circle cx="23.5" cy="34" r="1.2" /><circle cx="40.5" cy="34" r="1.2" /><circle cx="26" cy="45" r="1.2" /><circle cx="38" cy="45" r="1.2" /></g>
  </>,
  carpet: <>
    <path d={fringe} stroke="#E8DCC8" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="11" y="12" width="42" height="40" rx="2" fill="#A3202D" />
    <rect x="15" y="16" width="34" height="32" fill="none" stroke="#E7C56A" strokeWidth="1.8" />
    <path d="M32 20l11 12-11 12-11-12z" fill="#1F4E79" stroke="#E7C56A" strokeWidth="1.5" />
    <path d="M32 26l5.5 6-5.5 6-5.5-6z" fill="#E7C56A" />
    <g fill="#E7C56A"><circle cx="19" cy="20" r="1.3" /><circle cx="45" cy="20" r="1.3" /><circle cx="19" cy="44" r="1.3" /><circle cx="45" cy="44" r="1.3" /></g>
  </>,
  tar: <g transform="rotate(35 32 32)">
    <rect x="30.3" y="8" width="3.4" height="26" fill="#5A2E14" />
    <rect x="28.5" y="3" width="7" height="7" rx="1.5" fill="#3D1F0D" />
    <path d="M28.5 5h-3M28.5 8h-3M35.5 5h3M35.5 8h3" stroke="#E7C56A" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="32" cy="37" r="8" fill="#8B4A22" /><circle cx="32" cy="50" r="10.5" fill="#8B4A22" />
    <circle cx="32" cy="37" r="5.5" fill="#EAD9B6" /><circle cx="32" cy="50" r="7.5" fill="#EAD9B6" />
    <path d="M31 9v48M33 9v48" stroke="#5A2E14" strokeWidth=".7" />
  </g>,
  tower: <>
    <rect x="7" y="54" width="50" height="4" rx="2" fill="#5E503C" />
    <path d="M40 27h10v27H40z" fill="#A9864F" />
    <rect x="19" y="16" width="22" height="38" fill="#C9A66B" /><rect x="33" y="16" width="8" height="38" fill="#B5935A" />
    <rect x="17" y="11" width="26" height="6" rx="1.5" fill="#DCC08A" />
    <path d="M19 25h22M19 33h22M19 41h22M19 49h22" stroke="#A9864F" strokeWidth="1" />
    <rect x="26" y="27" width="3" height="5" rx="1.5" fill="#3D2F1E" /><rect x="26" y="43" width="3" height="5" rx="1.5" fill="#3D2F1E" />
  </>,
  xaribulbul: <>
    <path d="M32 58V36" stroke="#2E9E5B" strokeWidth="3" strokeLinecap="round" />
    <path d="M32 50c-7 0-11-3-12-8 6-1 11 2 12 8zM32 46c6 0 10-3 11-7-5-1-10 1-11 7z" fill="#3FB26B" />
    <g fill="#B66DD6"><path d="M32 36c-8-8-6-20 0-26 6 6 8 18 0 26z" transform="rotate(-52 32 36)" /><path d="M32 36c-8-8-6-20 0-26 6 6 8 18 0 26z" transform="rotate(52 32 36)" /></g>
    <path d="M32 36c-8-8-6-21 0-28 6 7 8 20 0 28z" fill="#8E44AD" />
    <path d="M32 36c-6 1-9 6-7 11 4-1 7-5 7-11zM32 36c6 1 9 6 7 11-4-1-7-5-7-11z" fill="#F5D0E6" />
    <circle cx="32" cy="35" r="3" fill="#F1C40F" />
  </>,
  semeni: <>
    <ellipse cx="32" cy="53" rx="21" ry="5" fill="#E8DCC8" />
    {blades.map((x, index) => <path key={x} d={`M${x} 50c${index % 2 ? 1 : -1}-12 ${index % 2 ? -2 : 2}-24 ${(index - 4) * 0.8}-${34 + (index % 3) * 3}`} fill="none" stroke={index % 2 ? "#2E9E5B" : "#3FB26B"} strokeWidth="3" strokeLinecap="round" />)}
    <rect x="13" y="37" width="38" height="6" rx="1" fill="#D7263D" />
    <path d="M32 40l-8-6v12zM32 40l8-6v12z" fill="#F0455A" /><circle cx="32" cy="40" r="2.5" fill="#D7263D" />
  </>,
};
