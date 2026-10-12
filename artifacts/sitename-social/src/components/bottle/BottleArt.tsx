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

// The table top: a real-looking honey wood texture (public/bottle/wood.jpg), lighter in the middle.
export function WoodTable({ className }: { className?: string }) {
  return <div aria-hidden="true" className={className} style={{ backgroundColor: "#D2924C", backgroundImage: "url(/bottle/wood.jpg)", backgroundSize: "cover", backgroundPosition: "center" }} />;
}

// Cover tile for the games list: the bottle on a wooden table with hearts and spin arrows.
export function BottleCover({ className }: { className?: string }) {
  const heart = "M0 9C-7 4-10 .5-10-3.500-10-7-7.500-9-4.800-9-2.800-9-1-8 0-6.300 1-8 2.800-9 4.800-9 7.500-9 10-7 10-3.500 10 .5 7 4 0 9z";
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="bc-wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F3B455" /><stop offset="1" stopColor="#C97A26" /></linearGradient>
        <linearGradient id="bc-glass" x1="0" x2="1"><stop offset="0" stopColor="#2E9E3F" /><stop offset="0.45" stopColor="#9BE36B" /><stop offset="1" stopColor="#23802F" /></linearGradient>
      </defs>
      <rect width="96" height="96" fill="url(#bc-wood)" />
      <path d="M0 22q48 6 96-3M0 50q48-7 96 2M0 76q48 6 96-2" fill="none" stroke="#8A4B12" strokeWidth="1" opacity="0.25" />
      <g fill="none" stroke="#A8641C" strokeWidth="5" strokeLinecap="round" opacity="0.75">
        <path d="M70 20a34 34 0 0 1 12 34" /><path d="M26 76a34 34 0 0 1-12-34" />
      </g>
      <path d="M86 50l-10 3 8 8zM10 46l10-3-8-8z" fill="#A8641C" opacity="0.75" />
      <g transform="rotate(32 48 48)">
        <ellipse cx="50" cy="52" rx="11" ry="30" fill="#000000" opacity="0.15" />
        <path d="M44 14h8v16c0 7 8 11 8 24v22c0 5-3 8-7 8H43c-4 0-7-3-7-8V54c0-13 8-17 8-24z" fill="url(#bc-glass)" stroke="#1B6B28" strokeWidth="1.500" />
        <rect x="43" y="11" width="10" height="5" rx="1.500" fill="#1B6B28" />
        <path d="M41 44c-2 5-2 12-2 22" stroke="#EFFFE0" strokeWidth="2.500" strokeLinecap="round" fill="none" opacity="0.7" />
      </g>
      <g fill="#F4511E" stroke="#FFFFFF" strokeWidth="1.200">
        <path d={heart} transform="translate(72 38) rotate(14) scale(1.150)" /><path d={heart} transform="translate(22 60) rotate(-12)" /><path d={heart} transform="translate(64 78) scale(.8)" />
      </g>
    </svg>
  );
}
