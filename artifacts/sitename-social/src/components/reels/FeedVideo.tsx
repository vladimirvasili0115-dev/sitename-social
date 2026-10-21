"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
import { playOnly, reels } from "./reelsStore";

// A video in the feed: it starts by itself (without sound) when it is mostly on screen and stops when you scroll
// past it; only one plays at a time. A tap opens the full-screen viewer (swipe up for the next video).
export function FeedVideo({ id, src }: { id: string; src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const watch = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) { playOnly(video); void video.play().catch(() => {}); }
      else if (!video.paused) video.pause();
    }, { threshold: [0, 0.6, 1] });
    watch.observe(video);
    return () => watch.disconnect();
  }, []);
  return (
    <div className="relative bg-black">
      <video ref={ref} src={src} muted={muted} loop playsInline preload="metadata" onPlay={(event) => { playOnly(event.currentTarget); setPlaying(true); }} onPause={() => setPlaying(false)}
        onClick={() => { ref.current?.pause(); reels.open(id); }} className="max-h-[600px] w-full cursor-pointer object-contain" />
      {playing ? null : <span className="pointer-events-none absolute inset-0 flex items-center justify-center"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-white"><Play size={26} fill="currentColor" /></span></span>}
      <button type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? "unmute" : "mute"} className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white">{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
    </div>
  );
}
