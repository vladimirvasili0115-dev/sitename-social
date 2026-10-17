"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, SendHorizontal, Trash2 } from "lucide-react";
import { formatDuration } from "@/lib/format";
import { useTranslation } from "@/i18n/useTranslation";

const MAX_SECONDS = 120;
const tool = "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-text";

// Records a voice message from the microphone. While recording it replaces the text input with a timer.
export function VoiceRecorder({ onRecorded, onActiveChange }: { onRecorded: (audio: Blob) => void; onActiveChange: (active: boolean) => void }) {
  const { t } = useTranslation();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [denied, setDenied] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const keepRef = useRef(false);

  const finish = (keep: boolean) => {
    keepRef.current = keep;
    recorderRef.current?.stop();
  };

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (keepRef.current && chunksRef.current.length) onRecorded(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
        setRecording(false);
        onActiveChange(false);
      };
      recorderRef.current = recorder;
      recorder.start();
      setDenied(false);
      setSeconds(0);
      setRecording(true);
      onActiveChange(true);
    } catch {
      setDenied(true);
    }
  }

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);
  useEffect(() => {
    if (recording && seconds >= MAX_SECONDS) finish(true);
  }, [recording, seconds]);
  useEffect(() => () => {
    keepRef.current = false;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  if (!recording) {
    return <button type="button" onClick={start} aria-label={t("messages.record")} title={t(denied ? "messages.micDenied" : "messages.record")} className={`${tool} ${denied ? "text-danger" : ""}`}><Mic size={19} /></button>;
  }
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <button type="button" onClick={() => finish(false)} aria-label={t("common.cancel")} title={t("common.cancel")} className={tool}><Trash2 size={18} /></button>
      <p role="status" className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-border bg-surface-2 px-4 text-sm text-text">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-danger motion-safe:animate-pulse" />
        <span className="tabular-nums">{formatDuration(seconds)}</span>
        <span className="truncate text-muted">{t("messages.recording")}</span>
      </p>
      <button type="button" onClick={() => finish(true)} aria-label={t("messages.send")} title={t("messages.send")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-bg"><SendHorizontal size={18} /></button>
    </div>
  );
}
