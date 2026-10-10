"use client";
import type { ReactNode } from "react";
import { emojis } from "@/lib/emojis";
import { Dropdown } from "./Dropdown";

export function EmojiPicker({ label, trigger, triggerClassName, onPick, up = false }: { label: string; trigger: ReactNode; triggerClassName?: string; onPick: (emoji: string) => void; up?: boolean }) {
  return (
    <Dropdown label={label} trigger={trigger} triggerClassName={triggerClassName} align="left" up={up} className="min-w-[212px]">
      {(close) => <div className="grid grid-cols-5 gap-1">{emojis.map((emoji) => <button key={emoji} type="button" onClick={() => { onPick(emoji); close(); }} className="flex h-9 w-9 items-center justify-center rounded-lg text-lg hover:bg-surface-2">{emoji}</button>)}</div>}
    </Dropdown>
  );
}
