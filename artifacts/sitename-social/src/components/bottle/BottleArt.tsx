// Original artwork for the game: a glass soda bottle with a plain red band (no brand marks).
export function BottleSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 200" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="bt-glass" x1="0" x2="1">
          <stop offset="0" stopColor="#3F8F86" /><stop offset="0.3" stopColor="#BFEDE3" /><stop offset="0.55" stopColor="#6FBFB2" /><stop offset="1" stopColor="#2C6F68" />
        </linearGradient>
        <linearGradient id="bt-band" x1="0" x2="1"><stop offset="0" stopColor="#A81717" /><stop offset="0.4" stopColor="#F03A2E" /><stop offset="1" stopColor="#9C1212" /></linearGradient>
        <linearGradient id="bt-cap" x1="0" x2="1"><stop offset="0" stopColor="#8C8C8C" /><stop offset="0.5" stopColor="#F2F2F2" /><stop offset="1" stopColor="#7A7A7A" /></linearGradient>
      </defs>
      <rect x="22" y="2" width="16" height="9" rx="2" fill="url(#bt-cap)" />
      <path d="M24 11h12v20c0 9 3 13 8 22 5 9 6 16 6 26 0 12-4 18-4 30s5 20 5 34v28c0 14-6 22-15 22h-12c-9 0-15-8-15-22v-28c0-14 5-22 5-34s-4-18-4-30c0-10 1-17 6-26 5-9 8-13 8-22z" fill="url(#bt-glass)" />
      <path d="M13.5 84h33c1.200 8-3 14-3 25s3 14 4.500 22h-36c1.500-8 4.500-11 4.500-22s-4.200-17-3-25z" fill="url(#bt-band)" />
      <path d="M18 52c-3 7-4 14-4 24" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M16 150c0 12 0 22 2 30" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.45" />
    </svg>
  );
}
