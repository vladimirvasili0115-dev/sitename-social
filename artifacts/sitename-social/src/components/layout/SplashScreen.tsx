"use client";
import { useEffect, useState } from "react";

// Opening animation for the installed Android app only: black (dark theme) or white (light theme) screen, the logo spins like the bottle, then fades away.
// Shown once per app launch (sessionStorage), never in a normal browser tab.
export function SplashScreen() {
  const [stage, setStage] = useState<"off" | "dark" | "light">("off");
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let app = false;
    try { app = document.referrer.startsWith("android-app://") || window.matchMedia("(display-mode: fullscreen)").matches || window.matchMedia("(display-mode: standalone)").matches; } catch { app = false; }
    if (!app) return;
    try { if (window.sessionStorage.getItem("rv-splash")) return; window.sessionStorage.setItem("rv-splash", "1"); } catch { /* storage blocked: show once per page load */ }
    let theme: "dark" | "light" = "dark";
    try { const raw = window.localStorage.getItem("sitename-settings"); if (raw && (JSON.parse(raw) as { theme?: string }).theme === "light") theme = "light"; } catch { theme = "dark"; }
    setStage(theme);
    const leave = window.setTimeout(() => setLeaving(true), 2900);
    const done = window.setTimeout(() => setStage("off"), 3500);
    return () => { window.clearTimeout(leave); window.clearTimeout(done); };
  }, []);

  if (stage === "off") return null;
  const light = stage === "light";
  return (
    <div aria-hidden="true" className={`rv-splash${leaving ? " rv-splash-out" : ""}${light ? " rv-splash-light" : ""}`}>
      <style>{`
        .rv-splash{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;background:#000;transition:opacity .6s ease;opacity:1}
        .rv-splash-light{background:#fff}
        .rv-splash-out{opacity:0;pointer-events:none}
        .rv-splash-logo{position:relative;width:150px;height:150px}
        .rv-splash-logo::before{content:"";position:absolute;inset:-46px;border-radius:50%;background:radial-gradient(circle,rgba(255,107,107,.6),rgba(255,140,66,.2) 52%,transparent 72%);opacity:0;animation:rvGlow 3s ease-out .1s both}
        .rv-splash-light .rv-splash-logo::before{background:radial-gradient(circle,rgba(255,107,107,.38),rgba(255,140,66,.12) 52%,transparent 72%)}
        .rv-splash-logo svg{position:relative;width:100%;height:100%;overflow:visible;opacity:0;animation:rvLogo .8s cubic-bezier(.2,.9,.3,1.2) .1s both;filter:drop-shadow(0 10px 22px rgba(255,107,107,.35))}
        .rv-bottle{transform-box:view-box;transform-origin:222px 268px;animation:rvSpin 1.9s cubic-bezier(.12,.7,.2,1) .35s both}
        .rv-heart{transform-box:fill-box;transform-origin:center;opacity:0;animation:rvHeart .7s cubic-bezier(.2,1.6,.4,1) 1.9s both,rvBeat 1.1s ease-in-out 2.6s infinite}
        .rv-splash-word{font:700 36px/1 var(--font-inter),system-ui,sans-serif;letter-spacing:-.5px;color:#fff;opacity:0;transform:translateY(12px);animation:rvWord .8s ease 1.5s both}
        .rv-splash-light .rv-splash-word{color:#0F1B20}
        .rv-splash-word b{font-weight:700;background:linear-gradient(90deg,#FF6B6B,#FF8C42);-webkit-background-clip:text;background-clip:text;color:transparent}
        @keyframes rvLogo{0%{opacity:0;transform:scale(.5)}100%{opacity:1;transform:scale(1)}}
        @keyframes rvSpin{0%{transform:rotate(-765deg) scale(.6)}100%{transform:rotate(0) scale(1)}}
        @keyframes rvHeart{0%{opacity:0;transform:scale(0)}100%{opacity:1;transform:scale(1)}}
        @keyframes rvBeat{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}
        @keyframes rvGlow{0%{opacity:0;transform:scale(.5)}45%{opacity:1;transform:scale(1)}100%{opacity:.6;transform:scale(1.1)}}
        @keyframes rvWord{to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:reduce){.rv-splash-logo svg,.rv-bottle,.rv-heart,.rv-splash-word,.rv-splash-logo::before{animation-duration:.01s;animation-delay:0s;animation-iteration-count:1}}
      `}</style>
      <div className="rv-splash-logo">
        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <defs><linearGradient id="rvg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF6F91" /><stop offset=".55" stopColor="#FF6B6B" /><stop offset="1" stopColor="#FF8C42" /></linearGradient></defs>
          <rect width="512" height="512" rx="120" fill="url(#rvg)" />
          <g transform="translate(0 0)"><g className="rv-bottle"><g transform="translate(222 268) rotate(-45) scale(1.12)">
            <rect x="-23" y="-134" width="46" height="28" rx="9" fill="#FFD6E2" />
            <path d="M-18-106H18V-62C18-40 46-34 46-4V96Q46 126 16 126H-16Q-46 126-46 96V-4C-46-34-18-40-18-62Z" fill="#fff" />
            <rect x="-26" y="8" width="52" height="62" rx="13" fill="#FF6B9D" />
          </g></g></g>
          <g transform="translate(402 160) scale(1.25)"><g className="rv-heart"><path d="M0 34C-70-10-40-62 0-26 40-62 70-10 0 34Z" fill="#fff" /></g></g>
        </svg>
      </div>
      <div className="rv-splash-word">Rave<b>till</b></div>
    </div>
  );
}
