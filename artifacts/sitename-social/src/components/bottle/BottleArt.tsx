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
