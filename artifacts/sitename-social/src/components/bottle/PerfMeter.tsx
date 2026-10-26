"use client";
import { useEffect, useRef, useState } from "react";
import { giftRpcStats } from "@/lib/rpcTiming";

// A small measuring panel for slow phones: open the game as /bottle/?perf=1.
// It shows the frames per second, the slowest frame, how many page elements there are, the memory (Chrome only) and the long freezes of the last 10 seconds.
// Tap the panel to copy one line of numbers that can be sent as a message.
type Reading = { fps: number; worst: number; nodes: number; heap: number | null; freezes: number; imgs: number; at: string; where: string; pics: string; rpc: ReturnType<typeof giftRpcStats> };


// Where the page elements are: the biggest groups of elements (so the heavy part of the game can be named) and the pictures counted by folder.
function breakdown(): { where: string; pics: string } {
  const sizes = new Map<Element, number>();
  const walk = (el: Element): number => { let total = 0; for (const child of Array.from(el.children)) total += 1 + walk(child); sizes.set(el, total); return total; };
  if (document.body) walk(document.body);
  const big = [...sizes.entries()].filter(([, n]) => n >= 120).sort((a, b) => b[1] - a[1]);
  // keep the deepest big groups: a parent is skipped when one child holds most of it
  const picked = big.filter(([el, n]) => !Array.from(el.children).some((child) => (sizes.get(child) ?? 0) >= n * 0.8)).slice(0, 6);
  const name = (el: Element) => `${el.tagName.toLowerCase()}${el.getAttribute("role") ? `[${el.getAttribute("role")}]` : ""}${el.id ? `#${el.id}` : ""}.${String(el.getAttribute("class") ?? "").split(/\s+/).filter(Boolean).slice(0, 3).join(".").slice(0, 46)}`;
  const where = picked.map(([el, n]) => `${name(el)}=${n}`).join(" | ");
  const kinds = new Map<string, number>();
  for (const img of Array.from(document.images)) {
    const path = (() => { try { return new URL(img.currentSrc || img.src).pathname; } catch { return "?"; } })();
    const kind = path.startsWith("data:") ? "data" : path.split("/").slice(1, 3).join("/") || "?";
    kinds.set(kind + (img.currentSrc.endsWith(".webp") ? "(webp)" : ""), (kinds.get(kind + (img.currentSrc.endsWith(".webp") ? "(webp)" : "")) ?? 0) + 1);
  }
  const pics = [...kinds.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => `${k}=${n}`).join(", ");
  return { where, pics };
}

export function PerfMeter({ lite }: { lite?: boolean }) {
  const [reading, setReading] = useState<Reading | null>(null);
  const [copied, setCopied] = useState(false);
  const longTasks = useRef<number[]>([]);
  const detail = useRef<{ where: string; pics: string }>({ where: "", pics: "" });
  const ticks = useRef(0);
  useEffect(() => {
    let frames = 0, worst = 0, last = performance.now(), stop = false, raf = 0;
    const tick = (now: number) => {
      if (stop) return;
      frames++;
      worst = Math.max(worst, now - last);
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver((list) => { for (const entry of list.getEntries()) longTasks.current.push(entry.startTime + entry.duration); });
      observer.observe({ type: "longtask", buffered: false });
    } catch { /* long tasks are not reported by this browser */ }
    const started = performance.now();
    let before = started;
    const timer = window.setInterval(() => {
      const now = performance.now();
      const seconds = (now - before) / 1000;
      before = now;
      longTasks.current = longTasks.current.filter((end) => now - end < 10000);
      if (ticks.current++ % 3 === 0) { try { detail.current = breakdown(); } catch { /* the page changed while it was read */ } }
      const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      setReading({
        fps: Math.round(frames / Math.max(seconds, 0.001)),
        worst: Math.round(worst),
        nodes: document.getElementsByTagName("*").length,
        heap: memory ? Math.round(memory.usedJSHeapSize / 1048576) : null,
        freezes: longTasks.current.length,
        imgs: document.images.length,
        at: new Date().toLocaleTimeString(),
        rpc: giftRpcStats(),
        ...detail.current,
      });
      frames = 0;
      worst = 0;
    }, 1000);
    return () => { stop = true; cancelAnimationFrame(raf); window.clearInterval(timer); observer?.disconnect(); };
  }, []);
  if (!reading) return null;
  const line = `FPS ${reading.fps}, slowest frame ${reading.worst} ms, elements ${reading.nodes}, images ${reading.imgs}, heap ${reading.heap ?? "?"} MB, freezes(10s) ${reading.freezes}, lite=${lite ? "ON" : "off"}, GIFT-SERVER(10s) calls ${reading.rpc.n} avg ${reading.rpc.avg} ms max ${reading.rpc.max} ms failed ${reading.rpc.fail} waiting ${reading.rpc.pending}, BIGGEST: ${reading.where}, PICTURES: ${reading.pics}, ${typeof navigator !== "undefined" ? navigator.userAgent : ""}`;
  const bad = reading.fps < 30 || reading.worst > 120;
  return (
    <button type="button" onClick={() => { try { void navigator.clipboard.writeText(line).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1500); }); } catch { /* clipboard is blocked */ } }}
      className={`fixed left-1 top-1 z-[400] rounded-md px-2 py-1 text-left font-mono text-[10px] leading-[1.35] text-white shadow ${bad ? "bg-[rgba(160,20,20,0.88)]" : "bg-[rgba(0,0,0,0.78)]"}`} aria-label="performance">
      <span className="block">FPS <b>{reading.fps}</b> · slowest <b>{reading.worst}</b> ms</span>
      <span className="block">elements <b>{reading.nodes}</b> · images <b>{reading.imgs}</b></span>
      <span className="block">heap <b>{reading.heap ?? "?"}</b> MB · freezes <b>{reading.freezes}</b></span>
      <span className="block">gift server <b>{reading.rpc.avg}</b> ms avg · <b>{reading.rpc.max}</b> max · calls <b>{reading.rpc.n}</b> · failed <b>{reading.rpc.fail}</b> · waiting <b>{reading.rpc.pending}</b></span>
      <span className="block text-[9px] opacity-80">{copied ? "copied ✓" : "tap = copy"}</span>
    </button>
  );
}
