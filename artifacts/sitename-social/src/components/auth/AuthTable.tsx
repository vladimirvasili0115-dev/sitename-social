"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

// The login page's own little game table: the real bottle from the game spins when it is tapped,
// points at one of the eight seats, and a gift flies over to whoever it picked.
const seats = [
  { name: "Aysel", hue: 338 }, { name: "Elvin", hue: 205 }, { name: "Nigar", hue: 28 }, { name: "Rəşad", hue: 152 },
  { name: "Leyla", hue: 280 }, { name: "Kamran", hue: 12 }, { name: "Səbinə", hue: 182 }, { name: "Orxan", hue: 46 },
];
const gifts = ["rose", "crown1", "champagne", "heart1", "teddybear", "cake", "air_kiss1"];
const SPIN_MS = 3600;
const RADIUS = 40; // seat centres sit on a circle this far from the middle (% of the table box)
const at = (index: number) => {
  const angle = (index * 360) / seats.length;
  return { x: 50 + RADIUS * Math.sin((angle * Math.PI) / 180), y: 50 - RADIUS * Math.cos((angle * Math.PI) / 180), angle };
};

export function AuthTable({ className, onPick }: { className?: string; onPick?: (name: string | null, spinning: boolean) => void }) {
  const { t } = useTranslation();
  const [turn, setTurn] = useState(0); // total degrees the bottle has turned
  const [spinning, setSpinning] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [gift, setGift] = useState<{ key: number; src: string; seat: number; landed: boolean } | null>(null);
  const turnRef = useRef(0);
  const lastRef = useRef(-1);
  const keyRef = useRef(0);
  const timers = useRef<number[]>([]);
  const calm = useRef(false);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  function spin() {
    if (spinning) return;
    let seat = Math.floor(Math.random() * seats.length);
    if (seat === lastRef.current) seat = (seat + 3) % seats.length;
    lastRef.current = seat;
    const current = ((turnRef.current % 360) + 360) % 360;
    const next = turnRef.current + 360 * (4 + Math.floor(Math.random() * 2)) + ((at(seat).angle - current + 360) % 360);
    turnRef.current = next;
    const wait = calm.current ? 0 : SPIN_MS;
    setPicked(null);
    setGift(null);
    setSpinning(true);
    onPick?.(null, true);
    setTurn(next);
    later(() => {
      setSpinning(false);
      setPicked(seat);
      onPick?.(seats[seat].name, false);
      const key = ++keyRef.current;
      setGift({ key, src: gifts[Math.floor(Math.random() * gifts.length)], seat, landed: false });
      later(() => setGift((value) => (value?.key === key ? { ...value, landed: true } : value)), 40);
      later(() => setGift((value) => (value?.key === key ? null : value)), 3200);
    }, wait + 60);
  }

  useEffect(() => {
    calm.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const first = window.setTimeout(() => { if (!calm.current) spin(); }, 1100);
    const all = timers.current;
    return () => { window.clearTimeout(first); all.forEach((id) => window.clearTimeout(id)); };
    // the first spin runs once when the page opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The gift lands on the table edge, right next to the picked seat, so the seat's letter stays visible.
  const flight = gift ? (() => { const spot = at(gift.seat); const pull = (RADIUS - 11) / RADIUS; return { x: 50 + (spot.x - 50) * pull, y: 50 + (spot.y - 50) * pull }; })() : null;
  return (
    <div className={cn("relative aspect-square select-none", className)}>
      <div aria-hidden="true" className="absolute inset-[10%] rounded-full shadow-[0_30px_70px_rgba(0,0,0,0.55),inset_0_0_0_7px_#5A3219,inset_0_0_0_9px_rgba(255,214,160,0.18)]" style={{ background: "repeating-radial-gradient(circle at 50% 50%, rgba(0,0,0,0.07) 0 2px, transparent 2px 7px), radial-gradient(circle at 50% 40%, #B67845 0%, #85502B 52%, #4E2B16 100%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-[10%] rounded-full" style={{ background: "radial-gradient(circle at 50% 36%, rgba(255,205,130,0.38), transparent 58%)" }} />
      {seats.map((seat, index) => {
        const spot = at(index);
        const chosen = picked === index;
        return (
          <span key={seat.name} aria-hidden="true" className={cn("absolute flex h-[17%] w-[17%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white/85 font-['Lilita_One'] text-[clamp(14px,3.2vw,26px)] text-white shadow-[0_6px_16px_rgba(0,0,0,0.45)] transition-[transform,opacity,box-shadow] duration-500", chosen ? "z-10 scale-[1.18] shadow-[0_0_0_4px_#FFB547,0_0_34px_8px_rgba(255,181,71,0.65)]" : picked !== null || spinning ? "opacity-70" : "")} style={{ left: `${spot.x}%`, top: `${spot.y}%`, background: `linear-gradient(145deg, hsl(${seat.hue} 80% 62%), hsl(${(seat.hue + 28) % 360} 75% 42%))` }}>
            {Array.from(seat.name)[0]}
          </span>
        );
      })}
      {gift && flight ? (
        <img src={`/custom/gifts/${gift.src}.webp`} alt="" aria-hidden="true" draggable={false} className="pointer-events-none absolute z-20 h-[13%] w-[13%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.45)]" style={{ left: `${gift.landed ? flight.x : 50}%`, top: `${gift.landed ? flight.y : 50}%`, transform: `translate(-50%, -50%) scale(${gift.landed ? 1.25 : 0.6})`, transition: "left 1.1s cubic-bezier(0.25,0.8,0.25,1), top 1.1s cubic-bezier(0.25,0.8,0.25,1), transform 1.1s ease-out" }} />
      ) : null}
      <button type="button" onClick={spin} disabled={spinning} aria-label={t(picked === null ? "auth.spinBtn" : "auth.spinAgain")} className="absolute left-1/2 top-1/2 z-[5] h-[42%] w-[14%] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#FFB547] disabled:cursor-default">
        <img src="/custom/bottles/1/base.webp" alt="" aria-hidden="true" draggable={false} className="pointer-events-none h-full w-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" style={{ transform: `rotate(${turn}deg)`, transition: spinning && !calm.current ? `transform ${SPIN_MS}ms cubic-bezier(0.12,0.62,0.08,1)` : "none" }} />
      </button>
    </div>
  );
}
