// Original artwork for the game: a plain green glass bottle, drawn here (no brand marks).
export function BottleSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 66 200" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="bt-glass" x1="0" x2="1">
          <stop offset="0" stopColor="#2C7A12" /><stop offset="0.14" stopColor="#4FA524" /><stop offset="0.38" stopColor="#7CCB45" /><stop offset="0.62" stopColor="#57AE29" /><stop offset="0.88" stopColor="#3A8E18" /><stop offset="1" stopColor="#256A0E" />
        </linearGradient>
        <linearGradient id="bt-depth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.12" /><stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0" /><stop offset="1" stopColor="#0E3D05" stopOpacity="0.35" /></linearGradient>
      </defs>
      <ellipse cx="33" cy="194" rx="27" ry="4" fill="#5A2E05" opacity="0.28" />
      <path id="bt-body" d="M26 12h14v40c0 13 19 20 19 44v84c0 8-5 13-13 13H20c-8 0-13-5-13-13V96c0-24 19-31 19-44z" fill="url(#bt-glass)" />
      <path d="M26 12h14v40c0 13 19 20 19 44v84c0 8-5 13-13 13H20c-8 0-13-5-13-13V96c0-24 19-31 19-44z" fill="url(#bt-depth)" />
      <path d="M26 12h14v40c0 13 19 20 19 44v84c0 8-5 13-13 13H20c-8 0-13-5-13-13V96c0-24 19-31 19-44z" fill="none" stroke="#1F5F0B" strokeWidth="1.200" opacity="0.7" />
      <rect x="23.500" y="3" width="19" height="6" rx="2.500" fill="#4FA524" stroke="#1F5F0B" strokeWidth="1" />
      <rect x="24.500" y="9" width="17" height="5" rx="2" fill="#3A8E18" stroke="#1F5F0B" strokeWidth="1" />
      <path d="M26.500 4.800h13" stroke="#C9F2A4" strokeWidth="1.200" strokeLinecap="round" opacity="0.8" />
      <path d="M12 178c5 10 37 10 42 0" fill="none" stroke="#C9F2A4" strokeWidth="2.500" strokeLinecap="round" opacity="0.55" />
      <path d="M14 186c6 6 32 6 38 0" fill="none" stroke="#1F5F0B" strokeWidth="1.500" strokeLinecap="round" opacity="0.5" />
      <path d="M15 100c-1.500 20-1.500 48 0 70" stroke="#E4FBCB" strokeWidth="3.500" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M29.500 18v32" stroke="#E4FBCB" strokeWidth="2.200" strokeLinecap="round" fill="none" opacity="0.55" />
      <path d="M52 104c1.200 18 1.200 44 0 62" stroke="#184F08" strokeWidth="2.500" strokeLinecap="round" fill="none" opacity="0.3" />
      <path d="M22 70c-6 6-9 13-10 22" stroke="#E4FBCB" strokeWidth="2.500" strokeLinecap="round" fill="none" opacity="0.4" />
    </svg>
  );
}

// The table top: warm honey wood with a soft light in the middle and flowing grain.
export function WoodTable({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 440" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={className}>
      <defs>
        <radialGradient id="wd-light" cx="0.5" cy="0.5" r="0.75"><stop offset="0" stopColor="#D9A050" /><stop offset="0.5" stopColor="#BC7B31" /><stop offset="1" stopColor="#8A5220" /></radialGradient>
        <filter id="wd-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.055" numOctaves="4" seed="11" />
          <feColorMatrix values="0 0 0 0 0.52  0 0 0 0 0.27  0 0 0 0 0.05  0 0 0 1.500 -0.620" />
        </filter>
        <filter id="wd-swirl" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.004" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="46" />
        </filter>
      </defs>
      <rect width="400" height="440" fill="url(#wd-light)" />
      <g filter="url(#wd-swirl)" fill="none" stroke="#7A4515" strokeLinecap="round">
        {[18, 52, 81, 118, 149, 186, 221, 252, 290, 324, 361, 396, 428].map((y, i) => <path key={y} d={`M-30 ${y}C80 ${y - 14} 150 ${y + 16} 230 ${y}S380 ${y - 12} 430 ${y + 6}`} strokeWidth={i % 3 === 0 ? 2.200 : 1.200} opacity={i % 2 ? 0.22 : 0.32} />)}
        {[36, 100, 168, 236, 306, 378].map((y) => <path key={y} d={`M-30 ${y}C90 ${y + 10} 200 ${y - 12} 430 ${y + 4}`} stroke="#FFE2A6" strokeWidth="1.600" opacity="0.28" />)}
      </g>
      <rect width="400" height="440" filter="url(#wd-grain)" opacity="0.5" />
    </svg>
  );
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
