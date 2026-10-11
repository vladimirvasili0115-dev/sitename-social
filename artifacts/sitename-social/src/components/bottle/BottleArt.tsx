// Original artwork for the game: an emerald glass bottle with a gold foil neck and a small heart label (no brand marks).
export function BottleSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 200" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="bt-glass" x1="0" x2="1">
          <stop offset="0" stopColor="#064E2B" /><stop offset="0.22" stopColor="#15A050" /><stop offset="0.42" stopColor="#5BE08A" /><stop offset="0.6" stopColor="#12994A" /><stop offset="1" stopColor="#043B20" />
        </linearGradient>
        <linearGradient id="bt-gold" x1="0" x2="1"><stop offset="0" stopColor="#9A6F08" /><stop offset="0.45" stopColor="#FFE48A" /><stop offset="1" stopColor="#8A5F05" /></linearGradient>
        <linearGradient id="bt-label" x1="0" x2="1"><stop offset="0" stopColor="#E9DDBE" /><stop offset="0.45" stopColor="#FFFBEF" /><stop offset="1" stopColor="#D9CBA6" /></linearGradient>
      </defs>
      <ellipse cx="30" cy="197" rx="17" ry="2.500" fill="#000000" opacity="0.18" />
      <path d="M24.500 14h11v34c0 12 14.500 20 14.500 44v84c0 12-6 20-15 20H25c-9 0-15-8-15-20V92c0-24 14.500-32 14.500-44z" fill="url(#bt-glass)" />
      <path d="M12 176c0 11 5 17 13 17h10c8 0 13-6 13-17" fill="none" stroke="#032D18" strokeWidth="2" opacity="0.5" />
      <rect x="22.500" y="3" width="15" height="13" rx="2.500" fill="url(#bt-gold)" />
      <path d="M24 16h12v22c-3 2-9 2-12 0z" fill="url(#bt-gold)" />
      <path d="M24 30h12" stroke="#7A5506" strokeWidth="1" opacity="0.6" />
      <rect x="10" y="108" width="40" height="46" fill="url(#bt-label)" />
      <path d="M10 108h40v3.500H10zM10 150.500h40v3.500H10z" fill="url(#bt-gold)" />
      <path d="M30 142c-9-6.500-13-11-13-16.500 0-4.500 3.300-7.500 7-7.500 2.600 0 4.800 1.400 6 3.600 1.200-2.200 3.400-3.600 6-3.600 3.700 0 7 3 7 7.500 0 5.500-4 10-13 16.500z" fill="#E5334B" />
      <path d="M17 62c-3 9-3.500 20-3.500 36" stroke="#D8FFE6" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M15.500 160c0 9 .5 16 2 22" stroke="#D8FFE6" strokeWidth="2.500" strokeLinecap="round" fill="none" opacity="0.45" />
      <path d="M43 70c2 8 3 16 3 26" stroke="#02301A" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.35" />
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
