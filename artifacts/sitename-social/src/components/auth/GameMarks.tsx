"use client";
import type { ReactNode } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/ui/LogoMark";

// Our own small signs for the games of the site (drawn here, not copied from anywhere): one rounded tile each.
type Mark = { id: string; name: string; art: ReactNode; from: string; to: string };
const heart = "M32 47c-9-6.5-14-11-14-17 0-4.6 3.6-7.4 7.2-7.4 2.7 0 5.2 1.5 6.8 4.2 1.6-2.7 4.1-4.2 6.8-4.2 3.6 0 7.2 2.8 7.2 7.4 0 6-5 10.5-14 17z";
const marks: Mark[] = [
  { id: "butulka", name: "Butulka", from: "#B84DFF", to: "#FF4D8D", art: <><g transform="rotate(-40 30 36)"><rect x="25" y="27" width="12" height="25" rx="5" fill="#fff" /><rect x="28" y="16" width="6" height="12" rx="2.5" fill="#fff" /><rect x="27.5" y="34" width="7" height="9" rx="2" fill="#B84DFF" opacity="0.7" /></g><path d="M47 18c-1.7-3-5.9-2.1-5.9 1.1 0 2.4 3.2 4.4 5.9 6.5 2.7-2.1 5.9-4.1 5.9-6.5 0-3.2-4.2-4.1-5.9-1.1z" fill="#fff" /></> },
  { id: "nard", name: "Nərd", from: "#8A4B22", to: "#E59A3B", art: <><rect x="12" y="14" width="40" height="36" rx="4" fill="#3A1D0B" opacity="0.55" />{[0, 1, 2, 3, 4].map((n) => <path key={n} d={`M${14 + n * 7.4} 16l3.7 15 3.7-15z`} fill={n % 2 ? "#FFE3B8" : "#fff"} />)}{[0, 1, 2, 3, 4].map((n) => <path key={`b${n}`} d={`M${14 + n * 7.4} 48l3.7-15 3.7 15z`} fill={n % 2 ? "#fff" : "#FFE3B8"} />)}<circle cx="24" cy="38.5" r="4.4" fill="#1F1208" stroke="#fff" strokeWidth="1.2" /><circle cx="40" cy="25.5" r="4.4" fill="#fff" stroke="#3A1D0B" strokeWidth="1.2" /></> },
  { id: "domino", name: "Domino", from: "#0FA968", to: "#2DD4A0", art: <g transform="rotate(-18 32 32)"><rect x="19" y="10" width="26" height="44" rx="5" fill="#fff" /><path d="M21 32h22" stroke="#0FA968" strokeWidth="2" />{[[27, 18], [37, 26], [27, 38], [37, 38], [27, 46], [37, 46]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.6" fill="#0B6B45" />)}</g> },
  { id: "loto", name: "Loto", from: "#2563EB", to: "#38BDF8", art: <><circle cx="24" cy="36" r="13" fill="#fff" /><circle cx="42" cy="28" r="12" fill="#FFE27A" /><text x="24" y="41" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="14" fontWeight="800" fill="#2563EB">47</text><text x="42" y="33" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="13" fontWeight="800" fill="#B45309">9</text></> },
  { id: "durak", name: "Durak", from: "#E11D48", to: "#FB7185", art: <><g transform="rotate(-14 26 34)"><rect x="14" y="14" width="24" height="34" rx="4" fill="#fff" /><text x="19" y="27" fontFamily="Arial,sans-serif" fontSize="11" fontWeight="800" fill="#E11D48">A</text></g><g transform="rotate(12 40 34)"><rect x="28" y="16" width="24" height="34" rx="4" fill="#fff" /><path d="M40 26c-1.5-3.3-6.3-2.6-6.3 1.2 0 2.7 3.4 4.6 6.3 7 2.9-2.4 6.3-4.3 6.3-7 0-3.8-4.8-4.5-6.3-1.2z" fill="#E11D48" /></g></> },
  { id: "chess", name: "Şahmat", from: "#4338CA", to: "#818CF8", art: <><path d="M20 50h24v-5H20z" fill="#fff" /><path d="M23 45l2-17h14l2 17z" fill="#fff" /><path d="M21 28h22v-7h-4v3h-4v-3h-4v3h-4v-3h-4z" fill="#fff" /><path d="M26 33h12" stroke="#4338CA" strokeWidth="1.6" /></> },
  { id: "poker", name: "Poker", from: "#0F3D2E", to: "#1F8A5B", art: <><circle cx="27" cy="34" r="15" fill="#E11D48" /><circle cx="27" cy="34" r="15" fill="none" stroke="#fff" strokeWidth="3.4" strokeDasharray="5 4.7" /><circle cx="27" cy="34" r="8" fill="none" stroke="#fff" strokeWidth="1.4" /><circle cx="41" cy="27" r="13" fill="#111827" /><circle cx="41" cy="27" r="13" fill="none" stroke="#FDE68A" strokeWidth="3" strokeDasharray="4.5 4.1" /><circle cx="41" cy="27" r="6.5" fill="none" stroke="#FDE68A" strokeWidth="1.3" /></> },
  { id: "quiz", name: "Viktorina", from: "#F59E0B", to: "#FDBA3B", art: <><path d="M14 16h36a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H34l-9 9v-9h-11a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4z" fill="#fff" /><text x="32" y="40" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="26" fontWeight="800" fill="#D97706">?</text></> },
  { id: "words", name: "Söz oyunu", from: "#0D9488", to: "#5EEAD4", art: <><g transform="rotate(-9 24 32)"><rect x="11" y="19" width="22" height="26" rx="4" fill="#fff" /><text x="22" y="39" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="19" fontWeight="800" fill="#0D9488">S</text></g><g transform="rotate(8 42 32)"><rect x="31" y="19" width="22" height="26" rx="4" fill="#FEF3C7" /><text x="42" y="39" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="19" fontWeight="800" fill="#B45309">Ö</text></g></> },
  { id: "live", name: "live", from: "#DC2626", to: "#FB923C", art: <><rect x="11" y="17" width="42" height="30" rx="6" fill="#fff" /><path d="M28 25v14l12-7z" fill="#DC2626" /><circle cx="47" cy="22" r="3.6" fill="#DC2626" className="login-anim" style={{ animation: "login-live 1.4s ease-in-out infinite" }} /><path d="M21 52h22" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" /></> },
];

export function GameTile({ mark, className }: { mark: Mark; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("drop-shadow-[0_8px_14px_rgba(0,0,0,0.4)]", className)}>
      <defs><linearGradient id={`gm-${mark.id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={mark.from} /><stop offset="1" stopColor={mark.to} /></linearGradient></defs>
      <rect width="64" height="64" rx="16" fill={`url(#gm-${mark.id})`} />
      <path d="M0 16A16 16 0 0 1 16 0h32a16 16 0 0 1 16 16v8C44 30 20 30 0 24z" fill="#fff" opacity="0.22" />
      {mark.art}
    </svg>
  );
}

function useNames() {
  const { t } = useTranslation();
  return (mark: Mark) => (mark.id === "live" ? t("auth.liveGames") : mark.name);
}

// A row of small game signs (also on the phone).
export function GameStrip({ className }: { className?: string }) {
  const nameOf = useNames();
  return (
    <ul className={cn("flex flex-wrap gap-x-3 gap-y-2.5", className)}>
      {marks.map((mark) => (
        <li key={mark.id} className="flex w-[68px] flex-col items-center gap-1">
          <GameTile mark={mark} className="h-11 w-11" />
          <span className="w-full truncate text-center text-[10px] font-medium text-white/80">{nameOf(mark)}</span>
        </li>
      ))}
    </ul>
  );
}

// The big picture of the sign-in page without a photo: the Ravetill sign in the middle (glowing, with a slow shine) and the games around it.
export function GameOrbit({ className }: { className?: string }) {
  const nameOf = useNames();
  const around = marks;
  return (
    <div className={cn("relative aspect-square select-none", className)}>
      <span aria-hidden="true" className="absolute inset-[12%] rounded-full border border-dashed border-white/15 motion-safe:animate-[spin_90s_linear_infinite]" />
      <span aria-hidden="true" className="absolute inset-[27%] rounded-full border border-white/10" />
      <div className="absolute left-1/2 top-1/2 flex w-[36%] -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        <span aria-hidden="true" className="login-anim absolute -inset-[34%] rounded-full bg-[radial-gradient(circle,rgba(255,106,120,0.55),rgba(255,138,61,0.25)_45%,transparent_70%)]" style={{ animation: "login-glow 3.6s ease-in-out infinite" }} />
        <span className="relative block w-[72%] overflow-hidden rounded-[22%] shadow-[0_14px_34px_rgba(255,77,141,0.45)]">
          <LogoMark className="block w-full" />
          <span aria-hidden="true" className="login-anim absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)]" style={{ animation: "login-shine 5s ease-in-out infinite" }} />
        </span>
        <span className="relative mt-2 text-[clamp(20px,2.6vw,32px)] font-extrabold leading-none tracking-[-0.04em] text-white">Rave<span className="bg-[linear-gradient(90deg,#FF4D8D,#FF8A3D)] bg-clip-text text-transparent">till</span></span>
      </div>
      {around.map((mark, index) => {
        const angle = (index * 360) / around.length - 90;
        const x = 50 + 41 * Math.cos((angle * Math.PI) / 180);
        const y = 50 + 41 * Math.sin((angle * Math.PI) / 180);
        return (
          <div key={mark.id} className="absolute flex w-[14.5%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1" style={{ left: `${x}%`, top: `${y}%` }}>
            <div className="login-anim w-full" style={{ animation: `login-float ${4 + (index % 4) * 0.6}s ease-in-out ${-index * 0.7}s infinite` }}>
              <GameTile mark={mark} className="w-full" />
            </div>
            <span className="w-[170%] truncate text-center text-[clamp(9px,1.1vw,12px)] font-semibold text-white/85">{nameOf(mark)}</span>
          </div>
        );
      })}
    </div>
  );
}
