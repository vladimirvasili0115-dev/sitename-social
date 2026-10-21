// A finished call leaves one line in the private chat (like WhatsApp): "[call:done:151]", "[call:missed]" …
export type CallLog = { kind: "done" | "missed" | "declined" | "busy" | "cancelled" | "failed"; secs: number };
export function parseCallLog(text: string | undefined): CallLog | null {
  const match = /^\[call:(done|missed|declined|busy|cancelled|failed)(?::(\d+))?\]$/.exec(text ?? "");
  return match ? { kind: match[1] as CallLog["kind"], secs: Number(match[2] ?? 0) } : null;
}
export const callLogText = (kind: CallLog["kind"], secs = 0) => (kind === "done" ? `[call:done:${Math.round(secs)}]` : `[call:${kind}]`);
export const clock = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
