// Decorative photo frames for the "Style" shop: drawn here, with bevelled metal, corner ornaments and gems.
// Each frame sits over the photo; the middle stays clear.

type Look = { metal: [string, string, string]; inner: string; gem: string; corner: "gem" | "diamond" | "star" | "flower" | "heart" | "crown"; edge: "plain" | "dots" | "chain" | "stripes" | "wave"; vip?: boolean; pass?: boolean };

export const FRAME_PRICE = 500;
export const frameLooks: Look[] = [
  { metal: ["#FFF1B8", "#E2A814", "#8A5A00"], inner: "#FFE47A", gem: "#E5283A", corner: "gem", edge: "plain" },
  { metal: ["#FFFFFF", "#B9C2CC", "#5E6772"], inner: "#E7ECF1", gem: "#2F80ED", corner: "diamond", edge: "dots" },
  { metal: ["#FFD8B0", "#C2732E", "#6B3610"], inner: "#F2B37A", gem: "#2EB872", corner: "flower", edge: "plain", vip: true },
  { metal: ["#FFC9E4", "#E8559B", "#8C1D58"], inner: "#FFB0D6", gem: "#FFFFFF", corner: "heart", edge: "wave" },
  { metal: ["#C9E9FF", "#3E97E0", "#14508A"], inner: "#9FD3FF", gem: "#FFD23F", corner: "star", edge: "stripes" },
  { metal: ["#E9D5FF", "#9B5DE5", "#4C1D8F"], inner: "#D4B6FF", gem: "#33D1C9", corner: "gem", edge: "chain" },
  { metal: ["#D9FBE5", "#30B565", "#0E5C2F"], inner: "#A6EBC0", gem: "#FF7A1A", corner: "flower", edge: "dots" },
  { metal: ["#3B3F46", "#1B1E23", "#000000"], inner: "#5A616B", gem: "#FFC21A", corner: "crown", edge: "plain", vip: true },
  { metal: ["#FFF1B8", "#E2A814", "#8A5A00"], inner: "#FFE47A", gem: "#3E97E0", corner: "crown", edge: "chain" },
  { metal: ["#FFE0E0", "#E63946", "#7A0E17"], inner: "#FF9AA2", gem: "#FFD23F", corner: "heart", edge: "plain" },
  { metal: ["#FFFFFF", "#B9C2CC", "#5E6772"], inner: "#E7ECF1", gem: "#E5283A", corner: "star", edge: "wave" },
  { metal: ["#E0FBFF", "#1FB6C9", "#0B5966"], inner: "#9CEAF3", gem: "#FFFFFF", corner: "diamond", edge: "stripes" },
  { metal: ["#FFF4D6", "#F2A541", "#8C4B00"], inner: "#FFD38A", gem: "#9B5DE5", corner: "flower", edge: "chain" },
  { metal: ["#F1F5D0", "#A3B52A", "#4E5A0B"], inner: "#DCE88C", gem: "#E5283A", corner: "gem", edge: "dots" },
  { metal: ["#FFD8B0", "#C2732E", "#6B3610"], inner: "#F2B37A", gem: "#30B565", corner: "crown", edge: "stripes" },
  { metal: ["#E9D5FF", "#9B5DE5", "#4C1D8F"], inner: "#D4B6FF", gem: "#FFD23F", corner: "star", edge: "plain", vip: true },
  { metal: ["#FFC9E4", "#E8559B", "#8C1D58"], inner: "#FFB0D6", gem: "#9B5DE5", corner: "diamond", edge: "chain" },
  { metal: ["#C9E9FF", "#3E97E0", "#14508A"], inner: "#9FD3FF", gem: "#FFFFFF", corner: "heart", edge: "dots" },
  { metal: ["#3B3F46", "#1B1E23", "#000000"], inner: "#5A616B", gem: "#E5283A", corner: "gem", edge: "wave" },
  { metal: ["#FFF1B8", "#E2A814", "#8A5A00"], inner: "#FFE47A", gem: "#30B565", corner: "flower", edge: "wave", vip: true },
  { metal: ["#D9FBE5", "#30B565", "#0E5C2F"], inner: "#A6EBC0", gem: "#FFFFFF", corner: "star", edge: "chain" },
  { metal: ["#FFE0E0", "#E63946", "#7A0E17"], inner: "#FF9AA2", gem: "#FFFFFF", corner: "crown", edge: "dots" },
  { metal: ["#E0FBFF", "#1FB6C9", "#0B5966"], inner: "#9CEAF3", gem: "#E8559B", corner: "heart", edge: "chain" },
  { metal: ["#FFFFFF", "#B9C2CC", "#5E6772"], inner: "#E7ECF1", gem: "#FFC21A", corner: "crown", edge: "stripes", vip: true },
  // 25: "Nitro" — only from the season pass (level 35, premium); cannot be bought.
  { metal: ["#FFE89A", "#C8920A", "#2A1A00"], inner: "#1B1B1F", gem: "#B44CFF", corner: "crown", edge: "chain", pass: true },
];

function Ornament({ kind, gem, metal, x, y, id }: { kind: Look["corner"]; gem: string; metal: Look["metal"]; x: number; y: number; id: string }) {
  const gemFill = `url(#${id}-gem)`;
  const base = <circle cx={x} cy={y} r="8.5" fill={`url(#${id}-metal)`} stroke={metal[2]} strokeWidth="0.8" />;
  if (kind === "gem") return <g>{base}<circle cx={x} cy={y} r="5" fill={gemFill} stroke={metal[2]} strokeWidth="0.6" /><circle cx={x - 1.6} cy={y - 1.8} r="1.4" fill="#FFFFFF" opacity="0.8" /></g>;
  if (kind === "diamond") return <g>{base}<path d={`M${x} ${y - 6}L${x + 5} ${y}L${x} ${y + 6}L${x - 5} ${y}Z`} fill={gemFill} stroke={metal[2]} strokeWidth="0.6" /><path d={`M${x} ${y - 6}L${x - 2} ${y}L${x} ${y + 6}`} fill="#FFFFFF" opacity="0.35" /></g>;
  if (kind === "star") {
    const points = Array.from({ length: 10 }, (_, n) => { const r = n % 2 ? 2.6 : 6.2; const a = (Math.PI / 5) * n - Math.PI / 2; return `${(x + r * Math.cos(a)).toFixed(2)},${(y + r * Math.sin(a)).toFixed(2)}`; }).join(" ");
    return <g>{base}<polygon points={points} fill={gemFill} stroke={metal[2]} strokeWidth="0.5" /></g>;
  }
  if (kind === "flower") return <g>{base}{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={x} cy={y - 3.6} rx="2.2" ry="3.4" fill={gemFill} transform={`rotate(${a} ${x} ${y})`} />)}<circle cx={x} cy={y} r="1.9" fill="#FFF3B0" /></g>;
  if (kind === "heart") return <g>{base}<path d={`M${x} ${y + 4.6}C${x - 6} ${y + 0.6} ${x - 5.6} ${y - 5} ${x - 2.6} ${y - 4.6}C${x - 1.2} ${y - 4.4} ${x} ${y - 3} ${x} ${y - 2}C${x} ${y - 3} ${x + 1.2} ${y - 4.4} ${x + 2.6} ${y - 4.6}C${x + 5.6} ${y - 5} ${x + 6} ${y + 0.6} ${x} ${y + 4.6}Z`} fill={gemFill} /></g>;
  return <g>{base}<path d={`M${x - 5.4} ${y + 3}L${x - 5.4} ${y - 3.4}L${x - 2.6} ${y - 0.6}L${x} ${y - 5}L${x + 2.6} ${y - 0.6}L${x + 5.4} ${y - 3.4}L${x + 5.4} ${y + 3}Z`} fill={gemFill} stroke={metal[2]} strokeWidth="0.5" /></g>;
}

// The original game's frames (public/custom/frames): ids 26 and up, in this order. Most of them move (frames/anim).
export const ORIGINAL_FRAMES = ["amber", "amethyst", "angel", "carameldecor", "cardsdecor", "chipsdecor", "cinemadecor", "daydecor", "demon", "diamond", "discodecor", "eastdecor", "egyptdecor", "emerald", "fruitjellydecor", "gold", "greendecor", "hatreddecor", "heartsdecor", "icedecor", "kissesdecor", "lavadecor", "loungedecor", "lovedecor", "mambadecor", "marsdecor", "naturedecor", "nightdecor", "nitrodecor", "pearls", "pitviperdecor", "platinum", "rockdecor", "romedecor", "ruby", "sapphire", "silver", "stonedecor", "theatredecor", "topaz", "tourismdecor", "turbodecor", "venusdecor", "violetdecor", "westdecor"];
const STILL_ONLY = new Set(["amber", "gold", "platinum", "silver"]);
export const FIRST_ORIGINAL = 26;
export const originalFrame = (id: number) => (id >= FIRST_ORIGINAL ? ORIGINAL_FRAMES[id - FIRST_ORIGINAL] ?? null : null);
// The small stone shown next to the name in the chat for a player wearing an original frame.
export const frameStone = (id: number) => { const type = originalFrame(id); return type ? `/custom/stones/${type}.webp` : null; };

export function FrameArt({ id, className, still }: { id: number; className?: string; still?: boolean }) {
  const type = originalFrame(id);
  if (type) return <img src={`/custom/frames/${still || STILL_ONLY.has(type) ? "" : "anim/"}${type}.webp`} alt="" aria-hidden="true" draggable={false} className={`max-w-none select-none object-contain ${className ?? ""}`} />;
  const look = frameLooks[id - 1];
  if (!look) return null;
  const key = `fr${id}`;
  const { metal, inner, gem, corner, edge } = look;
  const ring = "M4 14Q4 4 14 4H86Q96 4 96 14V86Q96 96 86 96H14Q4 96 4 86ZM15 11Q11 11 11 15V85Q11 89 15 89H85Q89 89 89 85V15Q89 11 85 11Z";
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={`${key}-metal`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={metal[0]} /><stop offset="0.45" stopColor={metal[1]} /><stop offset="0.8" stopColor={metal[2]} /><stop offset="1" stopColor={metal[1]} /></linearGradient>
        <radialGradient id={`${key}-gem`} cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.35" stopColor={gem} /><stop offset="1" stopColor={gem} stopOpacity="0.75" /></radialGradient>
        <filter id={`${key}-shadow`} x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="#000000" floodOpacity="0.45" /></filter>
      </defs>
      <g filter={`url(#${key}-shadow)`}>
        <path d={ring} fillRule="evenodd" fill={`url(#${key}-metal)`} />
        <path d="M4.8 14Q4.8 4.8 14 4.8H86Q95.2 4.8 95.2 14" fill="none" stroke="#FFFFFF" strokeOpacity="0.75" strokeWidth="1.1" />
        <path d="M95.2 86Q95.2 95.2 86 95.2H14Q4.8 95.2 4.8 86" fill="none" stroke="#000000" strokeOpacity="0.25" strokeWidth="1.1" />
        <rect x="10.5" y="10.5" width="79" height="79" rx="4.5" fill="none" stroke={inner} strokeWidth="1.4" />
        <rect x="11.6" y="11.6" width="76.8" height="76.8" rx="3.8" fill="none" stroke="#000000" strokeOpacity="0.3" strokeWidth="0.7" />
        {edge === "dots" ? [20, 30, 40, 60, 70, 80].flatMap((p) => [[p, 7.5], [p, 92.5], [7.5, p], [92.5, p]]).map(([cx, cy], n) => <circle key={n} cx={cx} cy={cy} r="1.3" fill={inner} stroke={metal[2]} strokeWidth="0.4" />) : null}
        {edge === "chain" ? [18, 26, 34, 42, 58, 66, 74, 82].flatMap((p) => [[p, 7.5, 0], [p, 92.5, 0], [7.5, p, 90], [92.5, p, 90]]).map(([cx, cy, r], n) => <ellipse key={n} cx={cx} cy={cy} rx="3.2" ry="1.7" fill="none" stroke={inner} strokeWidth="0.9" transform={`rotate(${r} ${cx} ${cy})`} />) : null}
        {edge === "stripes" ? <path d="M18 4l-4 7M28 4l-4 7M38 4l-4 7M66 4l-4 7M76 4l-4 7M86 4l-4 7M18 89l-4 7M28 89l-4 7M38 89l-4 7M66 89l-4 7M76 89l-4 7M86 89l-4 7M4 22l7-4M4 32l7-4M4 42l7-4M4 66l7-4M4 76l7-4M4 86l7-4M89 22l7-4M89 32l7-4M89 42l7-4M89 66l7-4M89 76l7-4M89 86l7-4" stroke={inner} strokeOpacity="0.8" strokeWidth="1.2" /> : null}
        {edge === "wave" ? <path d="M16 7.5q4-3 8 0t8 0 8 0M60 7.5q4-3 8 0t8 0 8 0M16 92.5q4-3 8 0t8 0 8 0M60 92.5q4-3 8 0t8 0 8 0M7.5 16q-3 4 0 8t0 8 0 8M7.5 60q-3 4 0 8t0 8 0 8M92.5 16q-3 4 0 8t0 8 0 8M92.5 60q-3 4 0 8t0 8 0 8" fill="none" stroke={inner} strokeWidth="1.1" /> : null}
        {[[50, 7.5], [50, 92.5], [7.5, 50], [92.5, 50]].map(([cx, cy], n) => <g key={n}><circle cx={cx} cy={cy} r="3.6" fill={`url(#${key}-gem)`} stroke={metal[2]} strokeWidth="0.6" /><circle cx={cx - 1.1} cy={cy - 1.2} r="0.9" fill="#FFFFFF" opacity="0.85" /></g>)}
        {[[9, 9], [91, 9], [9, 91], [91, 91]].map(([cx, cy], n) => <Ornament key={n} kind={corner} gem={gem} metal={metal} x={cx} y={cy} id={key} />)}
      </g>
    </svg>
  );
}
