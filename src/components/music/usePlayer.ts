"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Track } from "@/types";

// Uploaded tracks play through a real <audio> element. Sample tracks have no file yet,
// so a timer advances their position until the backend serves audio.
export function usePlayer(queue: Track[], onDuration: (id: string, seconds: number) => void) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const current = queue.find((track) => track.id === currentId) ?? null;
  const real = Boolean(current?.src);

  const start = useCallback((id: string) => {
    setCurrentId(id);
    setPosition(0);
    setPlaying(true);
    if (audioRef.current) audioRef.current.currentTime = 0;
  }, []);

  const step = useCallback((direction: 1 | -1, auto = false) => {
    if (!queue.length) return;
    if (auto && repeat && currentId) return start(currentId);
    const index = queue.findIndex((track) => track.id === currentId);
    const others = queue.filter((track) => track.id !== currentId);
    const next = shuffle && others.length ? others[Math.floor(Math.random() * others.length)] : queue[(index + direction + queue.length) % queue.length];
    start(next.id);
  }, [queue, currentId, repeat, shuffle, start]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !real) return;
    if (playing) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, [playing, real, currentId, position === 0]);

  useEffect(() => {
    if (!playing || !current || real) return;
    const timer = window.setInterval(() => setPosition((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [playing, current, real]);

  useEffect(() => {
    if (current && !real && current.duration && position >= current.duration) step(1, true);
  }, [position, current, real, step]);

  const seek = (seconds: number) => {
    setPosition(seconds);
    if (real && audioRef.current) audioRef.current.currentTime = seconds;
  };
  const audioProps = {
    ref: audioRef,
    src: current?.src,
    onTimeUpdate: () => setPosition(Math.floor(audioRef.current?.currentTime ?? 0)),
    onEnded: () => step(1, true),
    onLoadedMetadata: () => {
      const seconds = audioRef.current?.duration;
      if (current && seconds && Number.isFinite(seconds)) onDuration(current.id, Math.round(seconds));
    },
  };
  return {
    current, currentId, playing, position, shuffle, repeat, audioProps, seek, step,
    play: (id: string) => (id === currentId ? setPlaying((value) => !value) : start(id)),
    toggle: () => setPlaying((value) => !value),
    toggleShuffle: () => setShuffle((value) => !value),
    toggleRepeat: () => setRepeat((value) => !value),
  };
}
