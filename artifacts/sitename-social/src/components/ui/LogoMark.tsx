// NudePart mark: a warm gradient tile with a tilted bottle whose neck points at a small heart — the spin-the-bottle game in one sign.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="np-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF4D8D" /><stop offset="1" stopColor="#FF8A3D" /></linearGradient>
        <linearGradient id="np-shine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.35" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#np-bg)" />
      <path d="M0 16A16 16 0 0 1 16 0h32a16 16 0 0 1 16 16v8C44 30 20 30 0 24z" fill="url(#np-shine)" />
      <g transform="rotate(-45 30 36)">
        <rect x="25" y="26" width="12" height="26" rx="5" fill="#fff" />
        <rect x="28" y="16" width="6" height="12" rx="2.5" fill="#fff" />
        <rect x="27" y="14" width="8" height="4" rx="1.5" fill="#FFE1EC" />
        <rect x="27.5" y="33" width="7" height="9" rx="2" fill="#FF4D8D" opacity="0.85" />
      </g>
      <path d="M47.5 21.5c-1.9-3.4-6.6-2.4-6.6 1.2 0 2.7 3.6 5 6.6 7.3 3-2.3 6.6-4.6 6.6-7.3 0-3.6-4.7-4.6-6.6-1.2z" fill="#fff" />
    </svg>
  );
}
