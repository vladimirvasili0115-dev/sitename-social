"use client";

// Fireworks over a player's photo when an expensive gift lands: rockets rise from the photo and burst into sparks.
// `level` 1–4 sets how many rockets go up. Positions are in percent of the table box, like the seats.
const COLORS = ["#FFD84D", "#FF5A7A", "#5BD1FF", "#9BFF6B", "#C38BFF", "#FF9F43", "#FFFFFF"];

function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function Fireworks({ at, level, seed }: { at: readonly [number, number]; level: number; seed: number }) {
  const count = [0, 2, 3, 4, 5][Math.max(1, Math.min(4, level))];
  const bursts = Array.from({ length: count }, (_, n) => {
    const r = (k: number) => rand(seed * 31 + n * 7 + k);
    return {
      x: (r(1) - 0.5) * 40,
      y: -14 - r(2) * 22,
      delay: n * 280 + r(3) * 120,
      color: COLORS[Math.floor(r(4) * COLORS.length)],
      second: COLORS[Math.floor(r(5) * COLORS.length)],
      size: 14 + r(6) * 7,
    };
  });
  return (
    <div aria-hidden="true" className="pointer-events-none absolute z-40 h-0 w-0" style={{ left: `${at[0]}%`, top: `${at[1]}%` }}>
      {bursts.map((burst, n) => (
        <div key={n}>
          <span className="absolute -left-[0.5cqmin] -top-[0.5cqmin] h-[1.4cqmin] w-[1.4cqmin] rounded-full bg-white shadow-[0_0_10px_4px_rgba(255,220,120,0.95)]"
            style={{ ["--rx" as string]: `${burst.x}cqmin`, ["--ry" as string]: `${burst.y}cqmin`, animation: `fw-rocket 480ms cubic-bezier(0.2,0.7,0.4,1) ${burst.delay}ms both` }} />
          <span className="absolute -left-[3cqmin] -top-[3cqmin] h-[9cqmin] w-[9cqmin] rounded-full"
            style={{ left: `calc(${burst.x}cqmin - 4.5cqmin)`, top: `calc(${burst.y}cqmin - 4.5cqmin)`, background: `radial-gradient(circle, #FFFFFF, ${burst.color} 40%, transparent 70%)`, animation: `fw-flash 500ms ease-out ${burst.delay + 470}ms both` }} />
          {Array.from({ length: 12 }, (_, k) => {
            const angle = (k / 12) * Math.PI * 2;
            const reach = burst.size * (k % 3 === 0 ? 0.55 : k % 2 ? 0.8 : 1);
            const color = k % 3 ? burst.color : burst.second;
            return (
              <span key={k} className="absolute h-[2cqmin] w-[2cqmin] rounded-full will-change-transform"
                style={{ left: `calc(${burst.x}cqmin - 0.85cqmin)`, top: `calc(${burst.y}cqmin - 0.85cqmin)`, background: `radial-gradient(circle, #FFFFFF 15%, ${color} 55%)`,
                  ["--dx" as string]: `${Math.cos(angle) * reach}cqmin`, ["--dy" as string]: `${Math.sin(angle) * reach}cqmin`,
                  animation: `fw-spark 1300ms cubic-bezier(0.1,0.8,0.3,1) ${burst.delay + 470}ms both` }} />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// How big the show is for a gift of this price: nothing below 100 hearts.
export const fireworksLevel = (price: number) => (price >= 500 ? 4 : price >= 350 ? 3 : price >= 200 ? 2 : price >= 100 ? 1 : 0);
