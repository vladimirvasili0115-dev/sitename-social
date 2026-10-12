// Original artwork for the game: a clear sea-green glass bottle (no brand marks); the table shows through the glass.
export function BottleSvg({ className }: { className?: string }) {
  const body = "M27 6h12v4c0 2 1 3 1 6v28c0 14 18 22 18 46v92c0 8-5 13-13 13H21c-8 0-13-5-13-13V90c0-24 18-32 18-46V16c0-3 1-4 1-6z";
  return (
    <svg viewBox="0 0 66 200" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="bt-glass" x1="0" x2="1">
          <stop offset="0" stopColor="#3F7F68" stopOpacity="0.95" /><stop offset="0.12" stopColor="#7DB9A0" stopOpacity="0.75" /><stop offset="0.35" stopColor="#B9E2CF" stopOpacity="0.5" />
          <stop offset="0.6" stopColor="#A6D7C2" stopOpacity="0.5" /><stop offset="0.86" stopColor="#6FAE94" stopOpacity="0.75" /><stop offset="1" stopColor="#3A7660" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="bt-depth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#DFF5EA" stopOpacity="0.25" /><stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0" /><stop offset="0.92" stopColor="#2F6B55" stopOpacity="0.25" /><stop offset="1" stopColor="#24594A" stopOpacity="0.55" /></linearGradient>
        <radialGradient id="bt-shadow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#3B1C04" stopOpacity="0.45" /><stop offset="1" stopColor="#3B1C04" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="35" cy="196" rx="32" ry="5" fill="url(#bt-shadow)" />
      <path d={body} fill="url(#bt-glass)" />
      <path d={body} fill="url(#bt-depth)" />
      <path d={body} fill="none" stroke="#2E6652" strokeWidth="1.100" opacity="0.65" />
      <path d="M26 6h14v3.500H26z" fill="#CBEBDD" opacity="0.8" stroke="#2E6652" strokeWidth="0.800" />
      <path d="M26.500 13c4 1.500 9 1.500 13 0" stroke="#2E6652" strokeWidth="0.900" fill="none" opacity="0.5" />
      <path d="M11 186c6 7 38 7 44 0" fill="none" stroke="#24594A" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
      <path d="M13 181c6 5 34 5 40 0" fill="none" stroke="#E6FFF4" strokeWidth="1.400" strokeLinecap="round" opacity="0.55" />
      <path d="M14 96c-1.500 22-1.500 52 0 78" stroke="#FFFFFF" strokeWidth="3.200" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M19 98c-0.800 20-0.800 44 0 66" stroke="#FFFFFF" strokeWidth="1.200" strokeLinecap="round" fill="none" opacity="0.35" />
      <path d="M30 14v30" stroke="#FFFFFF" strokeWidth="1.800" strokeLinecap="round" fill="none" opacity="0.55" />
      <path d="M21 62c-6 6-9 13-10 22" stroke="#FFFFFF" strokeWidth="2.200" strokeLinecap="round" fill="none" opacity="0.45" />
      <path d="M52 100c1.200 20 1.200 46 0 66" stroke="#24594A" strokeWidth="2.200" strokeLinecap="round" fill="none" opacity="0.3" />
    </svg>
  );
}

// A plain plastic water bottle (no brand): used for the "local waters" bottle set.
export function WaterBottleSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 66 200" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="wb-body" x1="0" x2="1"><stop offset="0" stopColor="#8FCBEA" /><stop offset="0.35" stopColor="#E6F6FF" /><stop offset="0.7" stopColor="#B5DDF3" /><stop offset="1" stopColor="#7BBBE0" /></linearGradient>
        <linearGradient id="wb-label" x1="0" x2="1"><stop offset="0" stopColor="#1D6FB8" /><stop offset="0.5" stopColor="#3D9BE0" /><stop offset="1" stopColor="#185C9B" /></linearGradient>
      </defs>
      <ellipse cx="33" cy="194" rx="25" ry="4" fill="#5A2E05" opacity="0.25" />
      <path d="M25 22h16v16c0 8 15 14 15 32v112c0 7-4 11-11 11H21c-7 0-11-4-11-11V70c0-18 15-24 15-32z" fill="url(#wb-body)" stroke="#5FA6CF" strokeWidth="1.200" />
      <rect x="23" y="6" width="20" height="14" rx="3" fill="#1D6FB8" stroke="#124C82" strokeWidth="1" />
      <path d="M27 7v12M31 7v12M35 7v12M39 7v12" stroke="#124C82" strokeWidth="0.800" opacity="0.6" />
      <rect x="23.500" y="20" width="19" height="3.500" rx="1.500" fill="#D5EEFB" stroke="#5FA6CF" strokeWidth="0.800" />
      <path d="M10 92h46M10 150h46M10 162h46M10 174h46" stroke="#5FA6CF" strokeWidth="1.200" opacity="0.55" />
      <rect x="10" y="98" width="46" height="46" fill="url(#wb-label)" />
      <path d="M18 134l10-18 6 9 5-7 9 16z" fill="#FFFFFF" opacity="0.95" />
      <path d="M10 138c10-5 16 4 23 0s14-4 23 0v6H10z" fill="#BFE6FF" />
      <path d="M16 60c-2 8-2 18-2 28" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
      <path d="M15 152v30" stroke="#FFFFFF" strokeWidth="2.500" strokeLinecap="round" fill="none" opacity="0.7" />
    </svg>
  );
}

// The table top: a real-looking honey wood texture (public/bottle/table.jpg), lighter in the middle.
export function WoodTable({ className }: { className?: string }) {
  return <div aria-hidden="true" className={className} style={{ backgroundColor: "#D2924C", backgroundImage: "url(/bottle/table.jpg)", backgroundSize: "cover", backgroundPosition: "center" }} />;
}

// Cover tile for the games list: the bottle on a wooden table with hearts and spin arrows.
export function BottleCover({ className }: { className?: string }) {
  // Original tile: the bottle lies on our wood table, a glossy heart floats from its neck, the Azerbaijani flag waves on top.
  const wave = "M18 8C30 4 38 12 50 8S70 4 78 8V30C66 26 58 34 46 30S26 26 18 30Z";
  const star = Array.from({ length: 16 }, (_, i) => { const r = i % 2 ? 1.25 : 2.6; const a = (Math.PI / 8) * i - Math.PI / 2; return `${(52.6 + r * Math.cos(a)).toFixed(2)},${(19 + r * Math.sin(a)).toFixed(2)}`; }).join(" ");
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true" className={className}>
      <defs>
        <clipPath id="bc-flag"><path d={wave} /></clipPath>
        <linearGradient id="bc-fold" x1="0" x2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.25" /><stop offset="0.25" stopColor="#000000" stopOpacity="0.12" /><stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.2" /><stop offset="0.75" stopColor="#000000" stopOpacity="0.12" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0.15" /></linearGradient>
        <linearGradient id="bc-glass" x1="0" x2="1"><stop offset="0" stopColor="#3F7F68" /><stop offset="0.3" stopColor="#B9E2CF" stopOpacity="0.85" /><stop offset="0.65" stopColor="#8CC7AE" stopOpacity="0.85" /><stop offset="1" stopColor="#2F6B55" /></linearGradient>
        <radialGradient id="bc-heart" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#FF8A7A" /><stop offset="0.55" stopColor="#F2343F" /><stop offset="1" stopColor="#B3122A" /></radialGradient>
        <radialGradient id="bc-light" cx="0.5" cy="0.55" r="0.6"><stop offset="0" stopColor="#FFE3A8" stopOpacity="0.55" /><stop offset="1" stopColor="#FFE3A8" stopOpacity="0" /></radialGradient>
      </defs>
      <image href="/bottle/table.jpg" x="-40" y="-10" width="176" height="121" preserveAspectRatio="xMidYMid slice" />
      <rect width="96" height="96" fill="url(#bc-light)" />
      <line x1="17" y1="6" x2="17" y2="44" stroke="#6B4423" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="5.5" r="1.8" fill="#F5C451" />
      <g clipPath="url(#bc-flag)">
        <rect x="16" y="2" width="64" height="12.3" fill="#00B5E2" />
        <rect x="16" y="13.3" width="64" height="11" fill="#EF3340" />
        <rect x="16" y="23.3" width="64" height="12" fill="#509E2F" />
        <circle cx="47.6" cy="19" r="4.2" fill="#FFFFFF" />
        <circle cx="48.9" cy="19" r="3.4" fill="#EF3340" />
        <polygon points={star} fill="#FFFFFF" />
        <rect x="16" y="0" width="64" height="40" fill="url(#bc-fold)" />
      </g>
      <path d={wave} fill="none" stroke="#000000" strokeOpacity="0.12" strokeWidth="0.6" />
      <ellipse cx="50" cy="80" rx="30" ry="5" fill="#3B1C04" opacity="0.25" />
      <g transform="translate(57 63) rotate(-60) scale(1.02) translate(-10 -32)">
        <path d="M8 0h4v1.500c0 1 .5 1.500.5 3V14c0 5 7 8 7 17v28c0 3-2 5-5 5H6c-3 0-5-2-5-5V31c0-9 7-12 7-17V4.500c0-1.500.5-2 .5-3z" fill="url(#bc-glass)" stroke="#2E6652" strokeWidth="0.8" />
        <rect x="7.5" y="-0.5" width="5" height="2.2" rx="0.6" fill="#CBEBDD" stroke="#2E6652" strokeWidth="0.5" />
        <path d="M4.500 33v24" stroke="#FFFFFF" strokeWidth="1.600" strokeLinecap="round" opacity="0.75" />
        <path d="M10 3v10" stroke="#FFFFFF" strokeWidth="0.9" strokeLinecap="round" opacity="0.6" />
      </g>
      <g transform="translate(25 50) rotate(-14) scale(1.15)">
        <path d="M0 12C-10 5-14 0-14-5.500-14-10.500-10.500-13.500-6.500-13.500-3.500-13.500-1.200-12-0 -9.500 1.200-12 3.500-13.500 6.500-13.500 10.500-13.500 14-10.500 14-5.500 14 0 10 5 0 12z" fill="url(#bc-heart)" stroke="#FFFFFF" strokeWidth="1.300" />
        <ellipse cx="-6" cy="-7.500" rx="3.500" ry="2.200" fill="#FFFFFF" opacity="0.7" transform="rotate(-30 -6 -7.500)" />
      </g>
      <g fill="#FFF3C4">
        <path d="M80 44l1.200 3 3 1.200-3 1.200-1.200 3-1.200-3-3-1.200 3-1.200z" />
        <path d="M12 72l.9 2.200 2.200.9-2.200.9-.9 2.200-.9-2.200-2.200-.9 2.200-.9z" opacity="0.85" />
        <path d="M84 70l.7 1.700 1.700.7-1.700.7-.7 1.700-.7-1.700-1.700-.7 1.700-.7z" opacity="0.8" />
      </g>
    </svg>
  );
}
