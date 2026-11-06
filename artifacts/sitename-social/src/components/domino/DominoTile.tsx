"use client";

// One domino tile drawn in SVG (ivory face, pips drawn by code; 1-pips red as in the design).
// vertical: a = top half, b = bottom half. horizontal: a = left half, b = right half.
const PIPS: Record<number, [number, number][]> = {
  0: [],
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function Half({ n, y }: { n: number; y: number }) {
  return (
    <>
      {PIPS[n]?.map(([r, c], i) => (
        <circle key={i} cx={22 + c * 28} cy={y + 22 + r * 28} r={8.5} fill={n === 1 ? "url(#dt-red)" : "url(#dt-pip)"} />
      ))}
    </>
  );
}

export function DominoDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <linearGradient id="dt-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fffdf4" />
          <stop offset="1" stopColor="#e4dbc0" />
        </linearGradient>
        <linearGradient id="dt-back" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1d1d22" />
          <stop offset="1" stopColor="#050507" />
        </linearGradient>
        <radialGradient id="dt-pip" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#555" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <radialGradient id="dt-red" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ff6a5a" />
          <stop offset="1" stopColor="#a10f0f" />
        </radialGradient>
      </defs>
    </svg>
  );
}

type Props = {
  a?: number; b?: number; back?: boolean; horizontal?: boolean;
  className?: string; style?: React.CSSProperties; glow?: boolean; dim?: boolean;
};

export function DominoTile({ a = 0, b = 0, back = false, horizontal = false, className = "", style, glow = false, dim = false }: Props) {
  // Drawn vertical (100x200); for horizontal it is turned 90° to the left, so the top half (a) ends up on the left.
  const top = a;
  const bottom = b;
  return (
    <svg
      viewBox={horizontal ? "0 0 200 100" : "0 0 100 200"}
      className={`${className} ${dim ? "opacity-40" : ""}`}
      style={{ filter: glow ? "drop-shadow(0 0 6px #ffd77a) drop-shadow(0 4px 4px #0009)" : "drop-shadow(0 4px 4px #0009)", ...style }}
      aria-label={back ? "domino" : `${a}-${b}`}
    >
      <g transform={horizontal ? "translate(0 100) rotate(-90)" : undefined}>
        <rect x="2" y="2" width="96" height="196" rx="12" fill={back ? "url(#dt-back)" : "url(#dt-face)"} stroke={back ? "#c8973a88" : "#b9ad8a"} strokeWidth="2" />
        {back ? (
          <>
            <rect x="12" y="12" width="76" height="176" rx="6" fill="none" stroke="#c8973a55" strokeWidth="2" />
            <line x1="14" y1="100" x2="86" y2="100" stroke="#c8973a88" strokeWidth="2" />
            <path d="M50 92 L56 100 L50 108 L44 100 Z" fill="#c8973a" />
          </>
        ) : (
          <>
            <line x1="12" y1="100" x2="88" y2="100" stroke="#8a7a4a" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="100" r="4" fill="#c8973a" />
            <Half n={top} y={0} />
            <Half n={bottom} y={100} />
          </>
        )}
      </g>
    </svg>
  );
}
