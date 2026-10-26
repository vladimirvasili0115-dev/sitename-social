"use client";
import { useEffect, useRef, useState } from "react";

// A small measuring panel for slow phones: open the game as /bottle/?perf=1.
// It shows the frames per second, the slowest frame, how many page elements there are, the memory (Chrome only) and the long freezes of the last 10 seconds.
// Tap the panel to copy one line of numbers that can be sent as a message.
type Reading = { fps: number; worst: number; nodes: number; heap: number | null; freezes: number; imgs: number; at: string };

export function PerfMeter() {
  const [reading, setReading] = useState<Reading | null>(null);
  const [copied, setCopied] = useState(false);
  const longTasks = useRef<number[]>([]);
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
      const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      setReading({
        fps: Math.round(frames / Math.max(seconds, 0.001)),
        worst: Math.round(worst),
        nodes: document.getElementsByTagName("*").length,
        heap: memory ? Math.round(memory.usedJSHeapSize / 1048576) : null,
        freezes: longTasks.current.length,
        imgs: document.images.length,
        at: new Date().toLocaleTimeString(),
      });
      frames = 0;
      worst = 0;
    }, 1000);
    return () => { stop = true; cancelAnimationFrame(raf); window.clearInterval(timer); observer?.disconnect(); };
  }, []);
  if (!reading) return null;
  const line = `FPS ${reading.fps}, slowest frame ${reading.worst} ms, elements ${reading.nodes}, images ${reading.imgs}, heap ${reading.heap ?? "?"} MB, freezes(10s) ${reading.freezes}, ${typeof navigator !== "undefined" ? navigator.userAgent : ""}`;
  const bad = reading.fps < 30 || reading.worst > 120;
  return (
    <button type="button" onClick={() => { try { void navigator.clipboard.writeText(line).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1500); }); } catch { /* clipboard is blocked */ } }}
      className={`fixed left-1 top-1 z-[400] rounded-md px-2 py-1 text-left font-mono text-[10px] leading-[1.35] text-white shadow ${bad ? "bg-[rgba(160,20,20,0.88)]" : "bg-[rgba(0,0,0,0.78)]"}`} aria-label="performance">
      <span className="block">FPS <b>{reading.fps}</b> · slowest <b>{reading.worst}</b> ms</span>
      <span className="block">elements <b>{reading.nodes}</b> · images <b>{reading.imgs}</b></span>
      <span className="block">heap <b>{reading.heap ?? "?"}</b> MB · freezes <b>{reading.freezes}</b></span>
      <span className="block text-[9px] opacity-80">{copied ? "copied ✓" : "tap = copy"}</span>
    </button>
  );
}
